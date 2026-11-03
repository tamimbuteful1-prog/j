"""Episode 08 mix. Usage: python3 make_audio.py <narration.mp3|none> timeline.js out.wav"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "shared"))
import numpy as np
from mix_lib import Mix
m = Mix(sys.argv[2], sys.argv[1], seed=8); A, B = m.A, m.B
# quoted lines placed in their space (no effect while the narration is 'none')
m.q_door(2, 2); m.q_room(5, 5, pan=.15); m.q_room(17, 18, pan=.15); m.q_room(40, 40, pan=.15)
m.q_room(14, 14, pan=-.1); m.q_room(61, 61, pan=-.1); m.q_phone(54, 55); m.q_below(64, 65)
# locations
room = m.gate([(0, A(44))]); stair = m.gate([(A(44), m.DUR)])
hum = np.sin(2 * np.pi * 60 * m.t) * .5 + np.sin(2 * np.pi * 120 * m.t) * .3
power = m.curve([(0, 1), (A(34) + .1, 1), (A(34) + .12, 0), (m.DUR, 0)])
m.place((hum * .012 + np.sin(2 * np.pi * 15734 * m.t) * .003) * room * power, 0, 1, -.1)
m.place(m.filt(m.noise(m.N), hi=300) * .1 * room, 0)
m.place(m.filt(m.noise(m.N), hi=220) * .22 * stair + m.filt(m.noise(m.N), lo=40, hi=90) * .25 * stair, 0)
for d in np.arange(A(49), m.ASK_END, 3.3):
    n = m.i(.25); tt = np.arange(n) / 48000; drip = np.sin(2 * np.pi * (1400 + 600 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 40)
    m.place(m.conv(drip, m.ir(1.5, 3))[: m.i(1.6)], d + m.rng.uniform(0, 1.2), .03, m.rng.uniform(-.6, .6))
# score
m.score([(0, .5), (A(5), .7), (A(6) - .05, .2), (A(13), .5), (A(15) - .05, 0), (A(17), .4), (A(21), .5), (A(23), .8), (A(23) + .05, 0), (A(25), 0), (A(29), .4),
         (A(32), .6), (A(34), .9), (A(34) + .1, 0), (A(36) + .5, 0), (A(37), .3), (A(44), .6), (A(44) + .05, 0), (A(47), 0), (A(49), .5), (A(53), .6), (A(57), .7),
         (A(58), 0), (A(62), 0), (A(63), .5), (B(65), .8), (B(65) + .1, 0), (A(66), 0), (A(66) + 1, .45), (m.ASK_END - .3, .45), (m.ASK_END, 0), (m.DUR, 0)],
        motif_starts=(A(66) + .6, A(19)))
# events
for x in (A(0) + .05, A(0) + .6, A(0) + 1.15): m.place(m.knock(), x, 2.2, .25)
m.place(m.step(), A(3) + .2, .2, -.1); m.place(m.m_rustle() if hasattr(m, 'm_rustle') else m.filt(m.noise(m.i(.4)), lo=600, hi=4000) * m.env(m.i(.4), .05, .25), A(4) + .2, .12)
for x in (A(6), A(10) - .1, A(13) - .1, A(30), A(51)):
    m.place(m.buzz(), x, .45, .15); m.place(m.buzz(), x + .45, .45, .15); m.place(m.ding(), x, .05, .15)
m.place(m.tick(2400, .02), A(11) + .3, .1, .15)
m.place(m.thud(34, 2.2), A(15), .4)
m.place(m.filt(m.noise(m.i(.3)), lo=1500) * .5, A(23) + .45, .25, .1); m.place(m.thud(30, 2.4), A(23) + .5, .4)
for x in (A(26), A(27), A(28)): m.place(m.knock(), x - .02, 2.2, .25)
for k in range(10): m.place(m.filt(m.noise(m.i(.05)), lo=1500) * (k % 3 == 0), A(33) + k * .17, .3, .1)
m.place(m.thud(50, .5) + m.filt(m.noise(m.i(.5)), lo=600, hi=4000) * np.exp(-np.arange(m.i(.5)) / 48000 * 25) * .4, A(34) + .1, .5)
for x in (A(35) + .2, A(35) + 1.3, A(35) + 2.4): m.place(m.breath(.9, 1400, .45), x, 1.0, m.rng.uniform(-.4, .4))
m.place(m.tick(2000, .03), A(36) + .1, .25, .3)
for k, x in enumerate(np.arange(A(36) + .5, A(37) + 1.0, .5)): m.place(m.step(), x, .12, (-1) ** k * .1)
n = m.i(1.4); m.place(m.filt(m.noise(n), lo=150, hi=900) * np.sin(np.linspace(0, np.pi, n)) * .8, A(38), .2, .3)
n = m.i(1.2); tt = np.arange(n) / 48000
m.place(m.filt(np.sign(np.sin(2 * np.pi * np.cumsum(240 + 80 * np.sin(2 * np.pi * 1.2 * tt)) / 48000)) * (np.sin(2 * np.pi * 19 * tt) > .2), lo=200, hi=1800) * np.sin(np.linspace(0, np.pi, n)) * .3, A(41) + .1, .1, .3)
s = m.thud(70, .8) + m.filt(m.noise(m.i(.8)), lo=300, hi=5000) * np.exp(-np.arange(m.i(.8)) / 48000 * 9) * .6
m.place(m.conv(s, m.ir(1.4, 4))[: m.i(2.0)], A(44) - .02, 1.4)
for x in np.arange(A(47), B(47), .45): m.place(m.thud(85, .3), x, .35, -.2)
m.place(m.breath(1.0, 1500, .5), B(48), 1.0)
for x in np.arange(A(57) + .3, A(62) - .2, 3.0): m.place(m.conv(m.cry(min(3.0, A(62) - .2 - x)), m.ir(2.2, 2.4, 2500))[: m.i(4)], x, .18, .3)
m.place(m.conv(m.step(), m.ir(1.6, 3))[: m.i(1.8)], A(59) + .3, .25, -.1)
m.place(m.thud(30, 2.6), A(64), .45)
m.finish(sys.argv[3])
