/** توحيد النص العربي قبل التحليل */
export function normalizeArabic(input: string): string {
  return input
    .replace(/[ً-ٰٟـ]/g, '') // تشكيل وتطويل
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, '.')
    .replace(/(\d)[,،٬](\d{3})/g, '$1$2')
    .replace(/[؟?!.,،؛:"'()«»\-_/]+/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
