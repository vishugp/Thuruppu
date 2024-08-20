import random

# Global options
class Options:
    def __init__(self):
        self.card_size = {
            "width": 69,
            "height": 94,
            "padding": 18
        }
        self.animation_speed = 500
        self.table = None  # Placeholder for table
        self.cardback = 'red'
        self.aces_high = False
        self.cards_url = 'img/cards.png'
        self.black_joker = False
        self.red_joker = False
        self.type = 'STANDARD'
        self.loop = 1

# Card class
class Card:
    def __init__(self, suit, rank):
        self.short_name = f"{suit}{rank}"
        self.suit = suit
        self.rank = rank
        self.name = f"{suit.upper()}{rank}"
        self.face_up = False

    def __str__(self):
        return self.name

    def show_card(self):
        pass  # Placeholder for showing the card

    def hide_card(self):
        pass  # Placeholder for hiding the card

    def move_to(self, x, y):
        pass  # Placeholder for moving the card

# Container class (similar to an array of cards)
class Container(list):
    def __init__(self):
        self.x = 0
        self.y = 0
        self.face_up = False

    def add_card(self, card):
        self.append(card)
        card.container = self

    def remove_card(self, card):
        self.remove(card)

    def render(self):
        pass  # Placeholder for rendering cards

# Deck class, inherits from Container
class Deck(Container):
    def __init__(self):
        super().__init__()
        self.cards = []
        self.init_deck()

    def init_deck(self):
        suits = ['h', 's', 'd', 'c']
        for suit in suits:
            for rank in range(1, 14):
                card = Card(suit, rank)
                self.cards.append(card)
        self.shuffle()

    def shuffle(self):
        random.shuffle(self.cards)

    def deal(self, count, hands):
        for _ in range(count):
            for hand in hands:
                if self.cards:
                    hand.add_card(self.cards.pop())

# Hand class, inherits from Container
class Hand(Container):
    def __init__(self):
        super().__init__()

    def render(self):
        pass  # Placeholder for rendering hand of cards

# Pile class, inherits from Container
class Pile(Container):
    def __init__(self):
        super().__init__()

    def deal(self, count, hands):
        for _ in range(count):
            for hand in hands:
                if self:
                    hand.add_card(self.pop())

# Game class to manage game state
class Game:
    def __init__(self):
        self.options = Options()
        self.deck = Deck()
        self.hands = [Hand(), Hand()]  # Two hands for two players

    def start(self):
        # Shuffle the deck
        self.deck.shuffle()

        # Deal 5 cards to each hand
        self.deck.deal(5, self.hands)

        # Show hands
        for i, hand in enumerate(self.hands):
            print(f"Player {i + 1}'s hand: {[str(card) for card in hand]}")

if __name__ == "__main__":
    game = Game()
    game.start()
