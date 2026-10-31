import React from 'react';
import {P} from '../theme';

/**
 * نواف — one character sheet used in every shot.
 * 22, slim face, short black hair, clear eyes, dark home clothes (charcoal tee).
 * Same colours/proportions everywhere: hair P.hair, skin P.skin, tee P.shirt.
 */

export type FaceState = {
  open?: number; // eyelids 0 closed … 1 open
  look?: [number, number]; // iris offset −1…1 (x right, y down)
  fear?: number; // 0 calm … 1 frightened (brows up/in, wider eyes, lips apart)
  breathe?: number; // −1…1 breathing phase
  phone?: number; // cold phone light from below (0–1)
  warm?: number; // warm rim from the door side (0–1)
  turn?: number; // head turn −1…1 (features slide)
};

/** close-up face, centred around (540, 860) on the 1080×1920 canvas */
export const Face: React.FC<FaceState> = ({open = 1, look = [0, 0], fear = 0, breathe = 0, phone = 0, warm = 0, turn = 0}) => {
  const eyeH = 16 * Math.max(0.04, open) * (1 + 0.32 * fear);
  const lx = look[0] * 14 + turn * 10;
  const ly = look[1] * 8;
  const browLift = fear * 16;
  const browIn = fear * 10;
  const by = breathe * 5;
  const ft = turn * 22; // features slide toward the turn
  return (
    <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      <defs>
        <radialGradient id="skinG" cx="45%" cy="40%" r="70%">
          <stop offset="0" stopColor={P.skin} />
          <stop offset="1" stopColor={P.skinShade} />
        </radialGradient>
        <radialGradient id="phoneG" cx="50%" cy="100%" r="80%">
          <stop offset="0" stopColor="#bcd4ff" stopOpacity={0.75 * phone} />
          <stop offset="1" stopColor="#bcd4ff" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="warmG" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor={P.warm} stopOpacity={0.55 * warm} />
          <stop offset="0.35" stopColor={P.warm} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="coldG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5f7fa6" stopOpacity={0.35} />
          <stop offset="0.5" stopColor="#5f7fa6" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="keyShade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={0.05} />
          <stop offset="0.55" stopColor="#000" stopOpacity={0.15} />
          <stop offset="1" stopColor="#000" stopOpacity={0.62} />
        </linearGradient>
        <clipPath id="headClip">
          <path d="M 312 820 C 312 600, 768 600, 768 820 C 768 1010, 662 1146, 540 1158 C 418 1146, 312 1010, 312 820 Z" />
        </clipPath>
      </defs>
      <g transform={`translate(0 ${by})`}>
        {/* shirt + neck */}
        <path d="M 120 1920 C 140 1520, 300 1390, 460 1360 L 620 1360 C 780 1390, 940 1520, 960 1920 Z" fill={P.shirt} />
        <path d="M 120 1920 C 140 1520, 300 1390, 460 1360 L 620 1360 C 780 1390, 940 1520, 960 1920 Z" fill="url(#phoneG)" />
        <path d="M 468 1110 L 612 1110 L 626 1372 C 580 1400, 500 1400, 454 1372 Z" fill={P.skinShade} />
        <path d="M 462 1360 C 500 1395, 580 1395, 618 1360" fill="none" stroke="#0f1318" strokeWidth={14} />
        {/* ears */}
        <ellipse cx={312 + ft * 0.4} cy={880} rx={30} ry={52} fill={P.skinShade} />
        <ellipse cx={768 + ft * 0.4} cy={880} rx={30} ry={52} fill={P.skinShade} />
        {/* head */}
        <path d="M 312 820 C 312 600, 768 600, 768 820 C 768 1010, 662 1146, 540 1158 C 418 1146, 312 1010, 312 820 Z" fill="url(#skinG)" />
        <g clipPath="url(#headClip)">
          <rect x={300} y={560} width={480} height={620} fill="url(#coldG)" />
          <rect x={300} y={560} width={480} height={620} fill="url(#warmG)" />
          <rect x={300} y={560} width={480} height={620} fill="url(#phoneG)" />
          {/* low-key light: the far side of the face falls into shadow */}
          <rect x={300} y={560} width={480} height={620} fill="url(#keyShade)" />
          <rect x={300} y={560} width={480} height={620} fill="#050a14" opacity={0.32} />
          {/* jaw / cheek shadow */}
          <path d="M 312 900 C 330 1060, 450 1150, 540 1158 C 470 1120, 380 1040, 360 900 Z" fill="#000" opacity={0.18} />
        </g>
        {/* hair: short, black, slight fringe */}
        <path d="M 296 850 C 250 560, 830 520, 784 850 C 776 760, 740 690, 660 660 C 610 700, 520 712, 430 676 C 372 700, 318 770, 296 850 Z" fill={P.hair} />
        <path d="M 330 640 C 420 560, 640 552, 740 630 C 650 590, 450 590, 330 640 Z" fill="#1a1a20" opacity={0.6} />
        <path d="M 440 668 C 470 700, 520 712, 560 700 C 520 690, 480 680, 440 668 Z" fill="#000" opacity={0.6} />
        <g transform={`translate(${ft} 0)`}>
          {/* brows */}
          <path d={`M ${388} ${790 - browLift * 0.3} Q ${430} ${770 - browLift * 0.6} ${478 - browIn} ${786 - browLift}`} fill="none" stroke={P.hair} strokeWidth={13} strokeLinecap="round" />
          <path d={`M ${692} ${790 - browLift * 0.3} Q ${650} ${770 - browLift * 0.6} ${602 + browIn} ${786 - browLift}`} fill="none" stroke={P.hair} strokeWidth={13} strokeLinecap="round" />
          {/* eyes */}
          {[440, 640].map((cx) => (
            <g key={cx}>
              <ellipse cx={cx} cy={862} rx={44} ry={eyeH} fill="#bdb6aa" />
              <clipPath id={`eye${cx}`}>
                <ellipse cx={cx} cy={862} rx={44} ry={eyeH} />
              </clipPath>
              <g clipPath={`url(#eye${cx})`}>
                <circle cx={cx + lx} cy={862 + ly} r={16} fill="#24180f" />
                <circle cx={cx + lx} cy={862 + ly} r={9 - 2 * fear} fill="#050404" />
                <circle cx={cx + lx + 6} cy={856 + ly} r={4} fill="#fff" opacity={0.85} />
              </g>
              <path d={`M ${cx - 54} ${862} Q ${cx} ${862 - eyeH * 1.35} ${cx + 54} ${862}`} fill="none" stroke="#120d0b" strokeWidth={6} />
              {open < 0.2 && <path d={`M ${cx - 50} 864 Q ${cx} ${872} ${cx + 50} 864`} fill="none" stroke="#120d0b" strokeWidth={5} />}
            </g>
          ))}
          {/* nose */}
          <path d="M 548 880 C 556 940, 566 975, 548 992 C 536 998, 520 994, 512 986" fill="none" stroke="#5a3f31" strokeWidth={6} strokeLinecap="round" opacity={0.7} />
          {/* mouth */}
          <path d={`M 492 1052 Q 540 ${1060 + fear * 4} 588 1052`} fill="none" stroke="#4a2c24" strokeWidth={7} strokeLinecap="round" />
          {fear > 0.4 && <ellipse cx={540} cy={1058} rx={22 * fear} ry={9 * (fear - 0.4)} fill="#1a0e0c" />}
        </g>
      </g>
    </svg>
  );
};

