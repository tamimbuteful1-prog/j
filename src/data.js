/* ------------------------------------------------------------------
   BURHAN — Regulatory Evidence Twin
   Demo content. Every facility, system, component and record below is
   fictional and exists only inside this prototype.
------------------------------------------------------------------ */

export const BASE_INTEGRITY = 96;

/* §4 — the real-world changes BURHAN watches */
export const monitoredChanges = [
  {
    id: "MNT",
    ar: "صيانة مكوّن",
    en: "Component maintenance",
    q: "هل تمت الصيانة، وهل وُثّقت، وهل نُفّذ اختبار ما بعد الصيانة؟"
  },
  {
    id: "RPL",
    ar: "استبدال مكوّن",
    en: "Component replacement",
    q: "هل المكوّن الجديد متوافق مع التصميم والمتطلبات؟"
  },
  {
    id: "MOD",
    ar: "تعديل هندسي دائم",
    en: "Permanent design modification",
    q: "هل تم تقييمه واعتماده وتوثيقه؟"
  },
  {
    id: "TMP",
    ar: "تعديل مؤقت",
    en: "Temporary modification",
    q: "هل ما زال قائمًا؟ هل تجاوز فترة المراجعة؟ هل قُيّم أثره؟"
  },
  {
    id: "PRC",
    ar: "تحديث إجراء",
    en: "Procedure revision",
    q: "هل الفرق الميدانية تستخدم النسخة المعتمدة الحالية؟"
  },
  {
    id: "ASB",
    ar: "اختلاف As-Built",
    en: "As-built discrepancy",
    q: "هل الواقع الفعلي للمنشأة مطابق للوثائق؟"
  },
  {
    id: "AGE",
    ar: "تقادم المكونات",
    en: "Component ageing",
    q: "هل أداء المكوّن ما زال ضمن الحالة المطلوبة؟"
  },
  {
    id: "TST",
    ar: "اختبار جديد",
    en: "New test result",
    q: "هل تؤثر النتيجة على أي افتراض من افتراضات السلامة؟"
  },
  {
    id: "ORG",
    ar: "تغيير تنظيمي",
    en: "Organizational change",
    q: "هل تغيّرت مسؤوليات أو صلاحيات مرتبطة بالسلامة؟"
  }
];

/* §41 — the evidence chain of the demo scenario */
export const evidenceNodes = [
  { id: "REQ", title: "Regulatory Requirement", ar: "متطلب رقابي", subtitle: "NR-04", x: 50, y: 6 },
  { id: "FUN", title: "Safety Function", ar: "وظيفة سلامة", subtitle: "Residual Heat Removal", x: 50, y: 26 },
  { id: "SYS", title: "System", ar: "نظام", subtitle: "Cooling CS-01", x: 50, y: 46 },
  { id: "CMP", title: "Component", ar: "مكوّن", subtitle: "Pump P-04", x: 17, y: 70 },
  { id: "PRO", title: "Procedure", ar: "إجراء", subtitle: "MNT-204 Rev.08", x: 50, y: 70 },
  { id: "TST", title: "Verification", ar: "تحقق", subtitle: "Post-Maintenance Test", x: 83, y: 70 },
  { id: "EVD", title: "Evidence", ar: "دليل", subtitle: "Verification Package", x: 50, y: 92 }
];

/* Which node each demo event lands on, so the graph can light up. */
export const eventNodeMap = { 1: "CMP", 2: "PRO", 3: "TST", 4: "SYS" };

/* §45 — the demo timeline */
export const demoEvents = [
  {
    id: 1,
    code: "EVENT 01",
    time: "08:30",
    title: "Maintenance completed",
    titleAr: "اكتملت الصيانة",
    description: "Scheduled maintenance completed on Pump P-04.",
    descriptionAr: "تم تنفيذ صيانة مجدولة على المضخة P-04. حتى الآن لا توجد مؤشرات تستدعي الانتباه.",
    impact: 0,
    status: "normal"
  },
  {
    id: 2,
    code: "EVENT 02",
    time: "09:02",
    title: "Procedure revision mismatch",
    titleAr: "اختلاف في نسخة الإجراء",
    description: "Evidence references Rev.07 while current approved procedure is Rev.08.",
    descriptionAr: "الدليل المرفق يشير إلى النسخة REV.07 بينما النسخة المعتمدة الحالية هي REV.08.",
    impact: -10,
    status: "warning"
  },
  {
    id: 3,
    code: "EVENT 03",
    time: "09:16",
    title: "Verification evidence incomplete",
    titleAr: "دليل التحقق غير مكتمل",
    description: "Required post-maintenance verification evidence is not attached.",
    descriptionAr: "اختبار التحقق بعد الصيانة غير موجود ضمن سلسلة الأدلة المرتبطة بالمكوّن.",
    impact: -14,
    status: "warning"
  },
  {
    id: 4,
    code: "EVENT 04",
    time: "09:34",
    title: "Temporary modification review overdue",
    titleAr: "تعديل مؤقت تجاوز موعد المراجعة",
    description: "TM-204 affects the same system and has exceeded its scheduled review date.",
    descriptionAr: "التعديل المؤقت TM-204 مرتبط بنفس النظام وتجاوز موعد المراجعة المحدد له.",
    impact: -12,
    status: "critical"
  }
];

