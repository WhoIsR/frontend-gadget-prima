import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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
import { Plus, Edit, Trash2, Search, Package as PackageIcon, Loader2, Upload, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '../utils/currency';

export const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // State Gambar
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '', // Nanti kita ganti jadi Select biar SKU otomatis jalan
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

  // --- LOGIC: Fetch Data ---
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/products');
      const mappedData = response.data.data.map((item: any) => ({
        ...item,
        purchasePrice: item.buy_price || item.purchasePrice,
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

  // --- LOGIC: SKU Generator Otomatis ---
  const generateSKU = (category: string) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digit acak
    let prefix = 'ITM';
    
    switch (category) {
      case 'Smartphone': prefix = 'HP'; break;
      case 'Aksesoris': prefix = 'ACC'; break;
      case 'Laptop': prefix = 'NB'; break; // NB for Notebook
      case 'Tablet': prefix = 'TAB'; break;
      case 'Service': prefix = 'SRV'; break;
      default: prefix = 'GEN';
    }
    
    return `${prefix}-${randomNum}`;
  };

  // Logic handle kategori berubah -> Auto update SKU (Kalo lagi create baru)
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    
    // Kalau lagi mode TAMBAH (bukan edit), atau SKU masih kosong, kita generate otomatis
    let newSKU = formData.sku;
    if (!editingProduct || formData.sku === '') {
       newSKU = generateSKU(newCategory);
    }

    setFormData(prev => ({
      ...prev,
      category: newCategory,
      sku: newSKU
    }));
  };

  // --- LOGIC: Margin Calculation ---
  useEffect(() => {
    const buyPrice = Number(formData.purchasePrice) || 0;
    const sellPrice = Number(formData.price) || 0;

    if (sellPrice > 0 && buyPrice > 0) {
      const calculatedMargin = ((sellPrice - buyPrice) / sellPrice) * 100;
      setMarginPercentage(Number(calculatedMargin.toFixed(2)));
    } else {
      setMarginPercentage(0);
    }
  }, [formData.price, formData.purchasePrice]);

  // --- LOGIC: Inputs ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['price', 'purchasePrice', 'stock', 'minStock'].includes(name) ? Number(value) : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleMarginChange = (newMargin: number) => {
    setMarginPercentage(newMargin);
    const buyPrice = Number(formData.purchasePrice) || 0;
    if (buyPrice > 0 && newMargin >= 0 && newMargin < 100) {
      const sellingPrice = buyPrice / (1 - newMargin / 100);
      setFormData({ ...formData, price: Number(sellingPrice.toFixed(0)) });
    }
  };

  // --- FILTER ---
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- RESET & OPEN DIALOG ---
  const resetForm = () => {
    setFormData({
      name: '', category: '', brand: '', price: 0, purchasePrice: 0, 
      stock: 0, sku: '', description: '', minStock: 0, image: ''
    });
    setMarginPercentage(0);
    setEditingProduct(null);
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        ...product,
        // @ts-ignore
        brand: product.brand || '',
        // @ts-ignore
        description: product.description || ''
      });
      setImagePreview(product.image || '');
      
      const buy = Number(product.purchasePrice) || Number((product as any).buy_price) || 0;
      const sell = Number(product.price) || 0;
      if (sell > 0 && buy > 0) {
        const m = ((sell - buy) / sell) * 100;
        setMarginPercentage(Number(m.toFixed(2)));
      }
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  // --- SUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.sku || !formData.category) {
      toast.error('Mohon lengkapi Nama, SKU, dan Kategori');
      return;
    }

    const dataToSend = new FormData();
    dataToSend.append('name', formData.name);
    dataToSend.append('sku', formData.sku);
    dataToSend.append('category', formData.category);
    dataToSend.append('brand', formData.brand);
    dataToSend.append('description', formData.description);
    dataToSend.append('buy_price', String(formData.purchasePrice));
    dataToSend.append('price', String(formData.price));
    dataToSend.append('stock', String(formData.stock));
    dataToSend.append('min_stock', String(formData.minStock));
    dataToSend.append('status', 'active');

    if (selectedImage) {
      dataToSend.append('image', selectedImage);
    }

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editingProduct) {
        dataToSend.append('_method', 'PUT'); 
        await axios.post(`http://127.0.0.1:8000/api/products/${editingProduct.id}`, dataToSend, config);
        toast.success('Produk berhasil diperbarui');
      } else {
        await axios.post('http://127.0.0.1:8000/api/products', dataToSend, config);
        toast.success('Produk berhasil ditambahkan');
      }
      fetchProducts();
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Gagal menyimpan produk');
    }
  };

  const handleDeleteConfirm = async () => {
    if (productToDelete) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/products/${productToDelete.id}`);
        toast.success('Produk berhasil dihapus');
        fetchProducts();
      } catch (error) { toast.error('Gagal hapus'); }
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2 text-2xl font-bold">Manajemen Produk</h2>
          <p className="text-muted-foreground">Kelola katalog produk, stok, dan harga.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Produk
            </Button>
          </DialogTrigger>
          {/* DIALOG CONTENT */}
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Perbarui informasi produk di bawah ini' : 'Masukkan informasi produk baru'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                
                {/* 1. UPLOAD GAMBAR */}
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-slate-50">
                   <div className="w-20 h-20 bg-white border rounded-md flex items-center justify-center overflow-hidden shrink-0">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <PackageIcon className="text-gray-300 w-8 h-8" />
                      )}
                   </div>
                   <div className="flex-1">
                      <Label htmlFor="image" className="font-semibold">Foto Produk</Label>
                      <Input 
                        id="image" 
                        type="file" 
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="mt-2 bg-white"
                      />
                   </div>
                </div>

                {/* 2. KATEGORI & SKU (SMART) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori *</Label>
                    <div className="relative">
                      <select 
                        id="category" 
                        name="category" 
                        value={formData.category} 
                        onChange={handleCategoryChange} 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        required
                      >
                        <option value="">Pilih Kategori...</option>
                        <option value="Smartphone">Smartphone</option>
                        <option value="Aksesoris">Aksesoris</option>
                        <option value="Laptop">Laptop</option>
                        <option value="Tablet">Tablet</option>
                        <option value="Service">Jasa Service</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-muted-foreground">SKU akan otomatis dibuat berdasarkan kategori</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU / Kode Barang *</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="sku" 
                        name="sku" 
                        value={formData.sku} 
                        onChange={handleInputChange} 
                        required 
                        placeholder="Otomatis..." 
                        className="bg-gray-50 font-mono"
                      />
                      <Button type="button" variant="outline" size="icon" onClick={() => setFormData({...formData, sku: generateSKU(formData.category)})} title="Generate Ulang">
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 3. NAMA & MEREK */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Merek (Brand)</Label>
                    <Input id="brand" name="brand" value={formData.brand} onChange={handleInputChange} placeholder="Contoh: Samsung" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Produk *</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Contoh: Galaxy S24 Ultra" />
                  </div>
                </div>

                {/* 4. DESKRIPSI (VARIAN) */}
                <div className="space-y-2">
                   <Label htmlFor="description">Deskripsi / Varian</Label>
                   <Input 
                    id="description" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    placeholder="Contoh: 12GB/256GB, Titanium Gray" 
                   />
                </div>

                {/* 5. AREA HARGA (COLOR CODED) */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5 space-y-4">
                  <h3 className="font-semibold text-indigo-900 text-sm flex items-center gap-2">
                     <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                     Informasi Harga & Keuntungan
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-indigo-900">Harga Beli (Modal)</Label>
                      <Input type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleInputChange} className="bg-white border-indigo-200 focus:border-indigo-500" min="0" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-indigo-900">Margin (%)</Label>
                      <div className="relative">
                        <Input type="number" value={marginPercentage} onChange={(e) => handleMarginChange(Number(e.target.value))} className="bg-white border-indigo-200 focus:border-indigo-500 pr-8" step="0.1" />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-indigo-400">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-indigo-900">Harga Jual</Label>
                      <Input type="number" name="price" value={formData.price} onChange={handleInputChange} className="bg-white border-indigo-200 focus:border-indigo-500 font-bold text-indigo-950" min="0" required />
                    </div>
                  </div>
                  {Number(formData.price) > 0 && Number(formData.purchasePrice) > 0 && (
                     <p className="text-xs text-indigo-700 bg-indigo-100/50 p-2 rounded border border-indigo-100">
                        ✨ Keuntungan bersih per unit: <strong>{formatRupiah(Number(formData.price) - Number(formData.purchasePrice))}</strong>
                     </p>
                  )}
                </div>

                {/* 6. STOK & MINIMUM */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stok Saat Ini *</Label>
                    <Input id="stock" type="number" name="stock" value={formData.stock} onChange={handleInputChange} min="0" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minStock" className="text-amber-700">Stok Minimum (Alert)</Label>
                    <Input id="minStock" type="number" name="minStock" value={formData.minStock} onChange={handleInputChange} className="border-amber-200 focus:border-amber-500 bg-amber-50/30" min="0" />
                    <p className="text-[10px] text-muted-foreground">Jika stok di bawah angka ini, indikator akan berwarna merah.</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Batal</Button>
                <Button type="submit" className="bg-primary">Simpan Produk</Button>
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
                  <TableHead className="w-[250px]">Produk</TableHead>
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
                  <TableRow><TableCell colSpan={9} className="text-center py-8"><Loader2 className="animate-spin w-6 h-6 inline mr-2"/>Memuat...</TableCell></TableRow>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    // LOGIC INDIKATOR STOK
                    const isLowStock = product.stock <= (product.minStock || 0);
                    
                    return (
                    <TableRow key={product.id} className="h-16"> {/* Tambah height row biar lega */}
                      <TableCell>
                        {product.image ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                            <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <PackageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="py-1">
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          {/* @ts-ignore */}
                          <p className="text-xs text-muted-foreground font-medium">{product.brand}</p>
                          
                          {/* DESKRIPSI: Muncul cantik di sini */}
                          {/* @ts-ignore */}
                          {product.description && (
                            <p className="text-[11px] text-gray-500 mt-1 line-clamp-1 border-l-2 border-gray-200 pl-2 italic">
                              {/* @ts-ignore */}
                              {product.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 font-mono font-semibold">
                          {product.sku}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {product.purchasePrice ? formatRupiah(product.purchasePrice) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-bold text-gray-900">
                        {formatRupiah(product.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.purchasePrice ? (
                          <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                            {(((product.price - product.purchasePrice) / product.price) * 100).toFixed(1)}%
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          // LOGIC WARNA STOK
                          variant={isLowStock ? 'destructive' : 'secondary'}
                          className={!isLowStock ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200' : ''}
                        >
                          {product.stock} {isLowStock && '!'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(product)}
                            className="border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setProductToDelete(product); setDeleteDialogOpen(true); }}
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )})
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus produk <strong>{productToDelete?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};