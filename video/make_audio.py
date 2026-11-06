"""Soundtrack for the animated CV, scored to the story.

A light, modern electronic cue at 120 BPM that follows the ten beats:
  0-6      who I am            warm pad, wooden bead plucks
  6-13     languages           a pluck and a bead for each greeting
  13-19.3  data                a looping arpeggio, a soft kick comes in
  19.3-27  the problem         restless plucks that resolve when the answer lands
  27-34.3  context design      off-beat stabs
  34.3-41.3 analytical         steady quarters
  41.3-45.7 the real problem    the beat drops out, three soft bells
  45.7-51  count on            the lift: kick, bass octaves, a pluck per word
  51-55    the abacus          bells, bead clicks, a chord on the red dot
  55-60    the close           a warm final chord under the photo
Every chapter change gets a soft tonal swell into it and a low bloom on it,
so the picture changes land on the music without a hard edge. Bead clicks mark the counting moments.

Needs numpy:  pip install numpy  then  python3 make_audio.py
Writes public/soundtrack.wav (60 s, 44.1 kHz, 16-bit stereo).
"""
import wave
import numpy as np

SR = 44100
DUR = 60.0
N = int(SR * DUR)
BPM = 120.0
BEAT = 60.0 / BPM
rng = np.random.default_rng(7)
t = np.arange(N) / SR

L = np.zeros(N)
R = np.zeros(N)

CUTS = [0, 6.0, 13.0, 19.33, 27.0, 34.33, 41.33, 45.67, 51.0, 55.0, 60]
# chord per chapter (root, then chord tones in Hz): Am, F, C, G, Dm, F, Am(add9)
def hz(n):  # midi -> Hz
    return 440.0 * 2 ** ((n - 69) / 12)
CHORDS = [
    (45, [57, 60, 64, 67]),   # A minor 7      who I am
    (41, [53, 57, 60, 64]),   # F maj7         languages
    (48, [55, 60, 64, 67]),   # C              data
    (52, [55, 59, 62, 64]),   # E minor 7      the problem (tension)
    (43, [55, 59, 62, 67]),   # G              context design
    (50, [57, 60, 62, 65]),   # D minor        analytical
    (40, [55, 59, 62, 64]),   # E minor 7      the real problem (calls back to the problem)
    (41, [57, 60, 64, 65]),   # F              you can count on
    (45, [57, 59, 60, 64]),   # A minor add9   the abacus
    (48, [55, 59, 64, 67]),   # C maj7         the close, back to the person
]


def chapter(x):
    for i in range(len(CUTS) - 1):
        if CUTS[i] <= x < CUTS[i + 1]:
            return i
    return len(CUTS) - 2


def add(sig, start, gain=1.0, pan=0.0):
    """Mix a mono signal in at `start` seconds with equal-power pan (-1..1)."""
    i0 = int(start * SR)
    if i0 >= N:
        return
    n = min(len(sig), N - i0)
    if n <= 0:
        return
    a = (pan + 1) * np.pi / 4
    L[i0:i0 + n] += sig[:n] * gain * np.cos(a)
    R[i0:i0 + n] += sig[:n] * gain * np.sin(a)


def env_ad(n, a, d):
    k = np.arange(n) / SR
    return np.minimum(1, k / max(a, 1e-4)) * np.exp(-k / d)


def lowpass(x, cutoff):
    """One-pole low-pass, cutoff in Hz (scalar or per-sample array)."""
    c = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    alpha = 1 - np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += alpha[i] * (x[i] - acc)
        y[i] = acc
    return y


# ---- pad: detuned saw-ish stacks per chapter, crossfaded, filter opens with intensity
INTENSITY = [0.35, 0.5, 0.65, 0.75, 0.85, 0.9, 0.5, 1.0, 0.45, 0.4]
pad = np.zeros(N)
for ci, (root, tones) in enumerate(CHORDS):
    s, e = CUTS[ci], CUTS[ci + 1]
    i0, i1 = int(max(0, s - 1.2) * SR), int(min(DUR, e + 1.2) * SR)
    tt = t[i0:i1]
    v = np.zeros(i1 - i0)
    for k, m in enumerate(tones):
        f = hz(m)
        for det in (-0.12, 0.0, 0.12):
            ff = f * 2 ** (det / 12)
            ph = rng.uniform(0, 2 * np.pi)
            # three harmonics for a soft saw
            v += (np.sin(2 * np.pi * ff * tt + ph) + 0.35 * np.sin(4 * np.pi * ff * tt + ph) + 0.15 * np.sin(6 * np.pi * ff * tt + ph)) / 3
    fade = np.sin(np.clip((tt - (s - 1.2)) / 2.4, 0, 1) * np.pi / 2) * np.sin(np.clip(((e + 1.2) - tt) / 2.4, 0, 1) * np.pi / 2)
    pad[i0:i1] += v * np.clip(fade, 0, 1) * (0.5 + 0.5 * INTENSITY[ci])
