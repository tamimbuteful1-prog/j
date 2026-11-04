'use client';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Sheet({
  open,
  onClose,
  title,
  children,
  tall,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  tall?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className={`absolute inset-x-0 bottom-0 mx-auto flex max-w-[560px] flex-col rounded-t-[30px] bg-cream shadow-[0_-20px_60px_-20px_rgba(0,0,0,.3)] ${tall ? 'h-[88dvh]' : 'max-h-[88dvh]'}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => (i.offset.y > 120 || i.velocity.y > 600) && onClose()}
          >
            <div className="flex items-center justify-between px-5 pb-2 pt-3">
              <div className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-line" />
              <h2 className="mt-3 text-[19px] font-semibold">{title}</h2>
              <button onClick={onClose} aria-label="إغلاق" className="mt-3 grid h-11 w-11 place-items-center rounded-full bg-white text-ink-2 shadow-soft">
                <X size={22} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(20px+var(--safe-bottom))]" onPointerDownCapture={(e) => e.stopPropagation()}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
