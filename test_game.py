import requests, json, sys, time
BASE = "http://127.0.0.1:5000"

requests.post(f"{BASE}/game/new")
r = requests.post(f"{BASE}/game/deal")
s = r.json()
print(f"Deal: phase={s['phase']} hands={[len(h) for h in s['hands']]}")

r = requests.post(f"{BASE}/game/trump", json={"suit": 1, "caller": 0, "expected": 3})
s = r.json()
print(f"Trump: phase={s['phase']} player={s['current_player']} trump={s['trump_name']}")

total = 0
for trick in range(7):
    for p in range(4):
        if s['phase'] != 'playing':
            print(f"Break at trick {trick}: phase={s['phase']}")
            break
        hand = s['hands'][s['current_player']]
        if not hand:
            print(f"No cards left for player {s['current_player']}")
            break
        card = hand[0]
        r = requests.post(f"{BASE}/game/play", json={"player": s['current_player'], "card_id": card['card_id']})
        result = r.json()
        if 'error' in result and result['error']:
            print(f"Error at play {total}: {result['error']}")
            break
        s = result.get('state', result)
        total += 1
    else:
        continue
    break

print(f"Total plays: {total}")
print(f"Round scores: T1={s['round_scores'][0]}, T2={s['round_scores'][1]}")
print(f"Phase: {s['phase']}")
if s['phase'] == 'game_over':
    print(f"Winner team: {s['winner']}")
