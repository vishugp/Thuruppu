from flask import Flask, render_template, jsonify

app = Flask(__name__)

# Initialize deck and hands as global variables
deck = []
upperhand = []
lowerhand = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/init_game')
def init_game():
    global deck, upperhand, lowerhand
    deck = [{'suit': suit, 'rank': rank} for suit in ['h', 's', 'd', 'c'] for rank in range(1, 14)]
    upperhand = []
    lowerhand = []
    return jsonify({"status": "initialized", "deck_count": len(deck)})

@app.route('/deal_cards')
def deal_cards():
    global deck, upperhand, lowerhand
    if len(deck) >= 10:
        upperhand = deck[:5]
        lowerhand = deck[5:10]
        deck = deck[10:]
        return jsonify({"upperhand": upperhand, "lowerhand": lowerhand})
    return jsonify({"error": "Not enough cards to deal!"})

if __name__ == '__main__':
    app.run(debug=True)
