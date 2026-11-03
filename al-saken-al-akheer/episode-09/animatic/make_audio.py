"""Episode 09 mix. Usage: python3 make_audio.py <narration.mp3|none> timeline.js out.wav"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "shared"))
import numpy as np
from mix_lib import Mix
m = Mix(sys.argv[2], sys.argv[1], seed=9); A, B = m.A, m.B
m.q_below(0, 0); m.q_below(8, 9); m.q_below(20, 20); m.q_below(40, 42); m.q_room(55, 57, pan=.1)
m.q_room(19, 19, pan=-.1); m.q_phone(34, 35); m.q_memory(16, 16)
stair = m.gate([(0, m.ASK_END)])
m.place(m.filt(m.noise(m.N), hi=220) * .22 * stair + m.filt(m.noise(m.N), lo=40, hi=90) * .25 * stair, 0)
for d in np.arange(2, m.ASK_END, 3.6):
    n = m.i(.25); tt = np.arange(n) / 48000; drip = np.sin(2 * np.pi * (1400 + 600 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 40)
    m.place(m.conv(drip, m.ir(1.5, 3))[: m.i(1.6)], d + m.rng.uniform(0, 1.2), .03, m.rng.uniform(-.6, .6))
mem = m.gate([(A(13), A(17)), (A(56) + .5, A(57) + .6)], .1)
m.place(m.filt(m.noise(m.N), lo=1500) * .03 * mem + np.sin(2 * np.pi * 37 * m.t) * .06 * mem, 0)
m.score([(0, .5), (A(5), .6), (A(9), .8), (A(10), .4), (A(11), .7), (A(13), .9), (A(17), .3), (A(21), .4), (A(28), .9), (B(28) + .1, 0), (A(29), .4),
         (A(31), .8), (A(32), .4), (A(36), 0), (A(38) + .5, 0), (A(40), .5), (A(43), .7), (A(49), .9), (A(50), .2), (A(52) - .05, 0), (A(55), 0), (A(55) + .5, .3),
         (A(58), .6), (A(61), .8), (A(61) + .5, 0), (A(63), 0), (A(63) + 1, .45), (m.ASK_END - .3, .45), (m.ASK_END, 0), (m.DUR, 0)],
        motif_starts=(A(63) + .6, A(54)))
for x in (A(21), A(22) - .1, A(33) - .3, A(58)):
    m.place(m.buzz(), x, .45, .15); m.place(m.buzz(), x + .45, .45, .15); m.place(m.ding(), x, .05, .15)
m.place(m.step(), A(10) + .1, .2, -.1)
for x in (A(11) + .2, A(11) + .9, A(12) + .3): m.place(m.thud(48, .4), x, .35)
for x in (A(14) + .1, A(15) + .5, A(16) + .1): m.place(m.filt(m.noise(m.i(.12)), lo=1500) * .6, x, .2, .1)
for k, x in enumerate(np.arange(A(13), A(17), .24)): m.place(m.conv(m.step(), m.ir(.9, 5))[: m.i(1)], x, .08, (-1) ** k * .1)
for x in (A(18), A(18) + .7, A(18) + 1.4): m.place(m.breath(.6, 1600, .5), x, 1.0)
m.place(m.thud(32, 2.6), A(28), .45)
m.place(m.step(), A(32) + .2, .15)
m.place(m.thud(30, 2.4), B(35) + .3, .3)
m.place(m.conv(m.laugh(1.8), m.ir(2.2, 2.4, 2500))[: m.i(3)], A(37) + .5, .3, .25)
for k, x in enumerate([A(44) + .4, A(45) + .1, A(45) + .9, A(46) + .4, A(47), A(48), A(49) + .3]):
    m.place(m.conv(m.step(heavy=k >= 4), m.ir(1.6, 3))[: m.i(1.8)], x, .55 if k >= 4 else .3, .2 - k * .05)
n = m.i(1.4); m.place(m.filt(m.noise(n), lo=800, hi=4000) * np.sin(np.linspace(0, np.pi, n)) * .3, A(46) + .1, .12, .1)
for x in (A(50) + .4, A(50) + 1.0, A(51) + .2, A(51) + .8): m.place(m.thud(52, .35), x, .35)
m.place(m.thud(28, 3.0), A(52) - .02, .5)
m.place(m.breath(1.2, 1300, .5), A(62), 1.0)
m.finish(sys.argv[3])
