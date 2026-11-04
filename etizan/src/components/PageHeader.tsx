'use client';
import { AppLink as Link } from '@/lib/nav';
import { ChevronRight } from 'lucide-react';

export default function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <header className="flex items-center gap-3 pb-4 pt-[calc(14px+env(safe-area-inset-top))]">
      <Link href="/" aria-label="الرئيسية" className="grid h-12 w-12 place-items-center rounded-full bg-white shadow-soft">
        <ChevronRight size={24} />
      </Link>
      <div className="flex-1">
        <h1 className="text-[24px] font-bold leading-tight">{title}</h1>
        {subtitle && <p className="text-[14px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
