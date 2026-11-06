"""Soundtrack for the animated CV, scored to the story.

A light, modern electronic cue at 120 BPM that follows the seven chapters:
  0-7   the beginning   warm pad, wooden bead plucks
  7-15  data            hats and a soft kick come in, the bass starts counting
  15-25 agents          full groove, a looping arpeggio (the agent loop)
  25-37 Tokalator       sixteenth-note plucks, brighter filter
  37-46 production      biggest section: wider pad, bass octaves, claps
  46-53 through-line    breakdown: kick out, bells over the pad
  53-60 invitation      lift into a final hit, then a clean tail
Every chapter change gets a riser into it and a soft impact on it, so the
picture changes land on the music. Bead clicks mark the counting moments.

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

CUTS = [0, 7, 15, 25, 37, 46, 53, 60]
# chord per chapter (root, then chord tones in Hz): Am, F, C, G, Dm, F, Am(add9)
def hz(n):  # midi -> Hz
    return 440.0 * 2 ** ((n - 69) / 12)
CHORDS = [
    (45, [57, 60, 64, 67]),   # A minor 7
    (41, [53, 57, 60, 64]),   # F maj7
    (48, [55, 60, 64, 67]),   # C
    (43, [55, 59, 62, 67]),   # G
    (50, [57, 60, 62, 65]),   # D minor
    (41, [57, 60, 64, 65]),   # F
    (45, [57, 59, 60, 64]),   # A minor add9
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
INTENSITY = [0.35, 0.55, 0.75, 0.85, 1.0, 0.5, 0.9]
pad = np.zeros(N)
for ci, (root, tones) in enumerate(CHORDS):
    s, e = CUTS[ci], CUTS[ci + 1]
    i0, i1 = int(max(0, s - 0.4) * SR), int(min(DUR, e + 0.4) * SR)
    tt = t[i0:i1]
    v = np.zeros(i1 - i0)
    for k, m in enumerate(tones):
        f = hz(m)
        for det in (-0.12, 0.0, 0.12):
            ff = f * 2 ** (det / 12)
            ph = rng.uniform(0, 2 * np.pi)
            # three harmonics for a soft saw
            v += (np.sin(2 * np.pi * ff * tt + ph) + 0.35 * np.sin(4 * np.pi * ff * tt + ph) + 0.15 * np.sin(6 * np.pi * ff * tt + ph)) / 3
    fade = np.minimum(1, (tt - (s - 0.4)) / 0.8) * np.minimum(1, ((e + 0.4) - tt) / 0.8)
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
    add(np.sin(ph) * np.exp(-k * 9) + 0.15 * rng.uniform(-1, 1, n) * np.exp(-k * 120), at, 0.55 * g)
    i0 = int(at * SR)
    m = min(int(0.3 * SR), N - i0)
    duck[i0:i0 + m] = np.minimum(duck[i0:i0 + m], 0.45 + 0.55 * (np.arange(m) / m) ** 0.6)

def hat(at, g=1.0, pan=0.2, open_=False):
    n = int((0.22 if open_ else 0.05) * SR)
    k = np.arange(n) / SR
    noise = rng.uniform(-1, 1, n)
    hp = noise - lowpass(noise, 6500)
    add(hp * np.exp(-k * (14 if open_ else 70)), at, 0.12 * g, pan)

def clap(at, g=1.0):
    n = int(0.25 * SR)
    k = np.arange(n) / SR
    noise = rng.uniform(-1, 1, n)
    bp = lowpass(noise - lowpass(noise, 900), 3200)
    e = sum(np.exp(-np.maximum(0, k - d) * 40) * (k >= d) for d in (0, 0.012, 0.024))
    add(bp * e * 0.6, at, 0.35 * g, -0.1)

beats = np.arange(0, DUR, BEAT)
for b in beats:
    ci = chapter(b)
    if ci in (1, 2, 3, 4, 6) and b < 58.5:
        if ci == 1 and b < 9:       # kick enters on the second bar of 'data'
            pass
        else:
            kick(b, 0.8 if ci == 1 else 1.0)
    if ci >= 1 and ci != 5 and b < 58.5:
        hat(b + BEAT / 2, 1.0, 0.25)
        if ci in (3, 4, 6):
            hat(b + BEAT / 4, 0.5, -0.3)
            hat(b + 3 * BEAT / 4, 0.5, -0.3)
    if ci in (4, 6) and int(round(b / BEAT)) % 2 == 1 and b < 58.5:
        clap(b)
pad *= duck

# ---- bass: chapter root in eighths, octave jumps in production
for b in np.arange(7, 58.5, BEAT / 2):
    ci = chapter(b)
    if ci == 5:
        continue
    root = CHORDS[ci][0] - 12
    step = int(round(b / (BEAT / 2)))
    m = root + (12 if ci == 4 and step % 4 == 3 else 0)
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
    add(out * np.exp(-np.arange(n) / SR * 3.5), at, 0.16 * g, pan)

# beginning: sparse bead plucks
for i, at in enumerate([0.6, 1.6, 2.4, 3.6, 4.4, 5.2, 6.0]):
    tones = CHORDS[0][1]
    pluck(tones[i % 4] + 12, at, 0.9, -0.4 + 0.15 * i)
# agents: the loop arpeggio in eighths
for j, at in enumerate(np.arange(15, 25, BEAT / 2)):
    tones = CHORDS[2][1]
    pluck(tones[[0, 1, 2, 3, 2, 1][j % 6]] + 12, at, 0.8, 0.35 * np.sin(j))
# Tokalator: sixteenths, brighter
for j, at in enumerate(np.arange(25, 37, BEAT / 4)):
    tones = CHORDS[3][1]
    pluck(tones[[0, 2, 1, 3][j % 4]] + 24, at, 0.55 + 0.25 * (j % 4 == 0), 0.5 * np.sin(j * 0.7))
# production: off-beat stabs
for j, at in enumerate(np.arange(37, 46, BEAT)):
    for m in CHORDS[4][1]:
        pluck(m + 12, at + BEAT / 2, 0.45, -0.2 + 0.1 * (m % 4))
# through-line: bells
def bell(midi, at, g=1.0, pan=0.0):
    f = hz(midi)
    n = int(2.5 * SR)
    k = np.arange(n) / SR
    sig = np.sin(2 * np.pi * f * k) + 0.4 * np.sin(2 * np.pi * f * 2.76 * k) * np.exp(-k * 3) + 0.2 * np.sin(2 * np.pi * f * 5.4 * k) * np.exp(-k * 6)
    add(sig * env_ad(n, 0.002, 0.9), at, 0.11 * g, pan)
for i, at in enumerate(np.arange(46, 53, BEAT * 2)):
    bell(CHORDS[5][1][[3, 2, 1, 2][i % 4]] + 12, at, 1.0, -0.3 + 0.2 * (i % 4))
# invitation: rising arp then the final chord
for j, at in enumerate(np.arange(53, 56, BEAT / 4)):
    pluck(CHORDS[6][1][j % 4] + 12 + 12 * (j // 8), at, 0.6, 0.4 * np.sin(j))
for m in CHORDS[6][1]:
    bell(m + 12, 56.0, 1.2, 0.0)

# ---- transitions: riser into each chapter, impact on it
def riser(end, length=1.6, g=1.0):
    n = int(length * SR)
    k = np.arange(n) / SR
    noise = rng.uniform(-1, 1, n)
    sweep = lowpass(noise, 400 + 7000 * (k / length) ** 2)
    add(sweep * (k / length) ** 2.2, end - length, 0.18 * g, -0.3)
    add(sweep[::-1][::-1] * (k / length) ** 2.2, end - length, 0.18 * g, 0.3)

def impact(at, g=1.0):
    n = int(1.2 * SR)
    k = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (38 + 40 * np.exp(-k * 12)) * k) * np.exp(-k * 3.2)
    noise = lowpass(rng.uniform(-1, 1, n), 1800) * np.exp(-k * 9)
    add(boom * 0.7 + noise * 0.5, at, 0.45 * g)

for c in CUTS[1:-1]:
    riser(c, 1.4 if c != 53 else 2.6, 1.3 if c == 53 else 1.0)
    impact(c, 1.25 if c in (37, 53) else 0.9)

# ---- bead clicks on the counting moments
def bead_click(at, g=1.0, pitch=1600.0, pan=0.0):
    n = int(0.08 * SR)
    k = np.arange(n) / SR
    body = np.sin(2 * np.pi * pitch * k) * np.exp(-k * 55) + 0.5 * np.sin(2 * np.pi * pitch * 1.52 * k) * np.exp(-k * 70)
    add(body + rng.uniform(-1, 1, n) * np.exp(-k * 320) * 0.3, at, 0.16 * g, pan)
for i, at in enumerate([4.13, 4.67, 5.2, 5.73, 6.27]):        # the portrait changes medium
    bead_click(at, 1.0, 1500 + 120 * i, -0.5 + 0.25 * i)
for i, at in enumerate(np.arange(57.0, 58.6, 0.2)):           # beads drop onto the rod
    bead_click(at, 0.8, 1300 + 90 * (i % 5), -0.6 + 0.15 * i)

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
L, R = np.tanh(L / peak * 1.4) / np.tanh(1.4) * 0.9, np.tanh(R / peak * 1.4) / np.tanh(1.4) * 0.9

data = (np.stack([L, R], axis=1) * 32767).astype('<i2').tobytes()
with wave.open('public/soundtrack.wav', 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(data)
print('wrote public/soundtrack.wav', DUR, 's stereo')
