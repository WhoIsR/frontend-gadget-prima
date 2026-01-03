export type UserRole = 'admin' | 'cashier' | 'warehouse' | 'owner';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  purchasePrice?: number; // Harga beli/modal
  stock: number;
  sku: string;
  description: string;
  minStock: number;
  image?: string;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  date: string;
  items: TransactionItem[];
  total: number;
  cashierId: string;
  cashierName: string;
  paymentMethod: 'cash' | 'card' | 'e-wallet';
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

export interface DatabaseState {
  users: User[];
  products: Product[];
  transactions: Transaction[];
  expenses: Expense[];
}
