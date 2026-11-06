"""Soundtrack for the animated CV: a soft ambient pad with wooden abacus clicks.

Pure standard library, so it runs anywhere: python3 make_audio.py
Writes public/soundtrack.wav (60 s, 44.1 kHz, mono).
"""
import math, random, struct, wave

SR = 44100
DUR = 60.0
N = int(SR * DUR)
random.seed(7)

# Chords (Hz) that change with the scenes: A minor -> F -> C -> G -> A minor
CHORDS = [
    (0, [110.0, 164.8, 220.0, 261.6]),
    (7, [87.3, 130.8, 174.6, 220.0]),
    (15, [98.0, 146.8, 196.0, 246.9]),
    (25, [130.8, 196.0, 261.6, 329.6]),
    (37, [87.3, 130.8, 174.6, 261.6]),
    (46, [98.0, 146.8, 196.0, 293.7]),
    (53, [110.0, 164.8, 220.0, 329.6]),
]
# Bead clicks (seconds): scene changes and the moments numbers land
CLICKS = [0.4, 2.4, 7.0, 9.0, 11.0, 13.0, 15.0, 16.6, 18.2, 19.8, 21.4, 25.0, 28.0, 31.0, 34.0, 37.0, 39.0, 41.5, 46.0, 47.0, 48.0, 49.0, 50.0, 51.0, 53.0, 54.5, 57.0]


def chord_at(t):
    cur = CHORDS[0][1]
    for start, notes in CHORDS:
        if t >= start:
            cur = notes
    return cur


out = [0.0] * N
# pad: detuned sines with slow swell and crossfades at chord changes
for i in range(N):
    t = i / SR
    notes = chord_at(t)
    swell = 0.55 + 0.45 * math.sin(2 * math.pi * t / 12.0 - 1.2)
    v = 0.0
    for k, f in enumerate(notes):
        v += math.sin(2 * math.pi * f * t) * 0.6 + math.sin(2 * math.pi * f * 1.003 * t + k) * 0.4
    # fade in / fade out
    env = min(1.0, t / 3.0) * min(1.0, (DUR - t) / 3.0)
    out[i] = v * 0.028 * swell * env

# clicks: a short filtered noise burst plus a woody resonance (two beads touching)
def click(t0, gain=0.5, pitch=1800.0):
    start = int(t0 * SR)
    for j in range(int(0.09 * SR)):
        idx = start + j
        if idx >= N:
            break
        tt = j / SR
        env = math.exp(-tt * 70.0)
        body = math.sin(2 * math.pi * pitch * tt) * math.exp(-tt * 45.0)
        body2 = math.sin(2 * math.pi * pitch * 1.52 * tt) * math.exp(-tt * 60.0) * 0.5
        noise = (random.random() * 2 - 1) * math.exp(-tt * 300.0) * 0.4
        out[idx] += (body + body2 + noise) * env * gain

for k, t0 in enumerate(CLICKS):
    click(t0, 0.32, 1500.0 + (k % 4) * 140.0)
    click(t0 + 0.055, 0.18, 1900.0 + (k % 3) * 90.0)   # the second bead it hits

peak = max(abs(x) for x in out) or 1.0
scale = 0.85 / peak
with wave.open('public/soundtrack.wav', 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, x * scale)) * 32767)) for x in out))
print('wrote public/soundtrack.wav', len(out) / SR, 's')