/* §46 — prototype prioritization arithmetic, not a safety rating. */
export function integrityAfter(step) {
  return Math.max(
    0,
    BASE_INTEGRITY +
      demoEvents.slice(0, step).reduce((total, event) => total + event.impact, 0)
  );
}

/* §5 — baseline status strip */
export const baselineStatus = [
  { label: "CONFIGURATION", value: "MATCHED", ar: "التهيئة" },
  { label: "DOCUMENTATION", value: "CURRENT", ar: "الوثائق" },
  { label: "TESTING", value: "VERIFIED", ar: "الاختبارات" },
  { label: "MODIFICATIONS", value: "CONTROLLED", ar: "التعديلات" }
];

/* Same strip, after the four events have landed. */
export const degradedStatus = [
  { label: "CONFIGURATION", value: "MATCHED", ar: "التهيئة", state: "ok" },
  { label: "DOCUMENTATION", value: "MISMATCH", ar: "الوثائق", state: "warn" },
  { label: "TESTING", value: "INCOMPLETE", ar: "الاختبارات", state: "warn" },
  { label: "MODIFICATIONS", value: "OVERDUE", ar: "التعديلات", state: "crit" }
];

/* §12 — processing layers */
export const layers = [
  {
    id: "L1",
    name: "Regulatory Data Layer",
    ar: "طبقة البيانات الرقابية",
    detail: "الوثائق · الصيانة · الاختبارات · التقارير · نتائج التفتيش · التعديلات · السجلات · الإجراءات · بيانات الأنظمة"
  },
  {
    id: "L2",
    name: "Evidence Graph",
    ar: "شبكة الأدلة",
    detail: "يربط كل دليل بالمتطلب الرقابي الذي يثبته، وبالنظام والمكوّن والإجراء المرتبط به."
  },
  {
    id: "L3",
    name: "Risk Engine",
    ar: "محرك التحليل",
    detail: "يبحث عن العلاقات والتغيرات المتراكمة والأدلة الناقصة على نفس نظام السلامة."
  },
  {
    id: "L4",
    name: "Explainable AI",
    ar: "التفسير",
    detail: "يشرح سبب كل تنبيه: المتطلب المتأثر، الأدلة، التغييرات المساهمة، ومصدر كل معلومة."
  },
  {
    id: "L5",
    name: "Regulatory Case Management",
    ar: "إدارة الحالات الرقابية",
    detail: "يفتح حالة رقابية قابلة للتتبع والإسناد والإغلاق."
  },
  {
    id: "L6",
    name: "Inspection Management",
    ar: "إدارة التفتيش",
    detail: "يحوّل الحالة إلى مهمة تفتيش ميدانية بأهداف وقائمة تحقق واضحة."
  },
  {
    id: "L7",
    name: "Human Regulatory Decision",
    ar: "القرار الرقابي البشري",
    detail: "المختص هو من يتخذ القرار النهائي. النظام يجهّز، ولا يقرر.",
    human: true
  }
];

/* §17 — the three products */
export const products = [
  {
    id: "command",
    name: "BURHAN Command Center",
    ar: "مركز القيادة",
    audience: "الإدارة العليا",
    items: [
      "حالة المنشآت",
      "الحالات المفتوحة",
      "الأنظمة التي تحتاج مراجعة",
      "اتجاهات الحالات",
      "أولويات التفتيش",
      "الإجراءات التصحيحية",
      "مؤشرات الأداء الرقابي"
    ]
  },
  {
    id: "workspace",
    name: "BURHAN Regulatory Workspace",
    ar: "بيئة العمل الرقابية",
    audience: "المشرفون والمفتشون والمتخصصون",
    items: [
      "فتح الحالات",
      "مراجعة الأدلة",
      "توزيع مهام التفتيش",
      "مراجعة التعديلات",
      "متابعة Findings",
      "متابعة الإجراءات التصحيحية",
      "إصدار التوصيات",
      "حفظ القرارات"
    ]
  },
  {
    id: "inspector",
    name: "BURHAN Inspector",
    ar: "تطبيق المفتش الميداني",
    audience: "المفتش في الموقع",
    items: [
      "استلام مهمة ومعرفة سببها",
      "مشاهدة المتطلبات المرتبطة",
      "مراجعة الأدلة",
      "التقاط صورة أو رفع مستند",
      "تسجيل ملاحظة أو قراءة",
      "توقيع الدليل",
      "إنهاء مهمة التفتيش"
    ]
  }
];

