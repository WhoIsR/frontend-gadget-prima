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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
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
import { Plus, Edit, Trash2, Search, Package as PackageIcon, Loader2, RefreshCw, History, ArrowUpRight, ArrowDownLeft, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '../utils/currency';

// Tipe data buat History
interface StockHistory {
  id: number;
  type: 'in' | 'out' | 'adjustment';
  amount: number;
  current_stock: number;
  reason: string;
  created_at: string;
  user: { name: string };
}

export const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false); // New

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingHistoryProduct, setViewingHistoryProduct] = useState<Product | null>(null); // New

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); // New
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]); // New

  // State Gambar
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '', category: '', brand: '', price: 0, purchasePrice: 0, stock: 0, sku: '', description: '', minStock: 0, image: '',
  });

  const [marginPercentage, setMarginPercentage] = useState<number>(0);

  // Master data: categories & brands
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');

  // Edit states for master data
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editBrandId, setEditBrandId] = useState<number | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editBrandName, setEditBrandName] = useState('');

  // --- FETCH DATA ---
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/products`);
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

  // Fetch master data (categories, brands)
  const fetchMasterData = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/categories'),
        axios.get('http://127.0.0.1:8000/api/brands')
      ]);
      setCategories(catRes.data.data);
      setBrands(brandRes.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchMasterData();
  }, []);

  // --- HISTORY LOGIC ---
  const handleOpenHistory = async (product: Product) => {
    setViewingHistoryProduct(product);
    setHistoryDialogOpen(true);
    setIsLoadingHistory(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/products/${product.id}/history`);
      setStockHistory(response.data.data);
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengambil riwayat stok');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // --- FUNGSI CRUD MASTER DATA ---
  const handleAddMaster = async (type: 'category' | 'brand') => {
    try {
      const url = type === 'category' ? 'categories' : 'brands';
      const payload = { name: type === 'category' ? newCategoryName : newBrandName };

      if (!payload.name) return toast.error('Nama tidak boleh kosong');

      await axios.post(`http://127.0.0.1:8000/api/${url}`, payload);
      toast.success('Berhasil ditambahkan');

      // Reset input & refresh data
      if (type === 'category') setNewCategoryName('');
      else setNewBrandName('');
      fetchMasterData();
    } catch (error) { toast.error('Gagal menambahkan'); }
  };

  const handleDeleteMaster = async (type: 'category' | 'brand', id: number) => {
    if (!window.confirm('Yakin hapus?')) return;
    try {
      const url = type === 'category' ? 'categories' : 'brands';
      await axios.delete(`http://127.0.0.1:8000/api/${url}/${id}`);
      toast.success('Berhasil dihapus');
      fetchMasterData();
    } catch (error) { toast.error('Gagal menghapus'); }
  };

  // --- EDIT MASTER DATA ---
  const handleStartEdit = (type: 'category' | 'brand', id: number, name: string) => {
    if (type === 'category') {
      setEditCategoryId(id);
      setEditCategoryName(name);
    } else {
      setEditBrandId(id);
      setEditBrandName(name);
    }
  };

  const handleCancelEdit = (type: 'category' | 'brand') => {
    if (type === 'category') {
      setEditCategoryId(null);
      setEditCategoryName('');
    } else {
      setEditBrandId(null);
      setEditBrandName('');
    }
  };

  const handleSaveEdit = async (type: 'category' | 'brand') => {
    try {
      const url = type === 'category' ? 'categories' : 'brands';
      const id = type === 'category' ? editCategoryId : editBrandId;
      const name = type === 'category' ? editCategoryName.trim() : editBrandName.trim();
      if (!id || !name) return toast.error('Nama tidak boleh kosong');

      await axios.put(`http://127.0.0.1:8000/api/${url}/${id}`, { name });
      toast.success('Berhasil diperbarui');
      fetchMasterData();
      handleCancelEdit(type);
    } catch (error) {
      console.error(error);
      toast.error('Gagal memperbarui');
    }
  };

  // --- SKU GENERATOR & INPUT LOGIC (SAMA SEPERTI SEBELUMNYA) ---
  const generateSKU = (category: string) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    let prefix = 'ITM';
    switch (category) {
      case 'Smartphone': prefix = 'HP'; break;
      case 'Aksesoris': prefix = 'ACC'; break;
      case 'Laptop': prefix = 'NB'; break;
      case 'Tablet': prefix = 'TAB'; break;
      case 'Service': prefix = 'SRV'; break;
      default: prefix = 'GEN';
    }
    return `${prefix}-${randomNum}`;
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    let newSKU = formData.sku;
    if (!editingProduct || formData.sku === '') {
      newSKU = generateSKU(newCategory);
    }
    setFormData(prev => ({ ...prev, category: newCategory, sku: newSKU }));
  };

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

  const handleMarginChange = (newMargin: number) => {
    setMarginPercentage(newMargin);
    const buyPrice = Number(formData.purchasePrice) || 0;
    if (buyPrice > 0 && newMargin >= 0 && newMargin < 100) {
      const sellingPrice = buyPrice / (1 - newMargin / 100);
      setFormData({ ...formData, price: Number(sellingPrice.toFixed(0)) });
    }
  };

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

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        description: product.description || '',
        // @ts-ignore
        minStock: product.minStock || product.min_stock || 0
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
          <p className="text-muted-foreground">Kelola katalog produk toko Anda</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Produk
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
              <DialogDescription>
                Isi detail produk di bawah ini.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">

                {/* UPLOAD GAMBAR */}
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

                {/* SKU & Kategori */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori *</Label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleCategoryChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      required
                    >
                      <option value="">Pilih Kategori...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU / Kode Barang *</Label>
                    <div className="flex gap-2">
                      <Input id="sku" name="sku" value={formData.sku} onChange={handleInputChange} required className="bg-gray-50 font-mono" />
                      <Button type="button" variant="outline" size="icon" onClick={() => setFormData({ ...formData, sku: generateSKU(formData.category) })} title="Refresh SKU">
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Nama & Brand */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Merek (Brand)</Label>
                    <select
                      id="brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="">Pilih Brand...</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Produk *</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Galaxy S24 Ultra" />
                  </div>
                </div>

                {/* Deskripsi */}
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi / Varian</Label>
                  <Input id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Contoh: 12GB/256GB, Titanium Gray" />
                </div>

                {/* HARGA */}
                <div className="space-y-2">
                  <Label>Informasi Harga & Profit</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-red-600">Harga Beli (Modal)</span>
                      <Input type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleInputChange} className="text-red-700 font-medium" min="0" required />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-green-600">Margin (%)</span>
                      <div className="relative">
                        <Input type="number" value={marginPercentage} onChange={(e) => handleMarginChange(Number(e.target.value))} className="text-green-700 font-medium pr-8" step="0.1" />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-green-600">%</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-blue-600">Harga Jual</span>
                      <Input type="number" name="price" value={formData.price} onChange={handleInputChange} className="text-blue-700 font-bold" min="0" required />
                    </div>
                  </div>
                </div>

                {/* Stok & Min Stok */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stok Saat Ini *</Label>
                    <Input id="stock" type="number" name="stock" value={formData.stock} onChange={handleInputChange} min="0" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minStock" className="text-amber-700">Stok Minimum (Alert)</Label>
                    <Input id="minStock" type="number" name="minStock" value={formData.minStock} onChange={handleInputChange} className="border-amber-200 focus:border-amber-500 bg-amber-50/30" min="0" />
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


        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="ml-2 border-black">
              <PackageIcon className="w-4 h-4 mr-2" />
              Kelola Kategori & Brand
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Data Master Produk</DialogTitle>
              <DialogDescription>Tambah atau hapus pilihan kategori dan brand.</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="kategori" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="kategori">Kategori</TabsTrigger>
                <TabsTrigger value="brand">Brand / Merek</TabsTrigger>
              </TabsList>

              <TabsContent value="kategori" className="space-y-4 py-4">
                <div className="flex gap-2">
                  <Input placeholder="Nama Kategori Baru..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                  <Button size="icon" onClick={() => handleAddMaster('category')}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                  {categories.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">Belum ada kategori</div>
                  ) : (
                    categories.map((cat) => (
                      <div key={cat.id} className="p-2 flex justify-between items-center text-sm">
                        {editCategoryId === cat.id ? (
                          <div className="flex items-center gap-2 w-full">
                            <Input value={editCategoryName} onChange={(e) => setEditCategoryName(e.target.value)} className="flex-1" />
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="ghost" onClick={() => handleSaveEdit('category')} title="Simpan"><Check className="w-4 h-4 text-green-600" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => handleCancelEdit('category')} title="Batal"><X className="w-4 h-4 text-gray-600" /></Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span>{cat.name}</span>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleStartEdit('category', cat.id, cat.name)} title="Edit"><Edit className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => handleDeleteMaster('category', cat.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="brand" className="space-y-4 py-4">
                <div className="flex gap-2">
                  <Input placeholder="Nama Brand Baru..." value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} />
                  <Button size="icon" onClick={() => handleAddMaster('brand')}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                  {brands.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">Belum ada brand</div>
                  ) : (
                    brands.map((b) => (
                      <div key={b.id} className="p-2 flex justify-between items-center text-sm">
                        {editBrandId === b.id ? (
                          <div className="flex items-center gap-2 w-full">
                            <Input value={editBrandName} onChange={(e) => setEditBrandName(e.target.value)} className="flex-1" />
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="ghost" onClick={() => handleSaveEdit('brand')} title="Simpan"><Check className="w-4 h-4 text-green-600" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => handleCancelEdit('brand')} title="Batal"><X className="w-4 h-4 text-gray-600" /></Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span>{b.name}</span>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleStartEdit('brand', b.id, b.name)} title="Edit"><Edit className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => handleDeleteMaster('brand', b.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
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
                  <TableRow><TableCell colSpan={9} className="text-center py-8"><Loader2 className="animate-spin w-6 h-6 inline mr-2" />Memuat...</TableCell></TableRow>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    const isLowStock = product.stock <= (product.minStock || 0);
                    return (
                      <TableRow key={product.id}>
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
                          <div>
                            <p className="font-medium">{product.name}</p>
                            {/* @ts-ignore */}
                            <p className="text-sm text-muted-foreground">{product.brand}</p>
                            {/* @ts-ignore */}
                            {product.description && (
                              <p className="text-[11px] text-gray-500 italic mt-0.5">
                                {/* @ts-ignore */}
                                {product.description}
                              </p>
                            )}
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
                              {(((product.price - product.purchasePrice) / product.price) * 100).toFixed(1)}%
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={isLowStock ? 'destructive' : 'default'}
                            className={!isLowStock ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}
                          >
                            {product.stock}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">

                            {/* HISTORY BUTTON (NEW FEATURE) */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-300 hover:border-blue-500 hover:text-blue-600"
                              onClick={() => handleOpenHistory(product)}
                              title="Riwayat Stok"
                            >
                              <History className="w-4 h-4" />
                            </Button>

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
                              onClick={() => { setProductToDelete(product); setDeleteDialogOpen(true); }}
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
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

      {/* DIALOG RIWAYAT STOK (NEW) */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Riwayat Stok: {viewingHistoryProduct?.name}</DialogTitle>
            <DialogDescription>Catatan perubahan stok (Masuk/Keluar/Koreksi)</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Stok Akhir</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingHistory ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-4"><Loader2 className="animate-spin inline mr-2" />Loading...</TableCell></TableRow>
                ) : stockHistory.length > 0 ? (
                  stockHistory.map((history) => (
                    <TableRow key={history.id}>
                      <TableCell className="text-xs font-mono">{formatDate(history.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant={history.type === 'in' ? 'default' : (history.type === 'out' ? 'destructive' : 'outline')} className={history.type === 'in' ? 'bg-green-600' : ''}>
                          {history.type === 'in' ? 'Masuk' : (history.type === 'out' ? 'Keluar' : 'Koreksi')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {history.type === 'in' ? '+' : '-'}{history.amount}
                      </TableCell>
                      <TableCell className="text-right">{history.current_stock}</TableCell>
                      <TableCell className="text-sm text-gray-600">{history.reason}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{history.user?.name || 'System'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center py-4 text-muted-foreground">Belum ada riwayat stok</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

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