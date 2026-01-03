import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Smartphone, LogIn, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Silakan masukkan email dan password');
      setIsLoading(false);
      return;
    }

    try {
      // Tembak API Laravel
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/login`, {
        email: email,
        password: password
      });

      const { token, user } = response.data;

      // Simpan Token & User
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      toast.success('Login Berhasil!');

      // Redirect ke dashboard (reload biar state bersih)
      window.location.href = '/'; 

    } catch (err: any) {
      console.error("Login Error:", err);
      // Ambil pesan error dari Laravel jika ada
      const errorMsg = err.response?.data?.message || 'Login gagal, cek email atau password.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-purple-50 to-pink-50 p-4">
      <div className="w-full max-w-md"> {/* Layout jadi max-w-md biar fokus di tengah */}
        
        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-primary p-4 rounded-2xl shadow-lg shadow-primary/30">
              <Smartphone className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-primary text-3xl font-bold">Gadget Prima</h1>
          </div>
          <p className="text-muted-foreground text-lg">Sistem Point of Sale</p>
        </div>

        {/* Card Login */}
        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Masuk</CardTitle>
            <CardDescription className="text-base text-center">
              Masukkan akun staf atau owner untuk akses
            </CardDescription>
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
                  placeholder="nama@gadgetprima.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-2"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-2"
                  disabled={isLoading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-primary hover:bg-primary/90 shadow-lg text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Masuk
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};