import type { ExpenseCategory, ObligationKind } from './types';

export const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  fuel: 'بنزين',
  groceries: 'مقاضي',
  electricity: 'كهرباء',
  maintenance: 'صيانة',
  home: 'منزل',
  other: 'أخرى',
};

export const CATEGORY_ORDER: ExpenseCategory[] = ['fuel', 'groceries', 'electricity', 'maintenance', 'home', 'other'];

/** الفئات التي تُحسب كفواتير محجوزة ضمن العجز الشهري وليست من المتاح للصرف */
export const BILL_CATEGORIES: ExpenseCategory[] = ['electricity'];

export const CATEGORY_TONE: Record<ExpenseCategory, string> = {
  fuel: '#f0a85a',
  groceries: '#3fbf9a',
  electricity: '#e8c547',
  maintenance: '#7c8ea6',
  home: '#5aa9e6',
  other: '#a59cc9',
};

export const KIND_LABEL: Record<ObligationKind, string> = {
  mortgage: 'قرض عقاري',
  rent: 'إيجار',
  loan: 'قرض شخصي',
  service: 'خدمة شهرية',
  temporary: 'مؤقت',
};
