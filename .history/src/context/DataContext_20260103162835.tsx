import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { Product, Transaction, Expense, User } from '../types';
import { toast } from 'sonner';

interface DataContextType {
  products: Product[];
  transactions: Transaction[];
  expenses: Expense[];
  users: User[];
  categories: any[];
  brands: any[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    // Jangan set isLoading(true) di sini jika ingin background refresh (opsional)
    // Tapi user minta "load dalam satu waktu", jadi initial load penting.
    // Kita bisa set loading state terpisah atau biarkan UI yang handle.
    // Untuk UX yang lebih baik saat refresh manual, kita bisa skip full loading screen.
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Gunakan Promise.allSettled agar jika satu gagal (misal users forbidden), yang lain tetap jalan
      const results = await Promise.allSettled([
        axios.get(`${import.meta.env.VITE_API_URL}/products`),
        axios.get(`${import.meta.env.VITE_API_URL}/transactions`),
        axios.get(`${import.meta.env.VITE_API_URL}/expenses`),
        axios.get(`${import.meta.env.VITE_API_URL}/users`),
        axios.get(`${import.meta.env.VITE_API_URL}/categories`),
        axios.get(`${import.meta.env.VITE_API_URL}/brands`),
      ]);

      // Helper untuk ambil data dari result
      const getData = (result: PromiseSettledResult<any>) => {
        if (result.status === 'fulfilled') {
          return result.value.data.data || [];
        }
        // Log error jika perlu, tapi jangan crash
        if (result.status === 'rejected') {
           console.warn("Gagal fetch data:", result.reason);
        }
        return [];
      };

      // Mapping Products (karena ada field purchasePrice vs buy_price)
      const rawProducts = getData(results[0]);
      const mappedProducts = rawProducts.map((p: any) => ({
        ...p,
        purchasePrice: p.buy_price || p.purchasePrice || 0,
        minStock: p.min_stock || p.minStock || 0
      }));

      setProducts(mappedProducts);
      setTransactions(getData(results[1]));
      setExpenses(getData(results[2]));
      setUsers(getData(results[3]));
      setCategories(getData(results[4]));
      setBrands(getData(results[5]));

    } catch (error) {
      console.error("Gagal memuat data global:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DataContext.Provider value={{
      products,
      transactions,
      expenses,
      users,
      categories,
      brands,
      isLoading,
      refreshData: fetchData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
