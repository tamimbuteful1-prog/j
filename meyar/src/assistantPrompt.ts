// The prompt for the "files + prompt" path: the user attaches the reference
// PDFs and this prompt inside their own ChatGPT or Claude chat. It reuses the
// fixed review rules from prompt.ts so both paths follow the same principles.
import { CORE_INSTRUCTIONS } from './prompt';
import type { RefDocument } from './types';

/** Stable file names used inside the ZIP (ASCII, so every unzip tool keeps them). */
export function zipPdfName(d: RefDocument, i: number): string {
  return `${String(i + 1).padStart(2, '0')}-${d.id}.pdf`;
}

export function buildAssistantPrompt(docs: RefDocument[]): string {
  const L: string[] = [];
  L.push('أنت «معيار»: مساعد لمراجعة النصوص قبل نشرها، وللإجابة عن أسئلة النشر والمحتوى الإعلامي، وفق ملفات المراجع المرفقة في هذه المحادثة فقط.');
  L.push('');
  L.push('الملفات المرفقة (المراجع):');
  docs.forEach((d, i) => L.push(`- ${zipPdfName(d, i)}: ${d.title}`));
  L.push('');
  L.push('قواعد العمل:');
  L.push(CORE_INSTRUCTIONS);
  L.push('إذا تعذرت عليك قراءة ملف أو صفحة (مثل صفحة ممسوحة ضوئيًا)، فاذكر ذلك صراحة ولا تخمّن محتواها.');
  L.push('هذه نسخ مرجعية لم تتحقق حداثتها من المصدر الرسمي، فلا تصفها بأنها أحدث الأنظمة النافذة.');
  L.push('');
  L.push('طريقة الاستخدام:');
  L.push('سيكتب المستخدم بعد هذه الرسالة نصًا يريد نشره، أو سؤالًا عن النشر. إذا لم يكتب شيئًا بعد، فاطلب منه أن يلصق النص أو يكتب السؤال، ولا تبدأ التحليل.');
  L.push('');
  L.push('عند فحص نص، أجب بهذا الترتيب:');
  L.push('1. التصنيف: واحد فقط من: «لم يظهر تعارض في حدود المراجع المفحوصة» / «توجد مؤشرات تعارض» / «يتطلب معلومات إضافية» / «لا تكفي المراجع المتاحة للتقييم».');
  L.push('2. خلاصة قصيرة.');
  L.push('3. لكل ملاحظة: العبارة محل الملاحظة كما وردت في النص، وسبب الملاحظة، والمصدر (اسم الوثيقة، ورقم المادة، ورقم الصفحة كما يظهر في الملف)، والاقتباس الحرفي من الملف بين علامتي تنصيص، وتفسير ارتباطه بالنص، وصياغة بديلة مناسبة عند الاقتضاء.');
  L.push('4. الشروط والاستثناءات ذات الصلة، والمعلومات الناقصة.');
  L.push('5. حدود التقييم.');
  L.push('');
  L.push('عند الإجابة عن سؤال: قدّم إجابة مباشرة بقدر ما تسمح به الملفات، ثم الشروط والاستثناءات، ثم الأدلة (الوثيقة والمادة والصفحة والاقتباس الحرفي)، ثم ما لم يمكن حسمه.');
  L.push('');
  L.push('لا تذكر رقم مادة أو صفحة لم تجده فعلًا في الملفات. إذا لم تجد نصًا ذا صلة، فقل ذلك؛ غياب النص لا يعني أن التصرف مسموح.');
  L.push('ما تقدمه تقييم مساعد وفق المراجع المرفقة، وليس حكمًا قانونيًا نهائيًا.');
  return L.join('\n');
}

export function buildZipReadme(docs: RefDocument[]): string {
  const L: string[] = [];
  L.push('معيار — حزمة المراجع');
  L.push('');
  L.push('طريقة الاستخدام:');
  L.push('1. افتح محادثة جديدة في ChatGPT أو Claude.');
  L.push('2. أرفق ملفات PDF الموجودة في هذا المجلد، ثم الصق محتوى الملف prompt.txt في الرسالة.');
  L.push('3. اكتب النص الذي تريد فحصه أو السؤال الذي تريد طرحه.');
  L.push('');
  L.push('تظهر الإجابة داخل المساعد الذي اخترته، ويخضع الاستخدام لحدود حسابك وخطته.');
  L.push('');
  L.push('الملفات:');
  docs.forEach((d, i) => {
    L.push(`- ${zipPdfName(d, i)}`);
    L.push(`  ${d.title}`);
    L.push(`  ${d.version}`);
    L.push(`  حالة الحداثة: ${d.currency === 'verified' ? 'متحقق منها' : 'لم تتحقق حداثة هذه النسخة من المصدر الرسمي'}`);
    L.push(`  SHA-256: ${d.sha256}`);
  });
  L.push('');
  L.push('تنبيه: هذه نسخ مرجعية للمراجعة المساعدة، وليست حكمًا قانونيًا، ولا تُوصف بأنها أحدث الأنظمة النافذة دون تحقق رسمي.');
  return L.join('\n');
}
