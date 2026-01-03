import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Plus, Edit, Trash2, Search, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '../utils/currency';

// Tipe data disesuaikan dengan kebutuhan UI asli
interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  buy_price: number; // Harga Beli
  price: number;     // Harga Jual
  stock: number;
  image: string;
  status: 'active' | 'inactive';
}

export const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form Data Lengkap
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    buy_price: 0,
    price: 0,
    stock: 0,
    image: '',
    status: 'active' as const
  });

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/products');
      setProducts(response.data.data);
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengambil data produk');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['price', 'buy_price', 'stock'].includes(name) ? Number(value) : value
    }));
  };

  const handleOpenDialog = () => {
    setCurrentProduct(null);
    setFormData({
      name: '',
      sku: '',
      category: '',
      buy_price: 0,
      price: 0,
      stock: 0,
      image: '',
      status: 'active'
    });
    setDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      buy_price: product.buy_price || 0,
      price: product.price,
      stock: product.stock,
      image: product.image || '',
      status: product.status
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.sku) {
      toast.error('Mohon lengkapi data produk');
      return;
    }

    try {
      if (currentProduct) {
        await axios.put(`http://127.0.0.1:8000/api/products/${currentProduct.id}`, formData);
        toast.success('Produk berhasil diperbarui');
      } else {
        await axios.post('http://127.0.0.1:8000/api/products', formData);
        toast.success('Produk berhasil ditambahkan');
      }
      fetchProducts();
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan produk');
    }
  };

  const handleDeleteConfirm = async () => {
    if (productToDelete) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/products/${productToDelete.id}`);
        toast.success('Produk berhasil dihapus');
        fetchProducts();
      } catch (error) {
        toast.error('Gagal menghapus produk');
      }
      setDeleteDialogOpen(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in p-2">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Produk</h1>
          <p className="text-gray-500 mt-1">Kelola stok, harga beli, dan harga jual barang.</p>
        </div>
        <Button onClick={handleOpenDialog} className="bg-primary hover:bg-primary/90 shadow-lg transition-all">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Produk
        </Button>
      </div>

      {/* Table Section */}
      <Card className="border shadow-md overflow-hidden">
        <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold">Daftar Inventaris</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari SKU atau Nama Produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="w-[80px] pl-6">Gambar</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Harga Beli</TableHead>
                <TableHead className="text-right">Harga Jual</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-center">Stok</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex justify-center items-center gap-2 text-primary">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Memuat data...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="pl-6">
                      <div className="w-12 h-12 rounded-lg border bg-white p-1">
                        <ImageWithFallback 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover rounded"
                          fallbackText={product.sku.substring(0, 2)}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{product.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-600">
                      {formatRupiah(product.buy_price)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900">
                      {formatRupiah(product.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-green-600 font-semibold text-sm">
                        {/* Hitung Margin Otomatis */}
                        {formatRupiah(product.price - product.buy_price)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={product.stock < 5 ? "destructive" : "secondary"} className="font-mono">
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={`w-2 h-2 rounded-full mx-auto ${product.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        {/* TOMBOL EDIT BERGARIS */}
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleEdit(product)}
                          className="border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {/* TOMBOL HAPUS BERGARIS */}
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleDelete(product)}
                          className="border-gray-300 hover:border-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-64 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <Package className="w-12 h-12 mb-2 opacity-20" />
                      <p>Tidak ada produk ditemukan</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Form: Layout Grid yang Lebih Rapi */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{currentProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Baris 1: SKU & Kategori */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU / Kode</Label>
                <Input name="sku" value={formData.sku} onChange={handleInputChange} placeholder="Ex: HP-001" />
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <select 
                  name="category" 
                  value={formData.category} 
                  onChange={handleInputChange}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Pilih...</option>
                  <option value="Smartphone">Smartphone</option>
                  <option value="Aksesoris">Aksesoris</option>
                  <option value="Service">Service</option>
                </select>
              </div>
            </div>

            {/* Baris 2: Nama Produk */}
            <div className="space-y-2">
              <Label>Nama Produk</Label>
              <Input name="name" value={formData.name} onChange={handleInputChange} />
            </div>

            {/* Baris 3: Harga Beli & Harga Jual (PENTING) */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
              <div className="space-y-2">
                <Label className="text-gray-600">Harga Beli (Modal)</Label>
                <Input type="number" name="buy_price" value={formData.buy_price} onChange={handleInputChange} className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600">Harga Jual</Label>
                <Input type="number" name="price" value={formData.price} onChange={handleInputChange} className="bg-white" />
              </div>
            </div>

            {/* Baris 4: Stok & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stok</Label>
                <Input type="number" name="stock" value={formData.stock} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="status" value="active" checked={formData.status === 'active'} onChange={handleInputChange} /> Aktif
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="status" value="inactive" checked={formData.status === 'inactive'} onChange={handleInputChange} /> Non-aktif
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>Simpan Produk</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Dialog tetap sama */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
            <AlertDialogDescription>
              Data <strong>{productToDelete?.name}</strong> akan hilang permanen dari database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Hapus Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};