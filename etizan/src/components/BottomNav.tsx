'use client';
import { AppLink as Link } from '@/lib/nav';
import { useAppPath } from '@/lib/nav';
import { motion } from 'motion/react';
import { BarChart3, CarFront, House, Wallet } from 'lucide-react';
import { useUI } from './ui-store';
import { MicOrb } from './Assistant';

const ITEMS = [
  { href: '/', label: 'الرئيسية', Icon: House },
  { href: '/uber/', label: 'أوبر', Icon: CarFront },
  null,
  { href: '/expenses/', label: 'المصاريف', Icon: Wallet },
  { href: '/analysis/', label: 'التحليل', Icon: BarChart3 },
] as const;

export default function BottomNav() {
  const path = useAppPath();
  const openAssistant = useUI((s) => s.openAssistant);
  const norm = (p: string) => p;
  return (
    <nav aria-label="التنقل" className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[560px] px-3 pb-[calc(10px+var(--safe-bottom))]">
      <div className="relative flex items-end justify-between rounded-[28px] border border-white/80 bg-white/85 px-2 pb-2 pt-2 shadow-[0_10px_40px_-12px_rgba(20,50,40,.28)] backdrop-blur-xl">
        {ITEMS.map((it, i) =>
          it === null ? (
            <div key="mic" className="relative -mt-9 flex w-[76px] flex-col items-center">
              <MicOrb listening={false} onClick={() => openAssistant(true)} size={70} />
              <span className="mt-1 text-[12px] font-medium text-ink-2">تكلم</span>
            </div>
          ) : (
            <Link key={it.href} href={it.href} className="relative flex flex-1 flex-col items-center gap-0.5 py-1.5" aria-current={norm(path) === it.href ? 'page' : undefined}>
              {norm(path) === it.href && <motion.span layoutId="nav-dot" className="absolute inset-x-2 inset-y-0 rounded-[20px] bg-orange-soft" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
              <it.Icon size={24} className={`relative ${norm(path) === it.href ? 'text-orange-deep' : 'text-ink-2'}`} strokeWidth={2.1} />
              <span className={`relative text-[12.5px] font-medium ${norm(path) === it.href ? 'text-orange-deep' : 'text-muted'}`}>{it.label}</span>
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}
