// Printed dial face of the gauge, drawn on a canvas (used as a WebGL texture).
// Angles are mathematical: 0° = right, 90° = up. The scale runs from -30°
// (lower right, start of RTL reading) to 210° (lower left).

export const ZONES = [
  { key: 'green', from: -30, to: 48, color: '#23935a', label: 'لم يظهر تعارض' },
  { key: 'neutral', from: 51, to: 129, color: '#c8b48e', label: 'يتطلب معلومات' },
  { key: 'red', from: 132, to: 210, color: '#d23c2c', label: 'مؤشرات تعارض' },
] as const;

/** Needle angles that point at the middle of each zone. */
export const ZONE_ANGLE = { green: 9, neutral: 64, red: 171 } as const;

const DISPLAY = '"Alexandria Variable", "IBM Plex Sans Arabic", "Noto Sans Arabic", sans-serif';
const BODY = '"IBM Plex Sans Arabic", "Noto Sans Arabic", sans-serif';

export async function drawDial(size: number): Promise<HTMLCanvasElement> {
  // Canvas text needs the web fonts to be loaded first (Arabic shaping uses them).
  try {
    await Promise.all([
      document.fonts.load(`700 40px ${DISPLAY}`, 'معيار'),
      document.fonts.load(`600 40px ${BODY}`, 'لم يظهر تعارض'),
    ]);
  } catch {
    /* fall back to system Arabic fonts */
  }
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d')!;
  const S = size / 2 / 0.93; // px per dial unit (dial radius = 0.93)
  const cx = size / 2;
  const cy = size / 2;
  const P = (a: number, r: number) => [cx + Math.cos((a * Math.PI) / 180) * r * S, cy - Math.sin((a * Math.PI) / 180) * r * S];

  // face: warm charcoal with a soft centre light
  const g = x.createRadialGradient(cx, cy * 0.86, 0, cx, cy, size * 0.55);
  g.addColorStop(0, '#34302b');
  g.addColorStop(0.55, '#221f1c');
  g.addColorStop(1, '#141210');
  x.fillStyle = g;
  x.fillRect(0, 0, size, size);

  // fine concentric guilloché
  x.lineWidth = Math.max(1, size / 1400);
  for (let r = 0.06; r < 0.93; r += 0.012) {
    x.strokeStyle = `rgba(255,240,220,${0.018 + (r % 0.06 < 0.012 ? 0.02 : 0)})`;
    x.beginPath();
    x.arc(cx, cy, r * S, 0, Math.PI * 2);
    x.stroke();
  }

  // scale ticks along the arc
  for (let a = -30; a <= 210.01; a += 3) {
    const major = Math.round(a + 30) % 30 === 0;
    const [x1, y1] = P(a, major ? 0.645 : 0.665);
    const [x2, y2] = P(a, 0.705);
    x.strokeStyle = major ? 'rgba(246,238,226,0.9)' : 'rgba(246,238,226,0.38)';
    x.lineWidth = (major ? 0.0065 : 0.0035) * S;
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(x1, y1);
    x.lineTo(x2, y2);
    x.stroke();
  }
  // thin arc line under the zones
  x.strokeStyle = 'rgba(246,238,226,0.22)';
  x.lineWidth = 0.003 * S;
  x.beginPath();
  x.arc(cx, cy, 0.81 * S, (30 * Math.PI) / 180, (150 * Math.PI) / 180, true);
  x.stroke();

  // zone labels (upright, Arabic shaping preserved — no letter spacing)
  x.direction = 'rtl';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  const label = (text: string, a: number, r: number, color: string, px: number) => {
    const [lx, ly] = P(a, r);
    x.fillStyle = color;
    x.font = `600 ${Math.round(px * S)}px ${BODY}`;
    x.fillText(text, lx, ly);
  };
  label('لم يظهر تعارض', 22, 0.47, '#8fdcb1', 0.056);
  label('يتطلب معلومات', 90, 0.56, '#e6d6b6', 0.054);
  label('مؤشرات تعارض', 158, 0.47, '#f19a8c', 0.056);

  // wordmark + scope note
  x.fillStyle = '#f6eee2';
  x.font = `700 ${Math.round(0.118 * S)}px ${DISPLAY}`;
  x.fillText('معيار', cx, cy + 0.36 * S);
  x.fillStyle = 'rgba(246,238,226,0.62)';
  x.font = `500 ${Math.round(0.046 * S)}px ${BODY}`;
  x.fillText('في حدود المراجع المفحوصة', cx, cy + 0.52 * S);

  // small orange index dot at the top of the scale
  const [ix, iy] = P(90, 0.6);
  x.fillStyle = '#ec6a2e';
  x.beginPath();
  x.arc(ix, iy, 0.012 * S, 0, Math.PI * 2);
  x.fill();

  // edge vignette for depth under the bezel
  const v = x.createRadialGradient(cx, cy, size * 0.4, cx, cy, size * 0.5);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.55)');
  x.fillStyle = v;
  x.fillRect(0, 0, size, size);
  return c;
}
