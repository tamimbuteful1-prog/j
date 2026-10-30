export const VIDEO = {width: 1080, height: 1920, fps: 30} as const;

export const C = {
  ink: '#05080d',
  night: '#0a1220',
  panel: 'rgba(14, 22, 36, 0.72)',
  line: 'rgba(160, 190, 220, 0.18)',
  text: '#f2f5f8',
  dim: '#9aa8b8',
  green: '#1fbf75', // الحقيقة / المصدر الموثوق / الحدود
  greenGlow: 'rgba(31, 191, 117, 0.55)',
  red: '#ff4d4d', // التضليل / غير موثوق
  amber: '#ffb020',
  steel: '#7f8ea3',
} as const;

export const F = {
  head: "'Alexandria', 'IBM Plex Sans Arabic', sans-serif",
  body: "'IBM Plex Sans Arabic', 'Alexandria', sans-serif",
} as const;