/** over-the-shoulder: back of the head + shoulders, bottom-left of frame (sitting on the bed) */
export const Back: React.FC<{breathe?: number; turn?: number; warm?: number; phone?: number; x?: number; y?: number; s?: number}> = ({breathe = 0, turn = 0, warm = 0.4, phone = 0, x = 0, y = 0, s = 1}) => (
  <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
    <defs>
      <linearGradient id="rimW" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0" stopColor={P.warm} stopOpacity={0.5 * warm} />
        <stop offset="0.25" stopColor={P.warm} stopOpacity={0} />
      </linearGradient>
      <radialGradient id="phB" cx="40%" cy="100%" r="70%">
        <stop offset="0" stopColor="#bcd4ff" stopOpacity={0.6 * phone} />
        <stop offset="1" stopColor="#bcd4ff" stopOpacity={0} />
      </radialGradient>
    </defs>
    <g transform={`translate(${x} ${y + breathe * 6}) scale(${s})`} style={{transformOrigin: '300px 1700px'}}>
      <path d="M -120 1920 C -100 1700, 80 1600, 230 1590 L 380 1590 C 540 1600, 690 1700, 700 1920 Z" fill={P.shirt} />
      <path d="M -120 1920 C -100 1700, 80 1600, 230 1590 L 380 1590 C 540 1600, 690 1700, 700 1920 Z" fill="url(#rimW)" />
      <path d="M -120 1920 C -100 1700, 80 1600, 230 1590 L 380 1590 C 540 1600, 690 1700, 700 1920 Z" fill="url(#phB)" />
      <rect x={250} y={1450} width={120} height={160} fill={P.skinShade} />
      <ellipse cx={196 + turn * 12} cy={1380} rx={26} ry={44} fill={P.skinShade} />
      <ellipse cx={424 + turn * 12} cy={1380} rx={26} ry={44} fill={P.skinShade} />
      <ellipse cx={310 + turn * 18} cy={1340} rx={200} ry={225} fill={P.hair} />
      <ellipse cx={310 + turn * 18} cy={1340} rx={200} ry={225} fill="url(#rimW)" />
    </g>
  </svg>
);

