export interface Transaction {
  id?: number;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  transactionTime?: string;
  tags?: string;
  remark?: string;
  account?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface Statistics {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryStatistics: CategoryStatistics[];
  dailyStatistics: DailyStatistics[];
}

export interface CategoryStatistics {
  category: string;
  type: string;
  amount: number;
  percentage: number;
}

export interface DailyStatistics {
  date: string;
  income: number;
  expense: number;
}
