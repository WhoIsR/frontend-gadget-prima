import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
// import { useLocalStorage } from '../hooks/useLocalStorage'; // <-- GAK DIPAKE LAGI
import { Product, Transaction, TransactionItem } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { 
  Search, Minus, Plus, Trash2, CreditCard, Wallet, Banknote, Receipt,
  Clock, Calendar, User, X, Check, Package, History, ShoppingBag, ShoppingCart, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '../utils/currency';
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from './ui/table';
import { ScrollArea } from './ui/scroll-area';

export const Transactions = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'e-wallet'>('cash');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const TAX_RATE = 0.11; 

  // --- 1. FETCH DATA DARI LARAVEL ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Ambil Produk & History Transaksi sekaligus
      const [prodRes, transRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/products'),
        axios.get('http://127.0.0.1:8000/api/transactions')
      ]);

      setProducts(prodRes.data.data);
      setTransactions(transRes.data.data);
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat data kasir');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  // ----------------------------------

  const categories = ['Semua', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(
    (p) =>
      p.stock > 0 &&
      (selectedCategory === 'Semua' || p.category === selectedCategory) &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // @ts-ignore
        (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id);

    if (existingItem) {
      if (existingItem.quantity + 1 > product.stock) {
        toast.error('Stok tidak mencukupi');
        return;
      }
      setCart(cart.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price } : item));
    } else {
      const newItem: TransactionItem = {
        productId: product.id, productName: product.name, quantity: 1, price: product.price, subtotal: product.price,
      };
      setCart([...cart, newItem]);
    }
    // toast.success(`${product.name} masuk keranjang`); // Optional: biar gak spam toast
  };

  const updateQuantity = (productId: string | number, delta: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const updatedCart = cart.map((item) => {
      if (item.productId === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return null;
        if (newQuantity > product.stock) {
          toast.error('Stok mentok bos');
          return item;
        }
        return { ...item, quantity: newQuantity, subtotal: newQuantity * item.price };
      }
      return item;
    }).filter(Boolean) as TransactionItem[];

    setCart(updatedCart);
  };

  const removeFromCart = (productId: string | number) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const calculateSubtotal = () => cart.reduce((sum, item) => sum + item.subtotal, 0);
  const calculateTax = () => calculateSubtotal() * TAX_RATE;
  const calculateTotal = () => calculateSubtotal() + calculateTax();

  const clearCart = () => {
    setCart([]);
    setPaymentMethod('cash');
  };

  // --- 2. PROSES TRANSAKSI KE LARAVEL ---
  const processTransaction = async () => {
    if (cart.length === 0) return toast.error('Keranjang kosong');

    try {
      const payload = {
        items: cart,
        payment_method: paymentMethod,
        total: calculateTotal(),
        tax: calculateTax()
      };

      // Tembak API
      await axios.post('http://127.0.0.1:8000/api/transactions', payload);

      // Bikin Object Transaksi Lokal buat Struk (Biar gak perlu fetch ulang buat nampilin struk)
      const newTxLocal: Transaction = {
        id: 'TRX-BARU', // Nanti diganti kalo mau fetch real ID
        date: new Date().toISOString(),
        items: cart,
        total: calculateTotal(),
        cashierId: user?.id || 0,
        cashierName: user?.name || 'Kasir',
        paymentMethod: paymentMethod
      };

      setLastTransaction(newTxLocal);
      setReceiptDialog(true);
      clearCart();
      fetchData(); // Refresh stok produk & riwayat
      toast.success('Pembayaran Berhasil! Stok sudah dipotong.');

    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Transaksi Gagal');
    }
  };
  // --------------------------------------

  const paymentMethodOptions = [
    { value: 'cash', label: 'Tunai', icon: Banknote },
    { value: 'card', label: 'Kartu', icon: CreditCard },
    { value: 'e-wallet', label: 'E-Wallet', icon: Wallet },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold">Kasir & Transaksi</h2>
        <p className="text-muted-foreground">Proses penjualan dan lihat riwayat transaksi</p>
      </div>

      <Tabs defaultValue="pos" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pos" className="flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> Kasir</TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2"><History className="w-4 h-4" /> Riwayat</TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-6 h-[calc(100vh-12rem)]">
            
            {/* KIRI: PRODUK */}
            <div className="flex flex-col h-full space-y-4">
              <Card className="border-2 shadow-md flex-shrink-0">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Cari produk..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-10 border-2"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {categories.map((category) => (
                        <Button
                          key={category}
                          variant={selectedCategory === category ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedCategory(category)}
                          className={selectedCategory === category ? 'bg-primary' : ''}
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 shadow-md flex-1 overflow-hidden">
                <CardContent className="p-4 h-full">
                  {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="h-full overflow-y-auto">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pr-2">
                        {filteredProducts.map((product) => (
                          <Card
                            key={product.id}
                            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary border group"
                            onClick={() => addToCart(product)}
                          >
                            <CardContent className="p-0">
                              <div className="aspect-square bg-gray-50 relative overflow-hidden">
                                {product.image ? (
                                  <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-gray-300" /></div>
                                )}
                                {/* @ts-ignore */}
                                {product.stock <= (product.minStock || 0) && (
                                  <Badge variant="destructive" className="absolute top-2 right-2 text-xs">Rendah</Badge>
                                )}
                              </div>
                              <div className="p-2.5">
                                <h4 className="text-xs line-clamp-2 min-h-[2.5rem] mb-1 font-medium">{product.name}</h4>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-primary">{formatRupiah(product.price)}</span>
                                  <Badge variant="outline" className="text-xs">{product.stock}</Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {filteredProducts.length === 0 && (
                          <div className="text-center py-16 col-span-full">
                            <Package className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                            <p className="text-muted-foreground">Produk tidak ditemukan</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* KANAN: KERANJANG */}
            <div className="h-full flex flex-col">
              <Card className="border-2 shadow-lg h-full flex flex-col">
                <CardHeader className="bg-primary/5 pb-4 flex-shrink-0 border-b">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-base">Keranjang</p>
                        <p className="text-xs text-muted-foreground font-normal">{cart.length} item</p>
                      </div>
                    </div>
                    {cart.length > 0 && (
                      <Button size="sm" variant="ghost" onClick={clearCart} className="text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                    )}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
                  <ScrollArea className="flex-1 px-4 py-3">
                    {cart.length === 0 ? (
                      <div className="text-center py-10 h-full flex flex-col items-center justify-center">
                        <ShoppingCart className="w-12 h-12 text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400">Keranjang kosong</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cart.map((item) => (
                          <div key={item.productId} className="bg-white rounded-lg p-3 border hover:border-primary/50">
                            <div className="flex justify-between mb-2">
                              <div className="pr-2">
                                <h4 className="text-sm font-medium line-clamp-1">{item.productName}</h4>
                                <p className="text-xs text-muted-foreground">@ {formatRupiah(item.price)}</p>
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => removeFromCart(item.productId)} className="text-red-500 h-6 w-6 p-0"><X className="w-3.5 h-3.5" /></Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 bg-gray-50 rounded-md border">
                                <Button size="sm" variant="ghost" onClick={() => updateQuantity(item.productId, -1)} className="h-7 w-7 p-0"><Minus className="w-3 h-3" /></Button>
                                <span className="text-sm w-8 text-center font-medium">{item.quantity}</span>
                                <Button size="sm" variant="ghost" onClick={() => updateQuantity(item.productId, 1)} className="h-7 w-7 p-0"><Plus className="w-3 h-3" /></Button>
                              </div>
                              <span className="font-semibold text-primary text-sm">{formatRupiah(item.subtotal)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  {/* CHECKOUT AREA */}
                  {cart.length > 0 && (
                    <div className="border-t p-4 space-y-3 bg-white flex-shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Pembayaran</label>
                        <div className="grid grid-cols-3 gap-2">
                          {paymentMethodOptions.map((opt) => {
                            const Icon = opt.icon;
                            return (
                              <Button
                                key={opt.value}
                                variant={paymentMethod === opt.value ? 'default' : 'outline'}
                                className={`flex flex-col h-12 ${paymentMethod === opt.value ? 'bg-primary text-white' : ''}`}
                                onClick={() => setPaymentMethod(opt.value as any)}
                              >
                                <Icon className="w-4 h-4 mb-0.5" />
                                <span className="text-[10px]">{opt.label}</span>
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1 pt-2 border-t">
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Subtotal</span><span>{formatRupiah(calculateSubtotal())}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-gray-500">PPN (11%)</span><span>{formatRupiah(calculateTax())}</span></div>
                        <div className="flex justify-between pt-2 border-t mt-2">
                          <span className="font-bold">Total</span>
                          <span className="text-lg font-bold text-primary">{formatRupiah(calculateTotal())}</span>
                        </div>
                      </div>

                      <Button className="w-full bg-primary hover:bg-primary/90" onClick={processTransaction}>
                        <Check className="w-4 h-4 mr-2" /> Bayar Sekarang
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history" className="mt-6">
          <Card className="border-2 shadow-lg">
            <CardHeader><CardTitle>Riwayat Transaksi</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                 <div className="py-10 text-center"><Loader2 className="animate-spin inline w-8 h-8 text-primary"/></div>
              ) : transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="border-2 rounded-xl p-4 hover:border-primary/50 transition-colors bg-white">
                      <div className="flex items-start justify-between mb-3 pb-3 border-b">
                        <div>
                          <p className="font-semibold text-lg">{transaction.id}</p>
                          <p className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleString('id-ID')}</p>
                          <p className="text-xs text-muted-foreground mt-1">Kasir: {transaction.cashierName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">{formatRupiah(transaction.total)}</p>
                          <Badge variant="outline" className="mt-1 border-primary text-primary capitalize">{transaction.paymentMethod}</Badge>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded p-2 text-sm">
                        <p className="font-medium text-xs text-gray-500 mb-1">Item Dibeli:</p>
                        {transaction.items.map((item, idx) => (
                           <div key={idx} className="flex justify-between text-xs py-0.5">
                              <span>{item.productName} (x{item.quantity})</span>
                              <span>{formatRupiah(item.subtotal)}</span>
                           </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-muted-foreground">Belum ada transaksi</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* RECEIPT DIALOG */}
      <Dialog open={receiptDialog} onOpenChange={setReceiptDialog}>
        <DialogContent className="max-w-md">
          <DialogTitle className="sr-only">Struk</DialogTitle>
          <DialogDescription className="sr-only">Detail Pembayaran</DialogDescription>
          {lastTransaction && (
            <div className="space-y-6">
              <div className="text-center border-b pb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">Pembayaran Berhasil!</h2>
              </div>
              
              <div className="space-y-4">
                <div className="bg-secondary rounded-xl p-4 space-y-2 text-sm">
                   <div className="flex justify-between"><span className="text-gray-500">No. Inv</span><span className="font-mono font-bold">{lastTransaction.id}</span></div>
                   <div className="flex justify-between"><span className="text-gray-500">Tanggal</span><span>{new Date().toLocaleDateString('id-ID')}</span></div>
                   <div className="flex justify-between"><span className="text-gray-500">Kasir</span><span>{lastTransaction.cashierName}</span></div>
                </div>

                <div className="bg-white border rounded-xl p-4">
                   <div className="flex justify-between items-center mb-2">
                      <span className="font-bold">Total Bayar</span>
                      <span className="text-xl font-bold text-primary">{formatRupiah(lastTransaction.total)}</span>
                   </div>
                   <Badge className="bg-primary capitalize">{lastTransaction.paymentMethod}</Badge>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => window.print()}><Receipt className="w-4 h-4 mr-2" /> Cetak</Button>
                <Button className="flex-1 bg-primary" onClick={() => setReceiptDialog(false)}>Selesai</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};