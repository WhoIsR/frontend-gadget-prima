import { createContext, useContext, useState, ReactNode, useEffect } from "react";

// Tipe data User (Sesuaikan kalo ada yang beda)
interface User {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'gudang' | 'kasir';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean; // Tambahan penting!
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 1. CARA BENAR: Baca localStorage LANGSUNG saat inisialisasi state
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      return null;
    }
  });

  // Loading kita set false karena kita udah baca data di atas ^
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi Login (Dipanggil dari Login.tsx)
  const login = (userData: User, token: string) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    setUser(userData);
  };

  // Fungsi Logout
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        isAuthenticated: !!user,
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};