cut = np.array([600 + 2600 * INTENSITY[chapter(x)] for x in t[::64]])
cut = np.repeat(cut, 64)[:N]
cut = lowpass(cut, 1.5)                    # glide the filter between chapters
pad = lowpass(pad, cut)

# ---- drums: kick, hats, claps, with a sidechain envelope for the pad
duck = np.ones(N)
def kick(at, g=1.0):
    n = int(0.35 * SR)
    k = np.arange(n) / SR
    f = 46 + 110 * np.exp(-k * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    add(np.sin(ph) * np.exp(-k * 10), at, 0.38 * g)
    i0 = int(at * SR)
    m = min(int(0.3 * SR), N - i0)
    duck[i0:i0 + m] = np.minimum(duck[i0:i0 + m], 0.72 + 0.28 * (np.arange(m) / m) ** 0.6)

def hat(at, g=1.0, pan=0.2, open_=False):
    n = int((0.22 if open_ else 0.05) * SR)
    k = np.arange(n) / SR
    noise = rng.uniform(-1, 1, n)
    hp = lowpass(noise - lowpass(noise, 5000), 9000)
    add(hp * np.exp(-k * (14 if open_ else 80)), at, 0.055 * g, pan)

def clap(at, g=1.0):
    n = int(0.25 * SR)
    k = np.arange(n) / SR
    noise = rng.uniform(-1, 1, n)
    bp = lowpass(noise - lowpass(noise, 900), 3200)
    e = sum(np.exp(-np.maximum(0, k - d) * 40) * (k >= d) for d in (0, 0.012, 0.024))
    add(lowpass(bp * e * 0.6, 2200), at, 0.16 * g, -0.1)

beats = np.arange(0, DUR, BEAT)
for b in beats:
    ci = chapter(b)
    # one quiet pulse, no stacked percussion: a soft kick from 'data', light off-beat hats later
    if 2 <= ci <= 5 or ci == 7:
        kick(b, 0.55)
    if 3 <= ci <= 5 or ci == 7:
        hat(b + BEAT / 2, 0.45, 0.25)
pad *= duck

# ---- bass: chapter root in eighths, octave jumps in production
for b in np.arange(6.5, 51.0, BEAT / 2):
    ci = chapter(b)
    if ci == 6:
        continue
    root = CHORDS[ci][0] - 12
    step = int(round(b / (BEAT / 2)))
    m = root + (12 if ci == 7 and step % 4 == 3 else 0)
    n = int(BEAT / 2 * SR * 0.9)
    k = np.arange(n) / SR
    f = hz(m)
    sig = np.sin(2 * np.pi * f * k) + 0.3 * np.sin(4 * np.pi * f * k)
    add(sig * env_ad(n, 0.004, 0.18) * duck[int(b * SR):int(b * SR) + n][:n] if int(b * SR) + n <= N else sig * env_ad(n, 0.004, 0.18), b, 0.22)

# ---- plucks: wooden bead tone (Karplus-Strong) for arpeggios
def pluck(midi, at, g=1.0, pan=0.0, decay=0.996):
    f = hz(midi)
    p = max(2, int(SR / f))
    n = int(0.6 * SR)
    buf = rng.uniform(-1, 1, p)
    out = np.empty(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = decay * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    add(lowpass(out, 4200) * np.exp(-np.arange(n) / SR * 3.5), at, 0.13 * g, pan)

# who I am: sparse bead plucks
for i, at in enumerate([2.2, 3.0, 3.8, 4.6, 5.4]):
    pluck(CHORDS[0][1][i % 4] + 12, at, 0.9, -0.4 + 0.15 * i)
# languages: one pluck as each greeting rolls in and its bead slides home
for i, at in enumerate([(170 + 44 + 26 * k) / 30 for k in range(5)]):
    pluck(CHORDS[1][1][[0, 2, 1, 3, 2][i]] + 12, at, 0.8, -0.5 + 0.25 * i)
# data: the loop arpeggio in eighths
for j, at in enumerate(np.arange(13.0, 19.3, BEAT / 2)):
    pluck(CHORDS[2][1][[0, 1, 2, 3, 2, 1][j % 6]] + 12, at, 0.7, 0.35 * np.sin(j))
# the problem: restless, resolving when the answer lands
RESOLVE = (570 + 168) / 30
for j, at in enumerate(np.arange(19.33, 27.0, BEAT / 2)):
    tones = CHORDS[3][1]
    pluck(tones[[0, 3, 1, 2][j % 4]] + (24 if at < RESOLVE else 12), at, 0.45 + 0.2 * (j % 4 == 0), 0.5 * np.sin(j * 0.9))
def bell(midi, at, g=1.0, pan=0.0):
    f = hz(midi)
    n = int(2.5 * SR)
    k = np.arange(n) / SR
    sig = np.sin(2 * np.pi * f * k) + 0.4 * np.sin(2 * np.pi * f * 2.76 * k) * np.exp(-k * 3) + 0.2 * np.sin(2 * np.pi * f * 5.4 * k) * np.exp(-k * 6)
    add(sig * env_ad(n, 0.002, 0.9), at, 0.11 * g, pan)
bell(CHORDS[3][1][0] + 24, RESOLVE, 0.9, 0.2)
# context design: off-beat stabs under the panel
for j, at in enumerate(np.arange(27.0, 34.3, BEAT)):
    pluck(CHORDS[4][1][j % 4] + 12, at + BEAT / 2, 0.45, -0.2 + 0.1 * (j % 4))
# analytical: steady quarter plucks
for j, at in enumerate(np.arange(34.33, 41.3, BEAT)):
    pluck(CHORDS[5][1][j % 4] + 12, at, 0.45, 0.3 * np.sin(j))
# the real problem: the beat drops out, one soft bell per line
for i, fr in enumerate([2, 28, 54]):
    bell(CHORDS[6][1][[0, 2, 3][i]] + 12, (1230 + fr) / 30, 0.75, -0.3 + 0.3 * i)
# you can count on: a pluck per counted word, a chord when the answer lands
for i in range(9):
    pluck(CHORDS[7][1][i % 4] + 12 + (12 if i >= 6 else 0), (1360 + i * 12) / 30, 0.5, -0.5 + 0.12 * i)
LAND = (1360 + 108) / 30
for m in CHORDS[7][1][:3]:
    pluck(m + 12, LAND, 0.5, -0.2 + 0.1 * (m % 4))
bell(CHORDS[7][1][0] + 24, LAND, 0.7, 0.0)
# the abacus: bells as it is built, a chord on the red dot
AB = 1520 / 30
for i, at in enumerate([AB + 0.4, AB + 1.0, AB + 1.6]):
    bell(CHORDS[8][1][[0, 2, 3][i]] + 12, at, 0.7, -0.3 + 0.3 * i)
for m in CHORDS[8][1]:
    bell(m + 12, AB + 78 / 30, 1.0, 0.0)
# the close: a warm final chord as the name lands
CL = 1640 / 30
for m in CHORDS[9][1]:
    bell(m + 12, CL + 30 / 30, 1.1, 0.0)
bell(CHORDS[9][1][3] + 24, CL + 2.4, 0.6, 0.3)

# ---- transitions: riser into each chapter, impact on it
def swell(end, length=1.8, g=1.0):
    """A soft rising tone into the cut: the next chord's root and fifth, filtered, fading up."""
    n = int(length * SR)
    k = np.arange(n) / SR
    ci = chapter(min(DUR - 0.01, end + 0.05))
    root = hz(CHORDS[ci][0] + 12)
    tone = np.sin(2 * np.pi * root * k) + 0.5 * np.sin(2 * np.pi * root * 1.5 * k) + 0.25 * np.sin(2 * np.pi * root * 2 * k)
    air = lowpass(rng.uniform(-1, 1, n), 900 + 1600 * (k / length) ** 2) * 0.25
    curve = np.sin((k / length) * np.pi / 2) ** 3          # eases in, no sudden edge
    add((tone + air) * curve, end - length, 0.028 * g, -0.25)
    add((tone + air) * curve, end - length, 0.028 * g, 0.25)

def bloom(at, g=1.0):
    """A gentle low bloom on the cut: a warm sine with a slow attack, no noise."""
    n = int(1.6 * SR)
    k = np.arange(n) / SR
    ci = chapter(at + 0.05)
    f = hz(CHORDS[ci][0] - 12)
    body = np.sin(2 * np.pi * f * k) * np.minimum(1, k / 0.03) * np.exp(-k * 2.2)
    shimmer = np.sin(2 * np.pi * f * 4 * k) * np.minimum(1, k / 0.08) * np.exp(-k * 3) * 0.12
    add(body + shimmer, at, 0.12 * g)

for c in CUTS[1:-1]:
    swell(c, 2.2 if c == 45.67 else 1.6, 1.15 if c == 45.67 else 1.0)
    bloom(c, 1.15 if c == 45.67 else (0.7 if c >= 51.0 else 0.9))

# ---- bead clicks on the counting moments
def bead_click(at, g=1.0, pitch=1600.0, pan=0.0):
    n = int(0.08 * SR)
    k = np.arange(n) / SR
    body = np.sin(2 * np.pi * pitch * k) * np.exp(-k * 55) + 0.5 * np.sin(2 * np.pi * pitch * 1.52 * k) * np.exp(-k * 70)
    add(body + rng.uniform(-1, 1, n) * np.exp(-k * 320) * 0.15, at, 0.11 * g, pan)
for i in range(3):                                             # the cold open: three beads count
    bead_click((16 + i * 5) / 30, 1.0, 1500 + 160 * i, -0.3 + 0.3 * i)
for i, at in enumerate([(124 + 12 * k) / 30 for k in range(5)]):   # the portrait changes medium
    bead_click(at, 1.0, 1500 + 120 * i, -0.5 + 0.25 * i)
for i in range(5):                                             # a language bead slides home
    bead_click((170 + 44 + 26 * i + 10) / 30, 0.7, 1400 + 100 * i, 0.3)
for i in range(9):                                             # count on: one bead per word
    bead_click((1360 + i * 12 + 6) / 30, 0.55, 1500 + 60 * i, -0.4 + 0.1 * i)
for i in range(5):                                             # beads drop onto the rods
    bead_click(AB + (24 + 8 + i * 6) / 30, 0.9, 1300 + 90 * i, -0.5 + 0.25 * i)
for i in range(5):                                             # and slide across to count
    bead_click(AB + (84 + 16 + i * 4) / 30, 0.7, 1500 + 70 * i, 0.5 - 0.2 * i)
for i in range(6):                                             # the skills pop in around the photo
    bead_click(CL + (22 + 6 * i + 4) / 30, 0.4, 1700 + 50 * i, -0.5 + 0.2 * i)

# ---- mix: pad + a short stereo reverb, master fades
padL = pad * 0.08
padR = np.roll(pad, int(0.011 * SR)) * 0.08
L += padL
R += padR

def reverb(x):
    y = np.zeros_like(x)
    for d, g in ((0.029, 0.5), (0.037, 0.45), (0.041, 0.42), (0.053, 0.38), (0.071, 0.3)):
        k = int(d * SR)
        acc = np.zeros_like(x)
        acc[k:] = x[:-k]
        for _ in range(4):
            acc[k:] += g * acc[:-k].copy() * 0.6
        y += acc
    return y * 0.12
wetL, wetR = reverb(L), reverb(np.roll(R, 97))
L, R = L + wetL, R + wetR

fade = np.minimum(1, t / 1.2) * np.minimum(1, (DUR - t) / 1.5)
L *= fade
R *= fade
# gentle limiter
peak = max(np.abs(L).max(), np.abs(R).max(), 1e-9)
L, R = np.tanh(L / peak * 1.1) / np.tanh(1.1) * 0.85, np.tanh(R / peak * 1.1) / np.tanh(1.1) * 0.85

data = (np.stack([L, R], axis=1) * 32767).astype('<i2').tobytes()
with wave.open('public/soundtrack.wav', 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(data)
print('wrote public/soundtrack.wav', DUR, 's stereo')
