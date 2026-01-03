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
import { Plus, Edit, Trash2, Search, Package as PackageIcon, Loader2, Upload } from 'lucide-react';
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
  
  // State khusus buat file gambar
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    price: 0,
    purchasePrice: 0,
    stock: 0,
    sku: '',
    description: '',
    minStock: 0,
    image: '', // Ini buat nyimpen URL lama
  });
  
  const [marginPercentage, setMarginPercentage] = useState<number>(0);

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

  // Hitung Margin Otomatis
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

  // Handle Input Biasa
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['price', 'purchasePrice', 'stock', 'minStock'].includes(name) ? Number(value) : value
    }));
  };

  // Handle Input File Gambar (NEW)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      // Bikin preview lokal biar user liat apa yang dia pilih
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
        description: product.description || ''
      });
      setImagePreview(product.image || ''); // Tampilkan gambar lama
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.sku) {
      toast.error('Mohon lengkapi data utama');
      return;
    }

    // PAKE FORMDATA UNTUK UPLOAD FILE
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

    // Kalau ada gambar baru, append filenya
    if (selectedImage) {
      dataToSend.append('image', selectedImage);
    } else if (formData.image && editingProduct) {
      // Logic backend: kalau gak ada gambar baru, dia tetep pake yang lama
    }

    try {
      // Header khusus buat upload file
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (editingProduct) {
        // Pake POST + _method: PUT karena HTML form gak support PUT langsung buat file
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
        toast.success('Produk dihapus');
        fetchProducts();
      } catch (error) { toast.error('Gagal hapus'); }
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Produk</h2>
          <p className="text-muted-foreground">Kelola stok, harga, dan varian produk.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Tambah Produk
        </Button>
      </div>

      <Card className="border-2 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Daftar Inventaris</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Cari nama, SKU, atau merek..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-[80px]">Gambar</TableHead>
                {/* ALIGNMENT FIX: Text-Left buat Nama */}
                <TableHead className="text-left">Info Produk</TableHead>
                {/* ALIGNMENT FIX: Center buat Badge/Label */}
                <TableHead className="text-center">Kategori & Merek</TableHead>
                {/* ALIGNMENT FIX: Right buat Angka */}
                <TableHead className="text-right">Harga Beli</TableHead>
                <TableHead className="text-right">Harga Jual</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-center">Stok</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow><TableCell colSpan={8} className="text-center py-10"><Loader2 className="animate-spin inline mr-2"/> Loading...</TableCell></TableRow>
              ) : filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="w-12 h-12 rounded-lg overflow-hidden border bg-gray-100">
                      <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    <div>
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500 font-mono mb-1">{product.sku}</p>
                      {/* DESKRIPSI: Muncul disini biar gak sia-sia */}
                      {/* @ts-ignore */}
                      {product.description && (
                        <p className="text-[11px] text-gray-500 italic border-l-2 pl-2 border-gray-300">
                          {/* @ts-ignore */}
                          {product.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col gap-1 items-center">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{product.category}</Badge>
                      {/* @ts-ignore */}
                      {product.brand && <span className="text-xs font-medium text-gray-600">{product.brand}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-gray-600">
                    {product.purchasePrice ? formatRupiah(product.purchasePrice) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-bold text-gray-900">
                    {formatRupiah(product.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.purchasePrice ? (
                       <span className="text-green-600 text-sm font-medium">
                         {(((product.price - product.purchasePrice) / product.price) * 100).toFixed(1)}%
                       </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={product.stock <= (product.minStock || 0) ? 'destructive' : 'secondary'}>
                      {product.stock}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="outline" onClick={() => handleOpenDialog(product)}>
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button size="icon" variant="outline" onClick={() => { setProductToDelete(product); setDeleteDialogOpen(true); }}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DIALOG FORM */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
            <DialogDescription>Isi detail produk dengan lengkap.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            
            {/* AREA UPLOAD GAMBAR (FIXED) */}
            <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <div className="w-24 h-24 bg-white rounded-lg border flex items-center justify-center overflow-hidden relative">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <PackageIcon className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="image" className="text-base font-semibold">Foto Produk</Label>
                <p className="text-sm text-muted-foreground mb-3">Format: JPG, PNG. Maks 2MB.</p>
                <div className="flex items-center gap-2">
                  <Input 
                    id="image" 
                    type="file" 
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="w-full max-w-sm cursor-pointer file:cursor-pointer file:text-primary file:font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU / Kode Barang *</Label>
                <Input name="sku" value={formData.sku} onChange={handleInputChange} required placeholder="Contoh: HP-SMP-01" />
              </div>
              <div className="space-y-2">
                <Label>Kategori *</Label>
                <Input name="category" value={formData.category} onChange={handleInputChange} required placeholder="Contoh: Smartphone" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Produk *</Label>
                <Input name="name" value={formData.name} onChange={handleInputChange} required placeholder="Contoh: Samsung S24 Ultra" />
              </div>
              {/* KOLOM MEREK (YANG TADI GAK GUNA, SEKARANG GUNA) */}
              <div className="space-y-2">
                <Label>Merek (Brand)</Label>
                <Input name="brand" value={formData.brand} onChange={handleInputChange} placeholder="Contoh: Samsung" />
              </div>
            </div>

            {/* KOLOM DESKRIPSI (YANG TADI BINGUNG, SEKARANG BUAT VARIAN) */}
            <div className="space-y-2">
              <Label>Deskripsi / Spesifikasi Singkat</Label>
              <Input 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange} 
                placeholder="Contoh: 12GB/256GB, Titanium Gray (Muncul di bawah nama produk)" 
              />
            </div>

            {/* AREA HARGA */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
              <div className="space-y-2">
                <Label className="text-blue-900">Harga Beli (Modal)</Label>
                <Input type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleInputChange} className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-blue-900">Margin (%)</Label>
                <div className="relative">
                  <Input type="number" value={marginPercentage} readOnly className="bg-gray-100 pr-8" />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-500">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-blue-900">Harga Jual</Label>
                <Input type="number" name="price" value={formData.price} onChange={handleInputChange} className="bg-white font-bold" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stok Awal</Label>
                <Input type="number" name="stock" value={formData.stock} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Minimum Stok (Alert)</Label>
                <Input type="number" name="minStock" value={formData.minStock} onChange={handleInputChange} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit">Simpan Produk</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Alert Dialog Hapus (Sama kayak sebelumnya) */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yakin hapus produk?</AlertDialogTitle>
            <AlertDialogDescription>Data {productToDelete?.name} akan hilang permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};