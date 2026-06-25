from flask import Flask, render_template, jsonify, request, session
from random import shuffle
import uuid

app = Flask(__name__)
app.secret_key = 'thuruppu-dev-key'

SUIT_NAMES = ["spades", "hearts", "diamonds", "clubs"]
SUIT_SYMBOLS = ["♠", "♥", "♦", "♣"]
RANK_NAMES = {1: "A", 9: "9", 10: "10", 11: "J", 12: "Q", 13: "K"}
CARD_POWERS = {11: 3, 9: 2, 1: 1.0001, 10: 1, 13: 0.0001, 12: 0}
PLAYER_NAMES = ["South", "West", "North", "East"]
TEAM_NAMES = ["Red Team", "Blue Team"]

class Card:
    def __init__(self, suit, rank, card_id):
        self.suit = suit
        self.rank = rank
        self.card_id = card_id

    def get_power(self):
        return CARD_POWERS[self.rank]

    def get_suit_class(self):
        return SUIT_NAMES[self.suit]

    def get_rank_text(self):
        return RANK_NAMES[self.rank]

    def get_suit_symbol(self):
        return SUIT_SYMBOLS[self.suit]

    def serialize(self):
        return {
            "card_id": self.card_id,
            "suit": self.suit,
            "rank": self.rank,
            "suit_class": self.get_suit_class(),
            "rank_text": self.get_rank_text(),
            "suit_symbol": self.get_suit_symbol(),
            "power": self.get_power()
        }


def create_deck(packs=1):
    cards = []
    t2_ranks = [1, 9, 10, 11, 12, 13]
    for pack in range(packs):
        for suit in range(4):
            for rank in t2_ranks:
                cid = f"{suit}_{rank}_{pack}" if packs > 1 else f"{suit}_{rank}"
                cards.append(Card(suit, rank, cid))
    return cards


class Trick:
    def __init__(self, leader):
        self.leader = leader
        self.cards = []  # (player, Card)
        self.led_suit = None
        self.winner = None

    def add_card(self, player, card):
        if not self.cards:
            self.led_suit = card.suit
        self.cards.append((player, card))

    def is_complete(self):
        return len(self.cards) == 4

    def get_winner(self, trump_suit):
        if not self.is_complete():
            return None

        lead_suit = self.cards[0][1].suit
        winner = self.cards[0]
        for player, card in self.cards[1:]:
            winner_player, winner_card = winner
            if card.suit == trump_suit and winner_card.suit != trump_suit:
                winner = (player, card)
            elif card.suit == trump_suit and winner_card.suit == trump_suit:
                if card.get_power() > winner_card.get_power():
                    winner = (player, card)
            elif card.suit == lead_suit and winner_card.suit == lead_suit:
                if card.get_power() > winner_card.get_power():
                    winner = (player, card)
        return winner[0]

    def get_points(self, trump_suit):
        total = 0
        for _, card in self.cards:
            total += card.get_power()
        return total


