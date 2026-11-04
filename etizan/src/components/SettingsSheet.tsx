'use client';
import { confirmAction } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { WEEKDAYS_AR, todayISO } from '@/lib/dates';
import { createDemo } from '@/lib/demo';
import Sheet from './Sheet';
import { useUI } from './ui-store';

export default function SettingsSheet() {
  const { settingsOpen, setSettings } = useUI();
  const settings = useStore((s) => s.data.settings);
  const data = useStore((s) => s.data);
  const { updateSettings, reset, replaceData } = useStore();
  const toggleDay = (d: number) =>
    updateSettings({ workDays: settings.workDays.includes(d) ? settings.workDays.filter((x) => x !== d) : [...settings.workDays, d].sort() });

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `etizan-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importJSON = (f: File) =>
    f.text().then((t) => {
      try {
        const d = JSON.parse(t);
        if (d?.version === 1 && Array.isArray(d.fixedObligations)) replaceData(d);
      } catch {}
    });

  return (
    <Sheet open={settingsOpen} onClose={() => setSettings(false)} title="الإعدادات">
      <div className="flex flex-col gap-6 pt-2">
        <section>
          <h3 className="mb-2 text-[16px] font-semibold">أيام العمل في أوبر</h3>
          <p className="mb-3 text-[14px] text-muted">يتوزع العجز على هذه الأيام فقط</p>
          <div className="grid grid-cols-4 gap-2">
            {WEEKDAYS_AR.map((n, i) => (
              <button key={n} onClick={() => toggleDay(i)} className={`rounded-2xl border py-3 text-[15px] font-medium ${settings.workDays.includes(i) ? 'border-transparent bg-mint-deep text-white' : 'border-line bg-white text-ink-2'}`}>
                {n}
              </button>
            ))}
          </div>
        </section>
        <section>
          <h3 className="mb-2 text-[16px] font-semibold">الاسم في الترحيب</h3>
          <input value={settings.name} onChange={(e) => updateSettings({ name: e.target.value })} className="card h-14 w-full px-4 text-[18px] outline-none" />
        </section>
        <section className="flex items-center justify-between">
          <h3 className="text-[16px] font-semibold">شكل الأرقام</h3>
          <div className="flex gap-2">
            {(['latin', 'arabic'] as const).map((d) => (
              <button key={d} onClick={() => updateSettings({ digits: d })} className={`tnum rounded-2xl border px-4 py-2.5 text-[17px] ${settings.digits === d ? 'border-transparent bg-ink text-white' : 'border-line bg-white'}`}>
                {d === 'latin' ? '123' : '١٢٣'}
              </button>
            ))}
          </div>
        </section>
        <section className="flex items-center justify-between">
          <h3 className="text-[16px] font-semibold">قراءة الرد بالصوت</h3>
          <button onClick={() => updateSettings({ speakReplies: !settings.speakReplies })} className={`h-9 w-16 rounded-full p-1 transition ${settings.speakReplies ? 'bg-mint-deep' : 'bg-line'}`} aria-pressed={settings.speakReplies}>
            <span className={`block h-7 w-7 rounded-full bg-white shadow transition ${settings.speakReplies ? '-translate-x-7' : ''}`} />
          </button>
        </section>
        <section className="flex flex-col gap-2 border-t border-line pt-5">
          <h3 className="text-[16px] font-semibold">البيانات</h3>
          <p className="text-[14px] text-muted">البيانات محفوظة في هذا الجهاز فقط. احفظ نسخة احتياطية بين فترة وفترة.</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={exportJSON} className="rounded-2xl border border-line bg-white py-3 text-[15px] font-medium">حفظ نسخة</button>
            <label className="cursor-pointer rounded-2xl border border-line bg-white py-3 text-center text-[15px] font-medium">
              استرجاع نسخة
              <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])} />
            </label>
            <button onClick={() => confirmAction('تحميل بيانات تجريبية؟ ستستبدل بياناتك الحالية') && replaceData(createDemo(todayISO()))} className="rounded-2xl border border-line bg-white py-3 text-[15px] font-medium">
              بيانات تجريبية
            </button>
            <button onClick={() => confirmAction('مسح كل العمليات والرجوع للبيانات الأولية؟') && reset()} className="rounded-2xl bg-rose-soft py-3 text-[15px] font-medium text-rose">
              مسح البيانات
            </button>
          </div>
        </section>
      </div>
    </Sheet>
  );
}
