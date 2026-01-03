import { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
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
import { Plus, Edit, Trash2, Search, Package as PackageIcon } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { formatRupiah } from '../utils/currency';

export const Products = () => {
  const { getItem, setItem } = useLocalStorage();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
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
  const [marginPercentage, setMarginPercentage] = useState<number>(0);

  useEffect(() => {
    const storedProducts = getItem('products') || [];
    setProducts(storedProducts);
  }, []);

  // Calculate margin percentage when prices change
  useEffect(() => {
    if (formData.price > 0 && formData.purchasePrice > 0) {
      const calculatedMargin = ((formData.price - formData.purchasePrice) / formData.price) * 100;
      setMarginPercentage(Number(calculatedMargin.toFixed(2)));
    } else {
      setMarginPercentage(0);
    }
  }, [formData.price, formData.purchasePrice]);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      if (product.price > 0 && product.purchasePrice > 0) {
        const calculatedMargin = ((product.price - product.purchasePrice) / product.price) * 100;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.sku || !formData.category || !formData.brand) {
      toast.error('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    if (editingProduct) {
      // Update existing product
      const updatedProducts = products.map((p) =>
        p.id === editingProduct.id ? { ...editingProduct, ...formData } : p
      );
      setProducts(updatedProducts);
      setItem('products', updatedProducts);
      toast.success('Produk berhasil diperbarui');
    } else {
      // Add new product
      const newProduct: Product = {
        id: `PRD${Date.now().toString().slice(-6)}`,
        ...formData as Omit<Product, 'id'>,
      };
      const updatedProducts = [...products, newProduct];
      setProducts(updatedProducts);
      setItem('products', updatedProducts);
      toast.success('Produk berhasil ditambahkan');
    }

    handleCloseDialog();
  };

  const handleMarginChange = (newMargin: number) => {
    setMarginPercentage(newMargin);
    // Calculate selling price from purchase price and margin
    if (formData.purchasePrice > 0 && newMargin >= 0 && newMargin < 100) {
      const sellingPrice = formData.purchasePrice / (1 - newMargin / 100);
      setFormData({ ...formData, price: Number(sellingPrice.toFixed(0)) });
    }
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      const updatedProducts = products.filter((p) => p.id !== productToDelete.id);
      setProducts(updatedProducts);
      setItem('products', updatedProducts);
      toast.success('Produk berhasil dihapus');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2">Manajemen Produk</h2>
          <p className="text-muted-foreground">Kelola katalog produk toko Anda</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-primary">
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

                {formData.price > 0 && formData.purchasePrice > 0 && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Laba per Unit</p>
                        <p className="text-lg font-bold text-green-700">
                          {formatRupiah(formData.price - formData.purchasePrice)}
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
                        💡 <strong>Tips:</strong> Margin {marginPercentage.toFixed(1)}% berarti setiap {formatRupiah(formData.price)} penjualan menghasilkan {formatRupiah(formData.price - formData.purchasePrice)} keuntungan
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
                <Button type="submit" className="bg-primary">
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
                className="pl-10"
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
                {filteredProducts.map((product) => (
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
                        variant={product.stock <= product.minStock ? 'destructive' : 'default'}
                        className={product.stock <= product.minStock ? '' : 'bg-green-100 text-green-700 hover:bg-green-200'}
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
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <PackageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Tidak ada produk yang cocok' : 'Belum ada produk'}
              </p>
            </div>
          )}
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