/** small seated figure on the bed edge (wide / high shots), seen from behind-left */
export const Seated: React.FC<{x: number; y: number; s?: number; breathe?: number; head?: number; phone?: number}> = ({x, y, s = 1, breathe = 0, head = 0, phone = 0}) => (
  <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* torso */}
      <path d={`M -70 0 C -80 -120, -60 -${200 + breathe * 4}, 0 -${210 + breathe * 4} C 60 -${200 + breathe * 4}, 80 -120, 70 0 Z`} fill={P.shirt} />
      {/* arms resting */}
      <path d="M -68 -150 C -96 -90, -96 -30, -60 10" fill="none" stroke={P.shirt2} strokeWidth={30} strokeLinecap="round" />
      <path d="M 66 -150 C 96 -90, 92 -30, 56 10" fill="none" stroke={P.shirt2} strokeWidth={30} strokeLinecap="round" />
      {/* legs over the bed edge */}
      <path d="M -50 0 L -40 150 M 40 0 L 50 150" stroke="#14181f" strokeWidth={42} strokeLinecap="round" />
      {/* neck + head */}
      <rect x={-18} y={-246 - breathe * 4} width={36} height={44} fill={P.skinShade} />
      <ellipse cx={head * 10} cy={-290 - breathe * 4} rx={56} ry={64} fill={P.hair} />
      <ellipse cx={-50 + head * 8} cy={-284 - breathe * 4} rx={9} ry={16} fill={P.skinShade} />
      {phone > 0 && <ellipse cx={0} cy={-60} rx={110} ry={70} fill="#bcd4ff" opacity={0.18 * phone} />}
    </g>
  </svg>
);

/** asleep, side view in bed (pillow on the left, blanket to the right) */
export const Asleep: React.FC<{breathe?: number}> = ({breathe = 0}) => (
  <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
    {/* bed */}
    <rect x={-40} y={1200} width={1160} height={420} rx={20} fill="#151b24" />
    <rect x={-40} y={1180} width={1160} height={70} rx={20} fill="#1f2834" />
    {/* pillow */}
    <path d="M 40 1110 C 40 1060, 320 1050, 340 1110 C 350 1170, 60 1190, 40 1110 Z" fill="#c9ccd2" />
    <path d="M 40 1110 C 40 1060, 320 1050, 340 1110 C 350 1170, 60 1190, 40 1110 Z" fill="#0b1222" opacity={0.55} />
    {/* head on the pillow (profile, eyes closed) */}
    <g transform="translate(205 1060)">
      <ellipse cx={0} cy={0} rx={92} ry={78} fill={P.skinShade} />
      <path d="M -96 -10 C -100 -90, 70 -110, 96 -30 C 60 -60, 0 -66, -40 -40 C -60 -30, -80 -24, -96 -10 Z" fill={P.hair} />
      <path d="M 40 4 Q 58 10 74 4" fill="none" stroke="#120d0b" strokeWidth={5} />
      <path d="M 86 20 C 98 34, 96 46, 84 52" fill="none" stroke="#3d2a20" strokeWidth={5} />
    </g>
    {/* blanket over the body, breathing */}
    <path d={`M 230 1140 C 330 ${1040 - breathe * 8}, 620 ${1030 - breathe * 6}, 880 1090 C 980 1110, 1080 1130, 1120 1150 L 1120 1240 L 220 1240 Z`} fill={P.blanket} />
    <path d={`M 230 1140 C 330 ${1040 - breathe * 8}, 620 ${1030 - breathe * 6}, 880 1090`} fill="none" stroke="#3a4760" strokeWidth={6} opacity={0.6} />
  </svg>
);

