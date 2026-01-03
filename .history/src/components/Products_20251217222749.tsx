import { useState, useEffect } from 'react';
// import { useLocalStorage } from '../hooks/useLocalStorage'; // <-- HAPUS
import axios from 'axios'; // <-- GANTI
import { Product } from '../types';
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
import { Plus, Edit, Trash2, Search, Package as PackageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '../utils/currency';

export const Products = () => {
  // const { getItem, setItem } = useLocalStorage(); // <-- GAK DIPAKE
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Tambahan state loading

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: '',
    brand: '', // Pastikan di DB ada kolom ini atau hapus jika error
    price: 0,
    purchasePrice: 0, // Pastikan migration 'buy_price' sudah dijalankan
    stock: 0,
    sku: '',
    description: '',
    minStock: 0,
    image: '',
  });
  const [marginPercentage, setMarginPercentage] = useState<number>(0);

  // --- LOGIC FETCH DATA (REPLACE getItem) ---
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/products');
      // Mapping data kalau nama field di DB beda (misal: buy_price vs purchasePrice)
      const mappedData = response.data.data.map((item: any) => ({
        ...item,
        purchasePrice: item.buy_price || item.purchasePrice, // Handle beda nama kolom
        brand: item.brand || '-', // Default value kalo kosong
        minStock: item.min_stock || item.minStock || 0
      }));
      setProducts(mappedData);
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
  // ------------------------------------------

  // Calculate margin percentage when prices change
  useEffect(() => {
    // Pastikan formData.purchasePrice & formData.price terisi
    const buyPrice = Number(formData.purchasePrice) || 0;
    const sellPrice = Number(formData.price) || 0;

    if (sellPrice > 0 && buyPrice > 0) {
      const calculatedMargin = ((sellPrice - buyPrice) / sellPrice) * 100;
      setMarginPercentage(Number(calculatedMargin.toFixed(2)));
    } else {
      setMarginPercentage(0);
    }
  }, [formData.price, formData.purchasePrice]);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      brand: '',
      price: 0,
      purchasePrice: 0,
      stock: 0,
      sku: '',
      description: '',
      minStock: 0,
      image: '',
    });
    setMarginPercentage(0);
    setEditingProduct(null);
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
      // Calculate margin for editing
      const buyPrice = Number(product.purchasePrice) || 0;
      const sellPrice = Number(product.price) || 0;
      
      if (sellPrice > 0 && buyPrice > 0) {
        const calculatedMargin = ((sellPrice - buyPrice) / sellPrice) * 100;
        setMarginPercentage(Number(calculatedMargin.toFixed(2)));
      }
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  // --- LOGIC SUBMIT (REPLACE setItem) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.sku || !formData.category || !formData.brand) {
      toast.error('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    // Siapkan payload yang sesuai sama kolom database Laravel
    const payload = {
      ...formData,
      buy_price: formData.purchasePrice, // Map ke nama kolom DB
      min_stock: formData.minStock       // Map ke nama kolom DB
    };

    try {
      if (editingProduct) {
        // UPDATE
        await axios.put(`http://127.0.0.1:8000/api/products/${editingProduct.id}`, payload);
        toast.success('Produk berhasil diperbarui');
      } else {
        // CREATE
        await axios.post('http://127.0.0.1:8000/api/products', payload);
        toast.success('Produk berhasil ditambahkan');
      }
      
      fetchProducts(); // Refresh data
      handleCloseDialog();

    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan produk');
    }
  };
  // --------------------------------------

  const handleMarginChange = (newMargin: number) => {
    setMarginPercentage(newMargin);
    const buyPrice = Number(formData.purchasePrice) || 0;
    
    // Calculate selling price from purchase price and margin
    if (buyPrice > 0 && newMargin >= 0 && newMargin < 100) {
      const sellingPrice = buyPrice / (1 - newMargin / 100);
      setFormData({ ...formData, price: Number(sellingPrice.toFixed(0)) });
    }
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  // --- LOGIC DELETE (REPLACE setItem) ---
  const handleDeleteConfirm = async () => {
    if (productToDelete) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/products/${productToDelete.id}`);
        toast.success('Produk berhasil dihapus');
        fetchProducts(); // Refresh data
      } catch (error) {
        toast.error('Gagal menghapus produk');
      }
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };
  // --------------------------------------

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2 text-3xl font-bold tracking-tight">Manajemen Produk</h2>
          <p className="text-muted-foreground">Kelola katalog produk toko Anda</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Produk
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? 'Perbarui informasi produk di bawah ini'
                  : 'Masukkan informasi produk baru'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Produk *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="contoh: iPhone 15 Pro Max"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="contoh: IPH15PM"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori *</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="contoh: Smartphone"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Merek *</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="contoh: Apple"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchasePrice">Harga Beli/Modal (Rp) *</Label>
                      <Input
                        id="purchasePrice"
                        type="number"
                        value={formData.purchasePrice}
                        onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="marginPercentage">Margin Keuntungan (%) *</Label>
                      <Input
                        id="marginPercentage"
                        type="number"
                        value={marginPercentage}
                        onChange={(e) => handleMarginChange(Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        max="99.99"
                        step="0.01"
                      />
                      <p className="text-xs text-muted-foreground">
                        Masukkan persentase margin untuk menghitung harga jual otomatis
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Harga Jual (Rp) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      placeholder="0"
                      min="0"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Harga jual akan otomatis terisi saat margin diinput, atau isi manual
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stok *</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minStock">Stok Minimum</Label>
                    <Input
                      id="minStock"
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                {Number(formData.price) > 0 && Number(formData.purchasePrice) > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Laba per Unit</p>
                        <p className="text-lg font-bold text-green-700">
                          {formatRupiah(Number(formData.price) - Number(formData.purchasePrice))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Persentase Margin</p>
                        <p className="text-lg font-bold text-green-700">
                          {marginPercentage.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-xs text-green-800">
                        💡 <strong>Tips:</strong> Margin {marginPercentage.toFixed(1)}% berarti setiap {formatRupiah(formData.price)} penjualan menghasilkan {formatRupiah(Number(formData.price) - Number(formData.purchasePrice))} keuntungan
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="image">URL Gambar</Label>
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi produk"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Batal
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  {editingProduct ? 'Perbarui' : 'Tambah'} Produk
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-2 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Produk</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gambar</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Harga Beli</TableHead>
                  <TableHead className="text-right">Harga Jual</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-center">Stok</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                   <TableRow>
                     <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                       <div className="flex items-center justify-center gap-2">
                         <Loader2 className="w-5 h-5 animate-spin" />
                         Memuat data...
                       </div>
                     </TableCell>
                   </TableRow>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.image ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                            <ImageWithFallback
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <PackageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.brand}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-secondary px-2 py-1 rounded">{product.sku}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {product.purchasePrice ? formatRupiah(product.purchasePrice) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatRupiah(product.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.purchasePrice ? (
                          <Badge variant="outline" className="border-green-500 text-green-700">
                            {formatRupiah(product.price - product.purchasePrice)} ({(((product.price - product.purchasePrice) / product.price) * 100).toFixed(1)}%)
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={product.stock <= (product.minStock || 0) ? 'destructive' : 'default'}
                          className={product.stock <= (product.minStock || 0) ? '' : 'bg-green-100 text-green-700 hover:bg-green-200'}
                        >
                          {product.stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(product)}
                            className="border-primary text-primary hover:bg-primary hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClick(product)}
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center py-8">
                        <PackageIcon className="w-16 h-16 mb-4 text-gray-300" />
                        <p>{searchTerm ? 'Tidak ada produk yang cocok' : 'Belum ada produk'}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus produk <strong>{productToDelete?.name}</strong>?
              <br />
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};