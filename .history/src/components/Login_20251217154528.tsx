import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Smartphone, RefreshCw, LogIn } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);
  const { login } = useAuth();
  const { getItem } = useLocalStorage();

  useEffect(() => {
    // Load demo accounts from localStorage
    const users = getItem('users') || [];
    const accounts = users.map((user: any) => {
      let roleLabel = user.role;
      switch (user.role) {
        case 'admin': roleLabel = 'Administrator'; break;
        case 'cashier': roleLabel = 'Kasir'; break;
        case 'warehouse': roleLabel = 'Gudang'; break;
        case 'owner': roleLabel = 'Pemilik'; break;
      }
      return {
        role: roleLabel,
        email: user.email,
        password: user.password,
      };
    });
    setDemoAccounts(accounts);
  }, [getItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Silakan masukkan email dan password');
      return;
    }

    const success = login(email, password);
    if (!success) {
      setError('Email atau password salah');
    }
  };

  const handleResetData = () => {
    if (window.confirm('Ini akan menghapus semua data dan me-reset ke data awal. Lanjutkan?')) {
      localStorage.clear();
      window.location.reload();
      toast.success('Data berhasil di-reset');
    }
  };

  const quickLogin = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
    const success = login(email, password);
    if (!success) {
      setError('Login gagal');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-purple-50 to-pink-50 p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-primary p-4 rounded-2xl shadow-lg shadow-primary/30">
              <Smartphone className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-primary text-3xl">Sistem POS Gadget Prima</h1>
          </div>
          <p className="text-muted-foreground text-lg">Manajemen Point of Sale untuk Produk Elektronik</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Masuk</CardTitle>
                  <CardDescription className="text-base">Masukkan kredensial Anda untuk mengakses sistem</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetData}
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                  title="Reset ke data awal"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@anda.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 border-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Masukkan password Anda"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 border-2"
                  />
                </div>

                <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 shadow-lg text-base">
                  <LogIn className="w-5 h-5 mr-2" />
                  Masuk
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Akun Demo</CardTitle>
              <CardDescription className="text-base">Login cepat dengan akun uji coba</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {demoAccounts.map((account: any) => (
                  <div
                    key={account.role}
                    className="p-4 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-primary">{account.role}</p>
                        <p className="text-sm text-muted-foreground">{account.email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary hover:text-white"
                        onClick={() => quickLogin(account.email, account.password)}
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Login
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Password: {account.password}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
