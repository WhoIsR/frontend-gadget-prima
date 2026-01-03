import { useState, useEffect } from 'react';
import axios from 'axios'; // Pake Axios
// import { useLocalStorage } from '../hooks/useLocalStorage'; // <-- HAPUS
import { User, Expense } from '../types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { formatRupiah } from '../utils/currency';

export const Settings = () => {
  // const { getItem, setItem } = useLocalStorage(); // <-- HAPUS
  const [users, setUsers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [userFormData, setUserFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'cashier' as 'admin' | 'cashier' | 'warehouse' | 'owner',
  });

  const [expenseFormData, setExpenseFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    category: '',
  });

  // --- 1. FETCH DATA DARI LARAVEL ---
  const fetchData = async () => {
    try {
      const [userRes, expRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/users'),
        axios.get('http://127.0.0.1:8000/api/expenses')
      ]);
      setUsers(userRes.data.data);
      setExpenses(expRes.data.data);
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengambil data pengaturan');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 2. LOGIC USER (CRUD KE API) ---
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update User
        await axios.put(`http://127.0.0.1:8000/api/users/${editingUser.id}`, userFormData);
        toast.success('Pengguna berhasil diperbarui');
      } else {
        // Create User
        await axios.post('http://127.0.0.1:8000/api/users', userFormData);
        toast.success('Pengguna berhasil ditambahkan');
      }
      fetchData(); // Refresh tabel
      setUserDialogOpen(false);
      resetUserForm();
    } catch (error) {
      toast.error('Gagal menyimpan pengguna');
    }
  };

  const handleUserDelete = async (id: string | number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/users/${id}`);
        toast.success('Pengguna berhasil dihapus');
        fetchData();
      } catch (error) {
        toast.error('Gagal menghapus pengguna');
      }
    }
  };

  // --- 3. LOGIC EXPENSE (CRUD KE API) ---
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await axios.put(`http://127.0.0.1:8000/api/expenses/${editingExpense.id}`, expenseFormData);
        toast.success('Pengeluaran berhasil diperbarui');
      } else {
        await axios.post('http://127.0.0.1:8000/api/expenses', expenseFormData);
        toast.success('Pengeluaran berhasil ditambahkan');
      }
      fetchData();
      setExpenseDialogOpen(false);
      resetExpenseForm();
    } catch (error) {
      toast.error('Gagal menyimpan pengeluaran');
    }
  };

  const handleExpenseDelete = async (id: string | number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/expenses/${id}`);
        toast.success('Pengeluaran berhasil dihapus');
        fetchData();
      } catch (error) {
        toast.error('Gagal menghapus pengeluaran');
      }
    }
  };

  // --- HELPER FUNCTIONS ---
  const handleUserEdit = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      email: user.email,
      password: '', // Password dikosongkan pas edit biar aman
      name: user.name,
      role: user.role,
    });
    setUserDialogOpen(true);
  };

  const resetUserForm = () => {
    setEditingUser(null);
    setUserFormData({
      email: '',
      password: '',
      name: '',
      role: 'cashier',
    });
  };

  const handleExpenseEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseFormData({
      date: expense.date,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
    });
    setExpenseDialogOpen(true);
  };

  const resetExpenseForm = () => {
    setEditingExpense(null);
    setExpenseFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      category: '',
    });
  };

  const getRoleLabel = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'Administrator';
      case 'cashier': return 'Kasir';
      case 'kasir': return 'Kasir';
      case 'warehouse': return 'Gudang';
      case 'gudang': return 'Gudang';
      case 'owner': return 'Pemilik';
      case 'pemilik': return 'Pemilik';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pengaturan Sistem</h2>
        <p className="text-gray-600">Kelola pengguna, pengeluaran, dan konfigurasi sistem</p>
      </div>

      <Tabs defaultValue="users" className="space-y-8">
        <TabsList className="border-2 w-full justify-start">
          <TabsTrigger value="users">Manajemen Pengguna</TabsTrigger>
          <TabsTrigger value="expenses">Manajemen Pengeluaran</TabsTrigger>
        </TabsList>

        {/* TAB USERS */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Akun Pengguna</h3>
              <p className="text-sm text-gray-600">Kelola akun pengguna sistem dan izin akses</p>
            </div>

            <Dialog open={userDialogOpen} onOpenChange={(open) => {
              setUserDialogOpen(open);
              if (!open) resetUserForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Pengguna
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingUser
                      ? 'Kosongkan password jika tidak ingin mengubahnya.'
                      : 'Buat akun pengguna baru'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUserSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap *</Label>
                    <Input
                      id="name"
                      required
                      value={userFormData.name}
                      onChange={(e) =>
                        setUserFormData({ ...userFormData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={userFormData.email}
                      onChange={(e) =>
                        setUserFormData({ ...userFormData, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password {editingUser ? '(Opsional)' : '*'}</Label>
                    <Input
                      id="password"
                      type="password"
                      required={!editingUser} // Wajib cuma pas bikin baru
                      value={userFormData.password}
                      onChange={(e) =>
                        setUserFormData({ ...userFormData, password: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Peran *</Label>
                    <Select
                      value={userFormData.role}
                      onValueChange={(value: any) =>
                        setUserFormData({ ...userFormData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="cashier">Kasir</SelectItem>
                        <SelectItem value="warehouse">Gudang</SelectItem>
                        <SelectItem value="owner">Pemilik</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setUserDialogOpen(false)}
                    >
                      Batal
                    </Button>
                    <Button type="submit" className="bg-primary text-white">
                      {editingUser ? 'Perbarui Pengguna' : 'Tambah Pengguna'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Peran</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500">
                          Tidak ada pengguna ditemukan
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-gray-400 capitalize">
                              {getRoleLabel(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUserEdit(user)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUserDelete(user.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB EXPENSES */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pengeluaran Bisnis</h3>
              <p className="text-sm text-gray-600">Lacak dan kelola pengeluaran operasional toko</p>
            </div>

            <Dialog open={expenseDialogOpen} onOpenChange={(open) => {
              setExpenseDialogOpen(open);
              if (!open) resetExpenseForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Pengeluaran
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingExpense
                      ? 'Perbarui informasi pengeluaran'
                      : 'Catat pengeluaran bisnis baru (Listrik, Gaji, dll)'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="expenseDate">Tanggal *</Label>
                    <Input
                      id="expenseDate"
                      type="date"
                      required
                      value={expenseFormData.date}
                      onChange={(e) =>
                        setExpenseFormData({ ...expenseFormData, date: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi *</Label>
                    <Input
                      id="description"
                      required
                      placeholder="Contoh: Token Listrik, Gaji Budi"
                      value={expenseFormData.description}
                      onChange={(e) =>
                        setExpenseFormData({
                          ...expenseFormData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori *</Label>
                    <Input
                      id="category"
                      required
                      placeholder="mis. Operasional, Gaji, Sewa"
                      value={expenseFormData.category}
                      onChange={(e) =>
                        setExpenseFormData({
                          ...expenseFormData,
                          category: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Jumlah (Rp) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="1000"
                      required
                      value={expenseFormData.amount}
                      onChange={(e) =>
                        setExpenseFormData({
                          ...expenseFormData,
                          amount: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setExpenseDialogOpen(false)}
                    >
                      Batal
                    </Button>
                    <Button type="submit" className="bg-primary text-white">
                      {editingExpense ? 'Perbarui Pengeluaran' : 'Tambah Pengeluaran'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500">
                          Tidak ada pengeluaran tercatat
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{new Date(expense.date).toLocaleDateString('id-ID')}</TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-gray-400">{expense.category}</Badge>
                          </TableCell>
                          <TableCell className="text-red-600 font-medium">
                            {formatRupiah(expense.amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExpenseEdit(expense)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExpenseDelete(expense.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};