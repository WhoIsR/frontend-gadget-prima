import { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { User, Expense } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
import { Plus, Edit, Trash2, Users, DollarSign } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { formatRupiah } from '../utils/currency';

export const Settings = () => {
  const { getItem, setItem } = useLocalStorage();
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

  useEffect(() => {
    const storedUsers = getItem('users') || [];
    const storedExpenses = getItem('expenses') || [];
    setUsers(storedUsers);
    setExpenses(storedExpenses);
  }, []);

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUser) {
      const updatedUsers = users.map((u) =>
        u.id === editingUser.id ? { ...editingUser, ...userFormData } : u
      );
      setUsers(updatedUsers);
      setItem('users', updatedUsers);
      toast.success('Pengguna berhasil diperbarui');
    } else {
      const newUser: User = {
        id: String(users.length + 1),
        ...userFormData,
      };
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      setItem('users', updatedUsers);
      toast.success('Pengguna berhasil ditambahkan');
    }

    setUserDialogOpen(false);
    resetUserForm();
  };

  const handleUserEdit = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      email: user.email,
      password: user.password,
      name: user.name,
      role: user.role,
    });
    setUserDialogOpen(true);
  };

  const handleUserDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      const updatedUsers = users.filter((u) => u.id !== id);
      setUsers(updatedUsers);
      setItem('users', updatedUsers);
      toast.success('Pengguna berhasil dihapus');
    }
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

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingExpense) {
      const updatedExpenses = expenses.map((exp) =>
        exp.id === editingExpense.id ? { ...editingExpense, ...expenseFormData } : exp
      );
      setExpenses(updatedExpenses);
      setItem('expenses', updatedExpenses);
      toast.success('Pengeluaran berhasil diperbarui');
    } else {
      const newExpense: Expense = {
        id: `E${String(expenses.length + 1).padStart(3, '0')}`,
        ...expenseFormData,
      };
      const updatedExpenses = [...expenses, newExpense];
      setExpenses(updatedExpenses);
      setItem('expenses', updatedExpenses);
      toast.success('Pengeluaran berhasil ditambahkan');
    }

    setExpenseDialogOpen(false);
    resetExpenseForm();
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

  const handleExpenseDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) {
      const updatedExpenses = expenses.filter((e) => e.id !== id);
      setExpenses(updatedExpenses);
      setItem('expenses', updatedExpenses);
      toast.success('Pengeluaran berhasil dihapus');
    }
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
    switch (role) {
      case 'admin': return 'Administrator';
      case 'cashier': return 'Kasir';
      case 'warehouse': return 'Gudang';
      case 'owner': return 'Pemilik';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Pengaturan Sistem</h2>
        <p className="text-gray-600">Kelola pengguna, pengeluaran, dan konfigurasi sistem</p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="border-2">
          <TabsTrigger value="users">Manajemen Pengguna</TabsTrigger>
          <TabsTrigger value="expenses">Manajemen Pengeluaran</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-900">Akun Pengguna</h3>
              <p className="text-sm text-gray-600">Kelola akun pengguna sistem dan izin akses</p>
            </div>

            <Dialog open={userDialogOpen} onOpenChange={(open) => {
              setUserDialogOpen(open);
              if (!open) resetUserForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-black text-white hover:bg-gray-800">
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
                      ? 'Perbarui informasi pengguna'
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
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      required
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
                    <Button type="submit" className="bg-black text-white hover:bg-gray-800">
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
                            <Badge variant="outline" className="border-black">
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

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-900">Pengeluaran Bisnis</h3>
              <p className="text-sm text-gray-600">Lacak dan kelola pengeluaran bisnis</p>
            </div>

            <Dialog open={expenseDialogOpen} onOpenChange={(open) => {
              setExpenseDialogOpen(open);
              if (!open) resetExpenseForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-black text-white hover:bg-gray-800">
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
                      : 'Catat pengeluaran bisnis baru'}
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
                      placeholder="mis. Sewa, Utilitas, Gaji"
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
                    <Button type="submit" className="bg-black text-white hover:bg-gray-800">
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
                            <Badge variant="outline" className="border-black">{expense.category}</Badge>
                          </TableCell>
                          <TableCell className="text-red-600">
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
