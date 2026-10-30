/**
 * HR-E01 timeline — one entry per spoken line of the script (hudood-raqmiya/episodes/HR-E01/script.md).
 * Before filming the times are ESTIMATES (≈2.5 words/s). After Tamim films, replace `measured`
 * with the real line times from the footage (ASR) and every graphic re-syncs automatically.
 */
export type Layout = 'full' | 'pip' | 'gone';
export type Line = {id: string; text: string; layout: Layout; start: number; end: number};

const RAW: {id: string; text: string; layout: Layout}[] = [
  {id: 'L01', text: 'انت المواطن السعودي… الهدف الرئيسي.', layout: 'full'},
  {id: 'L02', text: 'أنا تميم الحارثي، حصلت على زمالة الإعلام الرقمي السعودي،', layout: 'full'},
  {id: 'L03', text: 'وعملت على مشروع تخرجي اللي فاز بلقب المشروع المتميز.', layout: 'full'},
  {id: 'L04', text: 'المشكلة اللي يحلها مشروعي هي ضبط المحتوى الرقمي السعودي.', layout: 'pip'},
  {id: 'L05', text: 'كنت ناوي يكون مشروع ربحي، منصة تقدم خدمات مقابل رسوم…', layout: 'pip'},
  {id: 'L06', text: 'لكن اليوم قررت إنه يكون مشروع مفتوح المصدر لكل سعودي،', layout: 'pip'},
  {id: 'L07', text: 'مساهمة لحماية وطننا الغالي.', layout: 'pip'},
  {id: 'L08', text: 'هذا الفيديو مقدمة لسلسلة أستهدف فيها كل مواطن سعودي عنده حساب على أي وسيلة تواصل.', layout: 'pip'},
  {id: 'L09', text: 'وأتمنى تساعدوني يوصل لكل سعودي.', layout: 'full'},
  {id: 'L10', text: 'لأن أي محتوى على وسائل التواصل يتكلم عن السعودية،', layout: 'pip'},
  {id: 'L11', text: 'سواء كان سياسي، اجتماعي، رياضي، تعليمي، تاريخي، قصص، منتجات…', layout: 'pip'},
  {id: 'L12', text: 'طالما له علاقة بالسعودية والسعوديين، مصدره سعودي أو غير سعودي، جهة رسمية أو غير رسمية، موثوقة أو لا…', layout: 'pip'},
  {id: 'L13', text: 'فهذا المحتوى صُنع عشان يستهدفك أنت.', layout: 'pip'},
  {id: 'L14', text: 'إيه… أنت، المواطن السعودي، الهدف الرئيسي لهذا المحتوى.', layout: 'full'},
  {id: 'L15', text: 'طيب، اللي صنع هذا المحتوى… وش يبي منك؟', layout: 'full'},
  {id: 'L16', text: 'والله يبون منك أشياء كثيرة… بعضها هدفها الخير لك، وبعضها هدفها شر عليك.', layout: 'pip'},
  {id: 'L17', text: 'هذا اللي راح أتحدث فيه في هذي السلسلة العملية،', layout: 'pip'},
  {id: 'L18', text: 'واللي فيها خلاصة تجارب ومعلومات مهمة لكل مواطن سعودي.', layout: 'pip'},
  {id: 'L19', text: 'وفيها مشروعي «معيار»، مفتوح للجميع يستخدمه ويطوره.', layout: 'pip'},
  {id: 'L20', text: 'تابعوني، وانتظروا الفيديو القادم.', layout: 'full'},
];

/** real line times from the footage, filled after filming: {L01: [start, end], …} */
export const measured: Record<string, [number, number]> = {};

const WPS = 2.5;
const GAP = 0.3;
const words = (t: string) => t.replace(/[«»"'…،؛,.!?؟:()\-—]/g, ' ').split(/\s+/).filter(Boolean).length;

export const LINES: Line[] = (() => {
  let t = 0.15;
  return RAW.map((r) => {
    const m = measured[r.id];
    const d = Math.max(1.1, words(r.text) / WPS + 0.2);
    const start = m ? m[0] : t;
    const end = m ? m[1] : t + d;
    t = end + GAP;
    return {...r, start, end};
  });
})();

export const line = (id: string) => {
  const l = LINES.find((x) => x.id === id);
  if (!l) throw new Error(`unknown line ${id}`);
  return l;
};

/** time of a word inside a line, proportional to character position */
export const wordAt = (id: string, word: string) => {
  const l = line(id);
  const i = l.text.indexOf(word);
  return i < 0 ? l.start : l.start + ((l.end - l.start) * i) / l.text.length;
};

export const TOTAL = LINES[LINES.length - 1].end + 2.6;
