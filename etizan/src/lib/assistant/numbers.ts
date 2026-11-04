/**
 * استخراج الأرقام من نص عربي مُوحَّد: أرقام (120) أو كلمات (ميه وعشرين).
 */
const UNITS: Record<string, number> = {
  واحد: 1, وحده: 1, اثنين: 2, اثنان: 2, ثنين: 2, اثنتين: 2,
  ثلاث: 3, ثلاثه: 3, ثلث: 3, اربع: 4, اربعه: 4, خمس: 5, خمسه: 5,
  ست: 6, سته: 6, سبع: 7, سبعه: 7, ثمان: 8, ثمانيه: 8, ثمنيه: 8, ثماني: 8,
  تسع: 9, تسعه: 9, عشر: 10, عشره: 10,
  حدعش: 11, احدعش: 11, اطنعش: 12, اثنعش: 12, ثلطعش: 13, ثلاثطعش: 13, اربعطعش: 14, خمسطعش: 15,
  ستطعش: 16, سبعطعش: 17, ثمنطعش: 18, تسعطعش: 19,
  عشرين: 20, عشرون: 20, ثلاثين: 30, ثلاثون: 30, اربعين: 40, اربعون: 40, خمسين: 50, خمسون: 50,
  ستين: 60, ستون: 60, سبعين: 70, سبعون: 70, ثمانين: 80, ثمانون: 80, تسعين: 90, تسعون: 90,
  ميه: 100, مائه: 100, مايه: 100, مئه: 100, ميتين: 200, مئتين: 200, مائتين: 200, ميتان: 200, ماتين: 200,
  ثلاثميه: 300, ثلثميه: 300, ثلاثمائه: 300, اربعميه: 400, اربعمائه: 400, خمسميه: 500, خمسمائه: 500,
  ستميه: 600, ستمائه: 600, سبعميه: 700, سبعمائه: 700, ثمانميه: 800, ثمنميه: 800, ثمانمائه: 800,
  تسعميه: 900, تسعمائه: 900,
};
const THOUSANDS: Record<string, number> = { الف: 1000, الاف: 1000, آلاف: 1000, الفين: 2000, الفان: 2000 };

export interface FoundNumber {
  value: number;
  index: number; // موضع الكلمة الأولى (بالكلمات)
}

function wordValue(w: string): { v: number; kind: 'unit' | 'k' } | null {
  if (w in UNITS) return { v: UNITS[w], kind: 'unit' };
  if (w in THOUSANDS) return { v: THOUSANDS[w], kind: 'k' };
  return null;
}

export function extractNumbers(text: string): FoundNumber[] {
  const words = text.split(' ');
  const out: FoundNumber[] = [];
  let i = 0;
  while (i < words.length) {
    const w = words[i];
    const digit = w.match(/^و?(\d+(?:\.\d+)?)$/);
    if (digit) {
      let v = Number(digit[1]);
      // "3 الاف" أو "5 الف"
      if (words[i + 1] && /^(الف|الاف)$/.test(words[i + 1])) {
        v *= 1000;
        i++;
      }
      out.push({ value: v, index: i });
      i++;
      continue;
    }
    // سلسلة كلمات رقمية
    let total = 0;
    let current = 0;
    let start = -1;
    let j = i;
    while (j < words.length) {
      let token = words[j];
      let wv = wordValue(token);
      if (!wv && token.startsWith('و') && start >= 0) {
        token = token.slice(1);
        wv = wordValue(token);
      }
      if (!wv) break;
      if (start < 0) start = j;
      if (wv.kind === 'k') {
        total += wv.v === 2000 ? 2000 : (current || 1) * 1000;
        current = 0;
      } else if (wv.v === 10 && current > 0 && current < 10) {
        current += 10; // ثلاث عشر
      } else {
        current += wv.v;
      }
      j++;
    }
    if (start >= 0) {
      const v = total + current;
      if (v > 0) out.push({ value: v, index: start });
      i = j;
    } else {
      i++;
    }
  }
  return out;
}
