import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Products } from './components/Products';
import { Transactions } from './components/Transactions';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { initialData } from './data/initialData';
import { Toaster } from './components/ui/sonner';

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <Products />;
      case 'transactions':
        return <Transactions />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

const App = () => {
  const { setItem, getItem } = useLocalStorage();

  useEffect(() => {
    // Initialize localStorage with sample data if not already present
    if (!getItem('users')) {
      setItem('users', initialData.users);
    }
    if (!getItem('products')) {
      setItem('products', initialData.products);
    }
    if (!getItem('transactions')) {
      setItem('transactions', initialData.transactions);
    }
    if (!getItem('expenses')) {
      setItem('expenses', initialData.expenses);
    }
  }, []);

  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" />
    </AuthProvider>
  );
};

export default App;
