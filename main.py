import random
import numpy as np

suits = ['C','D','H','S']
suits = ["♠","♣","♥","♦" ]
ranks  = {  "J":3,
            "9":2,
            "A":1,"10":1,
            "K":0,"Q":0
}
delim = "|"

def cards_distributor(num_players = 4):
    
    cards = [[i+delim+k for k in suits] for i in ranks.keys()]
    cards = [i for j in cards for i in j]
    random.shuffle(cards)
    players_deck = {k+1:list(hand) for k, hand in enumerate(np.array_split(cards,num_players))}
    return players_deck

def deck_power(deck):
    power = np.sum([ranks[i.split(delim)[0]] for i in deck])
    return power

def trump_power(deck):
    trumps = {k:0 for k in suits}
    for card in deck: 
        trumps[card.split(delim)[-1]]=trumps[card.split(delim)[-1]] + 1 + ranks[card.split(delim)[0]]
    return {k:v for k,v  in sorted(trumps.items(), key = lambda x: -x[1])}

if __name__=="__main__":
    print("Starting the Game of 28!")


    print("\nDistributing cards")
    player_decks = cards_distributor(4)
    _player = {}
    for player, deck in player_decks.items():
        _player[player] = {} 
        sorted_deck = sorted(deck, key = lambda x: -ranks[x.split(delim)[0]])
        _player[player]['cards'] = sorted_deck
        _player[player]['deck_power'] = deck_power(deck)
        _player[player]['trump_power'] = trump_power(deck)

        if player%2==0: _player[player]['team'] = 'B'
        else: _player[player]['team'] = 'A'

        print(f" \n Player {player}: {', '.join(sorted_deck)} \t Power: {deck_power(deck)}")
        print(f"\t{trump_power(deck)}")

    for suit in suits:
        print(f"Suit {suit} \tTeam A: {np.sum([_player[i]['trump_power'][suit] for i in _player.keys() if _player[i]['team']=='A'])}\tTeam B: {np.sum([_player[i]['trump_power'][suit] for i in _player.keys() if _player[i]['team']=='B'])}")