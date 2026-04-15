export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id?: string;
  amount: number;
  type: TransactionType;
  category: string;
  note?: string;
  date: string; // ISO string
  uid: string;
}

export interface Category {
  id?: string;
  name: string;
  type: TransactionType;
  uid: string;
}

export interface ParsedTransaction {
  amount: number;
  type: TransactionType;
  category: string;
  note: string;
}
