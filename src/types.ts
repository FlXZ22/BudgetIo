export type IncomeCategory = 'Salary' | 'Freelance' | 'Gift' | 'Investment' | 'Other Income';
export type ExpenseCategory = 'Food' | 'Transport' | 'Subscriptions' | 'Shopping' | 'Entertainment' | 'School' | 'Health' | 'Rent/Bills' | 'Other';

export type Category = IncomeCategory | ExpenseCategory;

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: Category;
  date: string;
  type: 'income' | 'expense';
}

export interface UserSettings {
  name: string;
  status: string;
  avatar: string;
  currency: string;
  theme: 'light' | 'dark' | 'phoenix' | 'tropical' | 'flow';
  backgroundImage?: string;
  backgroundOpacity?: number;
  backgroundBlur?: number;
  containerOpacity?: number;
}

export interface BudgetData {
  transactions: Transaction[];
  monthlyLimit: number;
  settings: UserSettings;
}