class Game:
    def __init__(self):
        self.game_id = str(uuid.uuid4())[:8]
        self.packs = 1
        self.reset()

    def reset(self):
        self.cards = create_deck(self.packs)
        self.hands = [[], [], [], []]
        self.trump_suit = None
        self.current_player = 0
        self.tricks = []
        self.current_trick_cards = []  # (player, card)
        self.team_scores = [0, 0]
        self.round_scores = [0, 0]
        self.phase = "dealing"  # dealing, bidding, pick_trump, playing, round_over, game_over
        self.led_player = 0
        self.trick_number = 0
        self.total_tricks = 0
        self.winner = None
        self.message = ""
        self.trump_caller = None
        self.trump_team = None
        self.expected_score = 0

    def deal(self, packs=None):
        if packs is not None:
            self.packs = packs
        self.reset()
        shuffle(self.cards)
        for i, card in enumerate(self.cards):
            player = i % 4
            self.hands[player].append(card)
        suit_order = {0: 0, 2: 1, 3: 2, 1: 3}  # Spades, Diamonds, Clubs, Hearts
        for hand in self.hands:
            hand.sort(key=lambda c: (suit_order[c.suit], -c.get_power()))
        self.total_tricks = len(self.cards) // 4
        self.phase = "pick_trump"
        self.message = "Pick the trump suit"
        return self.get_state()

    def get_team_size(self):
        return self.packs * 28

    def set_trump(self, suit, caller=None, expected=None):
        self.trump_suit = suit
        self.trump_caller = caller if caller is not None else 0
        self.trump_team = self.trump_caller % 2
        self.expected_score = expected if expected is not None else 3
        self.phase = "playing"
        self.current_player = self.trump_caller
        self.led_player = self.trump_caller
        self.trick_number = 0
        self.current_trick_cards = []
        caller_name = PLAYER_NAMES[self.trump_caller]
        team_name = TEAM_NAMES[self.trump_team]
        self.message = f"Trump: {SUIT_NAMES[suit]} ({SUIT_SYMBOLS[suit]}) | {caller_name} ({team_name}) bids {self.expected_score}/{self.get_team_size()}"
        return self.get_state()

    def get_player_name(self, player):
        return PLAYER_NAMES[player]

    def play_card(self, player, card_id):
        if self.phase != "playing":
            return {"error": "Game is not in playing phase"}

        if player != self.current_player:
            return {"error": f"It's {PLAYER_NAMES[self.current_player]}'s turn"}

        card = None
        for c in self.hands[player]:
            if c.card_id == card_id:
                card = c
                break

        if not card:
            return {"error": "Card not found in hand"}

        if self.current_trick_cards:
            led_suit = self.current_trick_cards[0][1].suit
            if card.suit != led_suit:
                has_led_suit = any(c.suit == led_suit for c in self.hands[player])
                if has_led_suit:
                    return {"error": f"Must follow {SUIT_NAMES[led_suit]}"}

        self.hands[player].remove(card)
        self.current_trick_cards.append((player, card))

        if len(self.current_trick_cards) < 4:
            self.current_player = (self.current_player + 1) % 4
            return {"state": self.get_state(), "played": True, "message": f"{PLAYER_NAMES[self.current_player]}'s turn"}

        winner = self._resolve_trick()
        points = self._get_trick_points()
        completed_trick_data = [(p, c.serialize()) for p, c in self.current_trick_cards]
        self.tricks.append(list(self.current_trick_cards))
        self.round_scores[winner % 2] += points
        self.trick_number += 1

        trick_str = " ".join(f"{c.get_rank_text()}{c.get_suit_symbol()}" for _, c in self.current_trick_cards)
        winner_name = PLAYER_NAMES[winner]

        if self.trick_number >= self.total_tricks:
            self.phase = "round_over"
            self.team_scores[0] += self.round_scores[0]
            self.team_scores[1] += self.round_scores[1]

            caller_team = self.trump_team
            caller_met_bid = self.expected_score is not None and self.round_scores[caller_team] >= self.expected_score
            bid_status = "MADE bid" if caller_met_bid else "MISSED bid"

            if self.team_scores[caller_team] >= self.get_team_size():
                self.phase = "game_over"
                self.winner = caller_team
                self.message = f"Game over! {TEAM_NAMES[caller_team]} wins!"
            else:
                ts = self.get_team_size()
                self.message = f"Round over! {TEAM_NAMES[caller_team]} {bid_status} (needed {self.expected_score:.0f}, got {self.round_scores[caller_team]:.0f}) | {TEAM_NAMES[0]}={self.team_scores[0]:.0f}/{ts} {TEAM_NAMES[1]}={self.team_scores[1]:.0f}/{ts}"
            self.current_trick_cards = []
        else:
            self.current_trick_cards = []
            self.current_player = winner
            self.led_player = winner
            self.message = f"Trick #{self.trick_number} | {points}pts | Winner: {winner_name} | {PLAYER_NAMES[winner]} leads"

        return {"state": self.get_state(), "played": True, "trick_result": True, "completed_trick": completed_trick_data}

    def _resolve_trick(self):
        if not self.current_trick_cards:
            return None
        lead_suit = self.current_trick_cards[0][1].suit
        winner = self.current_trick_cards[0]
        for player, card in self.current_trick_cards[1:]:
            w_player, w_card = winner
            if card.suit == self.trump_suit and w_card.suit != self.trump_suit:
                winner = (player, card)
            elif card.suit == self.trump_suit and w_card.suit == self.trump_suit:
                if card.get_power() > w_card.get_power():
                    winner = (player, card)
            elif card.suit == lead_suit and w_card.suit == lead_suit:
                if card.get_power() > w_card.get_power():
                    winner = (player, card)
        return winner[0]

    def _get_trick_points(self):
        return sum(c.get_power() for _, c in self.current_trick_cards)

    def get_state(self):
        return {
            "game_id": self.game_id,
            "phase": self.phase,
            "hands": [[c.serialize() for c in hand] for hand in self.hands],
            "trump_suit": self.trump_suit,
            "trump_name": SUIT_NAMES[self.trump_suit] if self.trump_suit is not None else None,
            "trump_symbol": SUIT_SYMBOLS[self.trump_suit] if self.trump_suit is not None else None,
            "current_player": self.current_player,
            "led_player": self.led_player,
            "trick_number": self.trick_number,
            "current_trick": [(p, c.serialize()) for p, c in self.current_trick_cards],
            "team_scores": self.team_scores,
            "round_scores": self.round_scores,
            "message": self.message,
            "winner": self.winner,
            "trump_caller": self.trump_caller,
            "trump_team": self.trump_team,
            "expected_score": self.expected_score,
            "total_tricks": self.total_tricks,
            "packs": self.packs
        }


game = Game()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/game/deal', methods=['POST'])
def deal():
    data = request.get_json() or {}
    packs = data.get('packs', 1)
    state = game.deal(packs=packs)
    return jsonify(state)


@app.route('/game/trump', methods=['POST'])
def set_trump():
    data = request.get_json()
    suit = data.get('suit')
    if suit is None or suit < 0 or suit > 3:
        return jsonify({"error": "Invalid suit"}), 400
    caller = data.get('caller', 0)
    expected = data.get('expected', 3)
    state = game.set_trump(suit, caller, expected)
    return jsonify(state)


@app.route('/game/play', methods=['POST'])
def play():
    data = request.get_json()
    player = data.get('player', 0)
    card_id = data.get('card_id')
    if not card_id:
        return jsonify({"error": "No card specified"}), 400
    result = game.play_card(player, card_id)
    return jsonify(result)


@app.route('/game/state', methods=['GET'])
def get_state():
    return jsonify(game.get_state())


@app.route('/game/new', methods=['POST'])
def new_game():
    game.__init__()
    return jsonify({"status": "ok"})


if __name__ == '__main__':
    app.run(debug=True)
