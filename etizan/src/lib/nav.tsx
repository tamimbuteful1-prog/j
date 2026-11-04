'use client';
/**
 * تنقّل موحّد: روابط Next العادية، أو وضع «صفحة واحدة» (NEXT_PUBLIC_SPA=1)
 * يعتمد على #uber و#expenses... — يُستخدم لنسخة المعاينة المنشورة كصفحة واحدة.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export const SPA = process.env.NEXT_PUBLIC_SPA === '1';

const toHash = (href: string) => {
  const name = href.replace(/^\/|\/$/g, '');
  return name ? `#${name}` : '#home';
};

export function AppLink({ href, ...rest }: React.ComponentProps<'a'> & { href: string }) {
  if (SPA) return <a href={toHash(href)} {...rest} />;
  return <Link href={href} {...rest} />;
}

function readHash() {
  const h = typeof window === 'undefined' ? '' : window.location.hash.slice(1);
  return !h || h === 'home' ? '/' : `/${h}/`;
}

/** المسار الحالي بصيغة '/' أو '/uber/' */
export function useAppPath(): string {
  const next = usePathname();
  const [hash, setHash] = useState('/');
  useEffect(() => {
    if (!SPA) return;
    const on = () => {
      setHash(readHash());
      window.scrollTo(0, 0);
    };
    on();
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  if (SPA) return hash;
  return next.endsWith('/') ? next : next + '/';
}

/** confirm() لا يعمل داخل صفحة المعاينة، فنقبل مباشرة هناك */
export function confirmAction(msg: string): boolean {
  if (SPA) return true;
  return window.confirm(msg);
}
