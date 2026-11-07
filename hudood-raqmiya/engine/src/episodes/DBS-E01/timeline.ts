/**
 * «جندي على الحدود الرقمية» — الحلقة التعريفية. Lines of Tamim's final script.
 * Durations are ESTIMATES until his recording arrives; then replace `dur` with measured times
 * (or set `start` directly) and everything — camera, props, sound — re-syncs.
 */
export type Line = {id: string; text: string; dur: number; start: number; end: number};

const RAW: [string, string, number][] = [
  ['L01', 'تدري ان جوالك يمثل الحدود الرقمية للوطن', 3.2],
  ['L02', 'المادة 34 من النظام الأساسي للحكم تنص على', 3.0],
  ['L03', 'الدفاع عن العقيدة الإسلامية والمجتمع والوطن واجب على كل مواطن', 4.3],
  ['L04', 'اي محتوى موجه للسعودية سياسي ثقافي رياضي اقتصادي', 4.2],
  ['L05', 'يستهدفك أنت', 1.6],
  ['L06', 'عشان تتعامل مع هالمحتوى نحتاج نوع مختلف من الجنود', 3.4],
  ['L07', 'ومن هنا انطلقت مبادرة جندي على الحدود الرقمية', 3.2],
  ['L08', 'في كل حلقة، بنكشف أسلوب من الأساليب الي يستخدمونها الاعداء للتأثير علينا عبر وسائل التواصل الاجتماعي', 5.8],
  ['L09', 'وبنفهم وش التصرف الأنسب للدفاع', 2.5],
  ['L10', 'ومو بس كذا!', 1.2],
  ['L11', 'منصة معيار مفتوحة المصدر أداة تساعدك تراجع كلامك قبل تنشره', 4.0],
  ['L12', 'بالاستناد إلى الأنظمة الإعلامية السعودية الموجودة من الاساس لحمايتنا', 4.3],
  ['L13', 'وهذه المنصة حاصلة على لقب المشروع المتميز من زمالة الاعلام الرقمي', 4.2],
  ['L14', 'رابط المنصة في الوصف', 1.6],
  ['L15', 'انا تميم الحارثي', 1.9],
  ['L16', 'وعينا مع الأنظمة السعودية يحمي حدودنا الرقمية', 3.6],
];
const GAP = 0.32;
const LEAD = 0.7;

export const LINES: Line[] = (() => {
  let t = LEAD;
  return RAW.map(([id, text, dur]) => {
    const l = {id, text, dur, start: t, end: t + dur};
    t += dur + GAP;
    return l;
  });
})();
export const L = (id: string) => LINES.find((l) => l.id === id)!;
export const TOTAL = LINES[LINES.length - 1].end + 2.4;
/** time of the k-th of n evenly spaced beats inside a line (for words we can't measure yet) */
export const beat = (id: string, k: number, n: number) => {
  const l = L(id);
  return l.start + ((k + 0.5) / n) * l.dur;
};