/* §50 — facility profile screen */
export const facility = {
  name: "Research Facility A",
  ar: "منشأة بحثية (افتراضية)",
  authorization: "ACTIVE",
  integrity: 92,
  openCases: "03",
  deviations: "01",
  pendingMods: "02",
  systems: [
    { name: "Cooling", ar: "التبريد", state: "NORMAL" },
    { name: "Electrical", ar: "الكهرباء", state: "NORMAL" },
    { name: "Emergency Power", ar: "الطاقة الاحتياطية", state: "REVIEW" },
    { name: "Fire Protection", ar: "الحماية من الحريق", state: "NORMAL" },
    { name: "Instrumentation", ar: "أنظمة القياس", state: "MONITOR" }
  ]
};

/* §51 — inspector mission */
export const mission = {
  caseId: "BR-0241",
  system: "Cooling System CS-01",
  component: "Pump P-04",
  objective: "Verify evidence consistency after maintenance activity.",
  objectiveAr: "التحقق من اتساق الأدلة بعد نشاط الصيانة.",
  checklist: [
    { mark: "done", label: "Component identity", ar: "هوية المكوّن" },
    { mark: "done", label: "Maintenance record", ar: "سجل الصيانة" },
    { mark: "flag", label: "Procedure revision", ar: "نسخة الإجراء" },
    { mark: "flag", label: "Verification test", ar: "اختبار التحقق" },
    { mark: "open", label: "Temporary modification", ar: "التعديل المؤقت" },
    { mark: "open", label: "Field configuration", ar: "التهيئة الميدانية" }
  ],
  capture: ["CAMERA", "DOCUMENT", "NOTE", "READING"]
};

/* §18 — regulatory case lifecycle */
export const caseFlow = [
  { en: "Anomaly Detected", ar: "رصد حالة غير معتادة" },
  { en: "Evidence Correlation", ar: "ربط الأدلة" },
  { en: "Risk Signal", ar: "إشارة أولوية" },
  { en: "Supervisor Review", ar: "مراجعة المشرف" },
  { en: "Inspector Assignment", ar: "إسناد مهمة تفتيش" },
  { en: "Field Verification", ar: "تحقق ميداني" },
  { en: "Technical Assessment", ar: "تقييم فني" },
  { en: "Regulatory Decision", ar: "قرار رقابي" },
  { en: "Corrective Action", ar: "إجراء تصحيحي" },
  { en: "Verification", ar: "التحقق من التنفيذ" },
  { en: "Case Closed", ar: "إغلاق الحالة" }
];

/* §19 — accountability record */
export const accountability = [
  { key: "WHO", ar: "من قام بالفعل؟", sample: "Inspector · INS-118" },
  { key: "WHAT", ar: "ماذا فعل؟", sample: "Field verification of P-04" },
  { key: "WHEN", ar: "متى؟", sample: "09:52 · same day" },
  { key: "WHY", ar: "لماذا؟", sample: "Case BR-0241 · evidence gap" },
  { key: "EVIDENCE", ar: "ما الدليل؟", sample: "Photo + reading + note" },
  { key: "APPROVED BY", ar: "من اعتمد؟", sample: "Supervisor · SUP-07" }
];

/* §20-21 — levels and roles */
export const orgLevels = [
  "Executive Management",
  "Sector Manager",
  "Supervisor",
  "Inspector",
  "Technical Specialist"
];

export const roles = [
  "Executive",
  "Sector Manager",
  "Supervisor",
  "Inspector",
  "Technical Specialist",
  "Cybersecurity Officer",
  "Auditor",
  "Facility Operator",
  "System Administrator"
];

/* §22 — separation between regulator and operator */
export const operatorCan = [
  "استلام Finding",
  "رفع الأدلة",
  "إرسال الرد",
  "تنفيذ Corrective Action",
  "متابعة الحالة المتاحة له"
];

