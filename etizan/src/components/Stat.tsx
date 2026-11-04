'use client';
import { motion } from 'motion/react';
import { AppLink as Link } from '@/lib/nav';
import { num } from '@/lib/format';

export function Stat({
  label,
  value,
  hint,
  tone = 'mint',
  icon,
  href,
  progress,
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: 'mint' | 'sky' | 'amber' | 'ink';
  icon?: React.ReactNode;
  href?: string;
  progress?: number;
}) {
  const tones = {
    mint: 'bg-mint-soft text-mint-deep',
    sky: 'bg-sky-soft text-sky-deep',
    amber: 'bg-amber-soft text-amber',
    ink: 'bg-cream-2 text-ink-2',
  } as const;
  const bar = { mint: '#1aa985', sky: '#2f86cf', amber: '#e08a2a', ink: '#3a4641' }[tone];
  const body = (
    <motion.div whileTap={{ scale: 0.97 }} className="card flex h-full flex-col gap-2 p-4">
      <div className="flex items-center gap-2">
        {icon && <span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span>}
        <span className="text-[14px] font-medium leading-tight text-ink-2">{label}</span>
      </div>
      <div className="mt-auto">
        <div className="tnum text-[30px] font-bold leading-none">
          {typeof value === 'number' ? num(value) : value}
          {typeof value === 'number' && <span className="ms-1 text-[14px] font-medium text-muted">ريال</span>}
        </div>
        {hint && <div className="mt-1.5 text-[13px] text-muted">{hint}</div>}
        {progress !== undefined && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-2">
            <motion.div className="h-full rounded-full" style={{ background: bar }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} transition={{ duration: 0.8 }} />
          </div>
        )}
      </div>
    </motion.div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}
