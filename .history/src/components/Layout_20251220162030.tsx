import { ReactNode, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Smartphone,
  PanelLeftClose,
  PanelLeft,
  User,
  Bell,
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Layout = ({ children, currentPage, onPageChange }: LayoutProps) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const getMenuItems = () => {
    const allItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'cashier', 'warehouse', 'owner'] },
      { id: 'products', label: 'Produk', icon: Package, roles: ['admin', 'warehouse'] },
      { id: 'transactions', label: 'Transaksi', icon: ShoppingCart, roles: ['admin', 'cashier'] },
      { id: 'reports', label: 'Laporan', icon: BarChart3, roles: ['admin', 'owner'] },
      { id: 'settings', label: 'Pengaturan', icon: Settings, roles: ['admin'] },
    ];

    return allItems.filter(item => item.roles.includes(user?.role || ''));
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'cashier': return 'Kasir';
      case 'warehouse': return 'Gudang';
      case 'owner': return 'Pemilik';
      default: return '';
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'cashier': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'warehouse': return 'bg-green-100 text-green-700 border-green-200';
      case 'owner': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimalist Top Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 fixed w-full z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9 hover:bg-gray-100 rounded-lg"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>

              {/* Logo & Brand - Minimalist */}
              <div className="flex items-center gap-2.5">
                <div className="bg-primary p-2 rounded-lg">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-sm font-semibold text-gray-900 tracking-tight">Gadget Prima POS</h1>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex h-9 w-9 hover:bg-gray-100 rounded-lg relative"
              >
                <Bell className="w-4 h-4 text-gray-600" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              </Button>

              {/* User Info - Minimalist */}
              <div className="flex items-center gap-2.5 pl-2.5 border-l border-gray-200/70">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-medium text-gray-900">{user?.name}</p>
                  <p className="text-[10px] text-gray-500 -mt-0.5">{getRoleLabel(user?.role)}</p>
                </div>
                <Avatar className="h-8 w-8 border border-gray-200">
                  <AvatarFallback className="bg-primary text-white text-xs font-medium">
                    {user?.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Minimalist Sidebar */}
      <aside
        className={`fixed top-14 left-0 z-20 h-[calc(100vh-3.5rem)] bg-white/95 backdrop-blur-sm border-r border-gray-200/50 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-60'
        } ${sidebarOpen ? 'translate-x-0 w-60' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Toggle - Minimalist */}
          <div className={`hidden lg:flex items-center border-b border-gray-200/50 transition-all ${
            sidebarCollapsed ? 'justify-center h-12' : 'justify-between px-4 h-12'
          }`}>
            {!sidebarCollapsed && (
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Navigation</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-7 w-7 rounded-md hover:bg-gray-100 group"
              title={sidebarCollapsed ? 'Expand' : 'Collapse'}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="w-3.5 h-3.5 text-gray-500 group-hover:text-primary transition-colors" />
              ) : (
                <PanelLeftClose className="w-3.5 h-3.5 text-gray-500 group-hover:text-primary transition-colors" />
              )}
            </Button>
          </div>

          {/* Navigation Menu - Minimalist */}
          <nav className={`flex-1 overflow-y-auto transition-all ${sidebarCollapsed ? 'p-2' : 'px-3 py-4'}`}>
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onPageChange(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center rounded-lg transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    } ${
                      sidebarCollapsed 
                        ? 'lg:justify-center lg:p-2.5' 
                        : 'gap-3 px-3 py-2.5'
                    }`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className={`flex-shrink-0 ${
                      sidebarCollapsed ? 'w-4 h-4' : 'w-4 h-4'
                    } ${isActive ? '' : 'group-hover:scale-105 transition-transform'}`} />
                    {!sidebarCollapsed && (
                      <span className="text-sm font-medium truncate">
                        {item.label}
                      </span>
                    )}
                    {isActive && (
                      <div className={`absolute ${
                        sidebarCollapsed 
                          ? 'lg:left-0 lg:top-1/2 lg:-translate-y-1/2 lg:w-0.5 lg:h-6 left-auto right-2 top-2 w-1 h-1 rounded-full' 
                          : 'right-3 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full'
                      } bg-white`}></div>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Bottom Section - Only show when expanded */}
          {!sidebarCollapsed && (
            <div className="border-t border-gray-200/50 p-3">
              {/* Logout Button - Minimalist */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 group"
              >
                <LogOut className="flex-shrink-0 w-4 h-4 group-hover:scale-105 transition-transform" />
                <span className="text-sm font-medium">Keluar</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-10 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        className={`pt-14 min-h-screen transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-60'
        }`}
      >
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};
