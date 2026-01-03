import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  LogOut, 
  UserCircle 
} from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Layout = ({ children, currentPage, onPageChange }: LayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Berhasil keluar');
    navigate('/login');
  };

  // --- LOGIC SATPAM MENU ---
  // Kita definisikan menu apa aja dan siapa yang boleh liat
  const allMenuItems = [
    { 
      name: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/',
      // Semua role boleh liat dashboard
      roles: ['admin', 'owner', 'kasir', 'gudang'] 
    },
    { 
      name: 'products', 
      label: 'Produk', 
      icon: Package, 
      path: '/products',
      // Cuma Admin dan Gudang yang urus stok
      roles: ['admin', 'gudang'] 
    },
    { 
      name: 'transactions', 
      label: 'Transaksi', 
      icon: ShoppingCart, 
      path: '/transactions',
      // Cuma Admin dan Kasir yang boleh jualan
      roles: ['admin', 'kasir'] 
    },
    { 
      name: 'reports', 
      label: 'Laporan', 
      icon: BarChart3, 
      path: '/reports',
      // Owner pantau duit disini, Admin juga
      roles: ['admin', 'owner'] 
    },
    { 
      name: 'settings', 
      label: 'Pengaturan', 
      icon: Settings, 
      path: '/settings',
      // Cuma Admin yang boleh utak-atik sistem
      roles: ['admin'] 
    },
  ];

  // Filter menu berdasarkan role user yang sedang login
  // user?.role?.toLowerCase() jaga-jaga kalo di DB tulisannya 'Admin' (huruf gede)
  const allowedMenuItems = allMenuItems.filter(item => 
    user && item.roles.includes(user.role.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-10 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <span className="text-primary text-xl font-bold">GP</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-lg leading-none">Gadget Prima</h1>
              <p className="text-xs text-muted-foreground mt-1">POS System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Navigation
          </p>
          
          {allowedMenuItems.map((item) => {
            const Icon = item.icon;
            // Cek aktif berdasarkan URL path atau prop currentPage
            const isActive = location.pathname === item.path || currentPage === item.name;
            
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => onPageChange(item.name)}
              >
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start mb-1 ${
                    isActive 
                      ? 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20' 
                      : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user?.name?.charAt(0) || <UserCircle className="w-6 h-6" />}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role || 'Role'}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Keluar
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 transition-all duration-300">
        {/* Header Mobile bisa ditaruh sini kalo nanti butuh */}
        <div className="p-8 fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};