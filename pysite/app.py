from flask import Flask, render_template, jsonify, request
from random import shuffle

app = Flask(__name__)

class Card:
    def __init__(self, suit, rank, pack, index):
        self.suit = suit
        self.rank = rank
        self.pack = pack
        self.index = index
        self.random_split_player = None
        self.random_split_index = None
        self.random_split_hand_index = None
        self.random_split_hand_size = None

    def get_suit_class(self):
        suits = ["spades", "hearts", "diamonds", "clubs"]
        return suits[self.suit]

    def get_rank_text(self):
        if self.rank == 1:
            return "A"
        elif self.rank == 11:
            return "J"
        elif self.rank == 12:
            return "Q"
        elif self.rank == 13:
            return "K"
        return str(self.rank)

    def get_suit_symbol(self):
        symbols = ["♠", "♥", "♦", "♣"]
        return symbols[self.suit]

    def get_card_power(self):
        if self.rank == 11:
            return 3  # J
        elif self.rank == 9:
            return 2  # 9
        elif self.rank == 1:
            return 1.1  # A
        elif self.rank == 10:
            return 0.9  # 10
        elif self.rank == 13:
            return 0.11  # K
        elif self.rank == 12:
            return 0  # Q
        return 0

class Deck:
    def __init__(self):
        self.cards = []
        self.create_cards()

    def create_cards(self):
        num_packs = 1
        t2_ranks = [1, 9, 10, 11, 12, 13]  # A, 9, 10, J, Q, K
        for pack in range(num_packs):
            for suit in range(4):
                for rank in t2_ranks:
                    card = Card(suit, rank, pack, len(self.cards))
                    self.cards.append(card)

    def random_split(self):
        # Shuffle cards
        shuffle(self.cards)

        # Group cards by player
        hands = [[] for _ in range(4)]
        for i, card in enumerate(self.cards):
            player = i % 4
            hands[player].append(card)
            card.random_split_player = player
            card.random_split_index = i // 4

        # Sort each hand by card power and suit
        suit_order = {1: 0, 0: 1, 2: 2, 3: 3}  # Hearts, Spades, Diamonds, Clubs
        hand_logs = []
        for player, hand in enumerate(hands):
            hand.sort(key=lambda card: (suit_order[card.suit], -card.get_card_power()))
            for j, card in enumerate(hand):
                card.random_split_hand_index = j
                card.random_split_hand_size = len(hand)
            # Log sorted hand
            hand_text = ", ".join(f"{c.get_rank_text()}{c.get_suit_symbol()}({c.get_card_power()})" for c in hand)
            hand_logs.append(f"Player {player + 1} sorted hand: {hand_text}")

        # Prepare card data for client
        card_data = [
            {
                "index": card.index,
                "suit_class": card.get_suit_class(),
                "rank": card.rank,
                "player": card.random_split_player,
                "hand_index": card.random_split_hand_index,
                "hand_size": card.random_split_hand_size
            }
            for card in self.cards
        ]
        return card_data, hand_logs

# Global deck instance
deck = Deck()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/random_split', methods=['POST'])
def random_split():
    card_data, hand_logs = deck.random_split()
    return jsonify({"cards": card_data, "logs": hand_logs})

if __name__ == '__main__':
    app.run(debug=True)