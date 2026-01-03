import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom'; // <--- 1. IMPORT INI WAJIB
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Products } from './components/Products';
import { Transactions } from './components/Transactions';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { Toaster } from './components/ui/sonner';
import { Loader2 } from 'lucide-react';

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <Products />;
      case 'transactions':
        return <Transactions />; // Pastikan komponen ini ada atau ganti null dulu
      case 'reports':
        return <Reports />;     // Pastikan komponen ini ada atau ganti null dulu
      case 'settings':
        return <Settings />;    // Pastikan komponen ini ada atau ganti null dulu
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

const App = () => {
  return (
    // 2. BUNGKUS SEMUANYA DENGAN BROWSERROUTER
    <BrowserRouter> 
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;