/** side profile with the phone at his ear (facing right, toward the door) */
export const Profile: React.FC<{fear?: number; breathe?: number; phone?: number; warm?: number; open?: number}> = ({fear = 0, breathe = 0, phone = 1, warm = 0.3, open = 1}) => (
  <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
    <defs>
      <linearGradient id="pfW" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0" stopColor={P.warm} stopOpacity={0.5 * warm} />
        <stop offset="0.3" stopColor={P.warm} stopOpacity={0} />
      </linearGradient>
      <radialGradient id="pfP" cx="35%" cy="55%" r="45%">
        <stop offset="0" stopColor="#bcd4ff" stopOpacity={0.55 * phone} />
        <stop offset="1" stopColor="#bcd4ff" stopOpacity={0} />
      </radialGradient>
    </defs>
    <g transform={`translate(0 ${breathe * 5})`}>
      <path d="M 160 1920 C 180 1560, 320 1420, 470 1390 L 640 1390 C 780 1420, 880 1560, 900 1920 Z" fill={P.shirt} />
      <path d="M 470 1180 L 610 1180 L 640 1400 L 450 1400 Z" fill={P.skinShade} />
      {/* profile: forehead → nose → lips → chin, facing right */}
      <path d="M 380 900 C 360 700, 520 590, 640 610 C 720 625, 760 700, 770 790 C 772 820, 780 840, 800 872 C 812 890, 800 900, 782 904 C 786 930, 784 950, 772 962 C 780 980, 774 1000, 760 1006 C 764 1040, 750 1090, 700 1110 C 650 1130, 600 1160, 560 1190 C 470 1200, 400 1120, 380 900 Z" fill={P.skin} />
      <path d="M 380 900 C 360 700, 520 590, 640 610 C 720 625, 760 700, 770 790 C 772 820, 780 840, 800 872 C 812 890, 800 900, 782 904 C 786 930, 784 950, 772 962 C 780 980, 774 1000, 760 1006 C 764 1040, 750 1090, 700 1110 C 650 1130, 600 1160, 560 1190 C 470 1200, 400 1120, 380 900 Z" fill="url(#pfW)" />
      <path d="M 380 900 C 360 700, 520 590, 640 610 C 720 625, 760 700, 770 790 C 772 820, 780 840, 800 872 C 812 890, 800 900, 782 904 C 786 930, 784 950, 772 962 C 780 980, 774 1000, 760 1006 C 764 1040, 750 1090, 700 1110 C 650 1130, 600 1160, 560 1190 C 470 1200, 400 1120, 380 900 Z" fill="url(#pfP)" />
      {/* hair */}
      <path d="M 370 920 C 330 650, 560 560, 700 620 C 740 640, 760 680, 762 720 C 700 690, 640 690, 600 700 C 560 760, 500 800, 470 880 C 440 900, 400 910, 370 920 Z" fill={P.hair} />
      {/* eye + brow */}
      <path d={`M 690 ${800 - fear * 12} Q 720 ${790 - fear * 14} 748 ${798 - fear * 8}`} fill="none" stroke={P.hair} strokeWidth={11} strokeLinecap="round" />
      <ellipse cx={722} cy={838} rx={20} ry={11 * Math.max(0.05, open) * (1 + 0.3 * fear)} fill="#e8e2d8" />
      <circle cx={732} cy={838} r={7 * Math.max(0.2, open)} fill="#1c130d" />
      {fear > 0.5 && <ellipse cx={782} cy={985} rx={6} ry={5 * fear} fill="#1a0e0c" />}
      {/* hand + phone at the ear */}
      <g transform="translate(520 905) rotate(-12)">
        <rect x={-60} y={-130} width={92} height={190} rx={18} fill="#0a0c10" />
        <rect x={-54} y={-124} width={80} height={178} rx={14} fill="#9fb6d8" opacity={0.25 * phone} />
        <path d="M -70 30 C -90 80, -60 150, 10 160 C 60 165, 80 120, 70 70 L 40 20 Z" fill={P.skin} />
        <path d="M -70 30 C -90 80, -60 150, 10 160 C 60 165, 80 120, 70 70 L 40 20 Z" fill="url(#pfP)" />
      </g>
    </g>
  </svg>
);
