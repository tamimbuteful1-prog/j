import { Car, Fuel, Home, MoreHorizontal, ShoppingBasket, Zap, CarFront } from 'lucide-react';
import type { ExpenseCategory } from '@/lib/types';
import { CATEGORY_TONE } from '@/lib/categories';

const MAP: Record<ExpenseCategory, typeof Fuel> = {
  fuel: Fuel,
  groceries: ShoppingBasket,
  electricity: Zap,
  maintenance: Car,
  home: Home,
  other: MoreHorizontal,
};

export function CategoryIcon({ c, size = 20 }: { c: ExpenseCategory | 'uber'; size?: number }) {
  const Icon = c === 'uber' ? CarFront : MAP[c];
  const color = c === 'uber' ? '#11916f' : CATEGORY_TONE[c];
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: color + '22', color }}>
      <Icon size={size} strokeWidth={2.2} />
    </span>
  );
}