export const operatorCannot = [
  "ملاحظات المفتش الداخلية",
  "التحليل الداخلي",
  "المقارنات بين المنشآت",
  "التوصيات السرية",
  "تقييمات الإدارة الرقابية"
];

/* §23 — corrective action tracking */
export const capa = {
  finding: "Post-maintenance verification incomplete.",
  findingAr: "دليل التحقق بعد الصيانة غير مكتمل.",
  action: "Complete functional verification.",
  actionAr: "استكمال التحقق الوظيفي وإرفاق الدليل.",
  deadline: "48 Hours",
  status: "OPEN",
  tracked: ["Deadline", "Evidence Received", "Technical Review", "Verification", "Closure"]
};

/* §26 — smart search demo */
export const searchQuery =
  "أظهر جميع التعديلات خلال آخر ستة أشهر المرتبطة بنظام الطاقة الاحتياطية والتي تحتوي على أدلة تحقق غير مكتملة.";

export const searchResults = [
  {
    id: "TM-311",
    type: "Temporary Modification",
    system: "Emergency Power EP-02",
    state: "Verification incomplete",
    source: "Modification register · rev 3",
    tone: "warn"
  },
  {
    id: "MOD-118",
    type: "Permanent Modification",
    system: "Emergency Power EP-02",
    state: "Verification incomplete",
    source: "Design change package",
    tone: "warn"
  },
  {
    id: "TM-204",
    type: "Temporary Modification",
    system: "Cooling CS-01",
    state: "Review overdue",
    source: "Modification register · rev 5",
    tone: "crit"
  }
];

/* §27 — controlled prototype scope */
export const prototypeScope = [
  { n: "01", label: "نظام سلامة واحد", en: "Cooling System" },
  { n: "10", label: "مكونات", en: "Components" },
  { n: "20", label: "متطلبًا رقابيًا", en: "Regulatory Requirements" },
  { n: "100", label: "سجل دليل", en: "Evidence Records" },
  { n: "05", label: "حالات رقابية محاكاة", en: "Simulated Cases" }
];

export const prototypeProves = [
  "ربط الأدلة",
  "اكتشاف التعارض",
  "كشف الدليل الناقص",
  "إنشاء تنبيه",
  "شرح السبب",
  "فتح حالة رقابية",
  "إنشاء مهمة تفتيش",
  "إغلاق الحالة"
];

/* §28 — phases */
export const phases = [
  { n: "Phase 1", en: "Controlled Prototype", ar: "نموذج أولي محكوم — نظام واحد." },
  { n: "Phase 2", en: "Regulatory Sandbox", ar: "اختبارات وبيانات أكثر واقعية." },
  { n: "Phase 3", en: "Single System Pilot", ar: "تطبيق محدود على نظام واحد." },
  { n: "Phase 4", en: "Facility Regulatory Twin", ar: "ربط عدة أنظمة داخل منشأة." },
  { n: "Phase 5", en: "Multi-Facility Platform", ar: "ربط عدة منشآت." },
  { n: "Phase 6", en: "National Regulatory Evidence Platform", ar: "منصة تدعم مستقبل الرقابة النووية الرقمية." }
];

/* §30 — impact */
export const impact = [
  "تقليل النقاط العمياء الرقابية",
  "تحسين تتبع الأدلة",
  "تسريع الوصول للمعلومة",
  "رفع كفاءة التفتيش",
  "ترتيب الأولويات",
  "متابعة التعديلات",
  "متابعة الأدلة الناقصة",
  "الحفاظ على المعرفة المؤسسية",
  "دعم الرقابة المبنية على المخاطر",
  "تحسين قابلية التدقيق",
  "تحسين استمرارية المعرفة عبر دورة حياة المنشأة"
];

/* §59 — explicit non-claims */
export const nonClaims = [
  "لا نتنبأ بالحوادث النووية.",
  "لا يقرر الذكاء الاصطناعي سلامة المنشأة.",
  "لن نستبدل المفتش."
];

/* §14 — what the AI is used for */
export const aiUses = [
  "اكتشاف الأدلة الناقصة",
  "ربط الأحداث",
  "اكتشاف التعارضات",
  "مقارنة نسخ الوثائق",
  "تحديد العلاقات",
  "اكتشاف الأنماط",
  "ترتيب الأولويات",
  "البحث داخل الأدلة",
  "تلخيص الحالة للمفتش",
  "مقارنة الحالات المشابهة"
];
