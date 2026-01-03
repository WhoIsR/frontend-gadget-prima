import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Product, Transaction, TransactionItem } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { 
  Search, 
  Minus, 
  Plus, 
  Trash2, 
  CreditCard, 
  Wallet, 
  Banknote,
  Receipt,
  Clock,
  Calendar,
  User,
  X,
  Check,
  Package,
  History,
  ShoppingBag,
  ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { formatRupiah } from '../utils/currency';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { ScrollArea } from './ui/scroll-area';

export const Transactions = () => {
  const { user } = useAuth();
  const { getItem, setItem } = useLocalStorage();
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'e-wallet'>('cash');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  const TAX_RATE = 0.11; // 11% PPN

  useEffect(() => {
    const storedProducts = getItem('products') || [];
    const storedTransactions = getItem('transactions') || [];
    setProducts(storedProducts);
    setTransactions(storedTransactions);
  }, []);

  const categories = ['Semua', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(
    (p) =>
      p.stock > 0 &&
      (selectedCategory === 'Semua' || p.category === selectedCategory) &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id);

    if (existingItem) {
      if (existingItem.quantity + 1 > product.stock) {
        toast.error('Stok tidak mencukupi');
        return;
      }
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.price,
              }
            : item
        )
      );
    } else {
      const newItem: TransactionItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        subtotal: product.price,
      };
      setCart([...cart, newItem]);
    }
    
    toast.success(`${product.name} ditambahkan`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const updatedCart = cart.map((item) => {
      if (item.productId === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return null;
        if (newQuantity > product.stock) {
          toast.error('Stok tidak mencukupi');
          return item;
        }
        return {
          ...item,
          quantity: newQuantity,
          subtotal: newQuantity * item.price,
        };
      }
      return item;
    }).filter(Boolean) as TransactionItem[];

    setCart(updatedCart);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * TAX_RATE;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const clearCart = () => {
    setCart([]);
    setPaymentMethod('cash');
  };

  const processTransaction = () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }

    // Check stock availability
    for (const item of cart) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        toast.error(`Stok tidak mencukupi untuk ${item.productName}`);
        return;
      }
    }

    // Update product stock
    const updatedProducts = products.map((product) => {
      const cartItem = cart.find((item) => item.productId === product.id);
      if (cartItem) {
        return {
          ...product,
          stock: product.stock - cartItem.quantity,
        };
      }
      return product;
    });

    // Create transaction
    const newTransaction: Transaction = {
      id: `TRX${Date.now().toString().slice(-8)}`,
      date: new Date().toISOString(),
      items: cart,
      total: calculateTotal(),
      cashierId: user?.id || '',
      cashierName: user?.name || '',
      paymentMethod: paymentMethod,
    };

    const updatedTransactions = [newTransaction, ...transactions];

    // Save to localStorage
    setProducts(updatedProducts);
    setTransactions(updatedTransactions);
    setItem('products', updatedProducts);
    setItem('transactions', updatedTransactions);

    // Show receipt
    setLastTransaction(newTransaction);
    setReceiptDialog(true);

    // Reset cart
    clearCart();
    toast.success('Pembayaran berhasil!');
  };

  const paymentMethodOptions = [
    { value: 'cash', label: 'Tunai', icon: Banknote },
    { value: 'card', label: 'Kartu', icon: CreditCard },
    { value: 'e-wallet', label: 'E-Wallet', icon: Wallet },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2">Kasir & Transaksi</h2>
        <p className="text-muted-foreground">Proses penjualan dan lihat riwayat transaksi</p>
      </div>

      <Tabs defaultValue="pos" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pos" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Kasir
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Riwayat
          </TabsTrigger>
        </TabsList>

        {/* POS Tab */}
        <TabsContent value="pos" className="mt-6">
          <div className="grid grid-cols-[1fr_400px] gap-6 h-[calc(100vh-12rem)]">
            {/* Left Side - Product Selection */}
            <div className="flex flex-col h-full space-y-4">
              {/* Search and Filter Card */}
              <Card className="border-2 shadow-md flex-shrink-0">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Cari produk berdasarkan nama, SKU, atau merek..."
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

              {/* Products Grid */}
              <Card className="border-2 shadow-md flex-1 overflow-hidden">
                <CardContent className="p-4 h-full">
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
                                <ImageWithFallback
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-10 h-10 text-gray-300" />
                                </div>
                              )}
                              {product.stock <= product.minStock && (
                                <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
                                  Rendah
                                </Badge>
                              )}
                            </div>
                            <div className="p-2.5">
                              <h4 className="text-xs line-clamp-2 min-h-[2.5rem] mb-1">
                                {product.name}
                              </h4>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-primary">
                                  {formatRupiah(product.price)}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {product.stock}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {filteredProducts.length === 0 && (
                        <div className="text-center py-16">
                          <Package className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                          <p className="text-muted-foreground">Tidak ada produk ditemukan</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Cart */}
            <div className="h-full">
              <Card className="border-2 shadow-lg sticky top-24 h-[calc(100vh-7rem)]">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p>Keranjang Belanja</p>
                        <p className="text-xs text-muted-foreground font-normal mt-0.5">
                          {cart.length} item
                        </p>
                      </div>
                    </div>
                    {cart.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearCart}
                        className="text-destructive hover:text-destructive hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                  {/* Cart Items */}
                  <ScrollArea className="h-[calc(100vh-32rem)] px-4 py-3">
                    {cart.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <ShoppingCart className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-sm text-muted-foreground">Keranjang kosong</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Klik produk untuk menambahkan
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cart.map((item) => (
                          <div
                            key={item.productId}
                            className="bg-secondary/30 rounded-lg p-3 border hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 pr-2">
                                <h4 className="text-sm font-medium line-clamp-2">
                                  {item.productName}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  @ {formatRupiah(item.price)}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFromCart(item.productId)}
                                className="text-destructive hover:text-destructive hover:bg-red-50 h-6 w-6 p-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 bg-white rounded-md border">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateQuantity(item.productId, -1)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </Button>
                                <span className="text-sm w-10 text-center font-medium">
                                  {item.quantity}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateQuantity(item.productId, 1)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                              <span className="font-semibold text-primary">
                                {formatRupiah(item.subtotal)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  {/* Checkout Section */}
                  {cart.length > 0 && (
                    <div className="border-t p-4 space-y-3 bg-white">
                      {/* Payment Method */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium">
                          Metode Pembayaran
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {paymentMethodOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                              <Button
                                key={option.value}
                                variant={paymentMethod === option.value ? 'default' : 'outline'}
                                className={`flex flex-col items-center justify-center h-14 ${
                                  paymentMethod === option.value
                                    ? 'bg-primary text-white'
                                    : ''
                                }`}
                                onClick={() => setPaymentMethod(option.value as any)}
                              >
                                <Icon className="w-4 h-4 mb-1" />
                                <span className="text-xs">{option.label}</span>
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Price Summary */}
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{formatRupiah(calculateSubtotal())}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">PPN (11%)</span>
                          <span>{formatRupiah(calculateTax())}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="font-semibold">Total</span>
                          <span className="text-xl font-bold text-primary">
                            {formatRupiah(calculateTotal())}
                          </span>
                        </div>
                      </div>

                      {/* Pay Button */}
                      <Button
                        className="w-full bg-primary hover:bg-primary/90 h-11"
                        onClick={processTransaction}
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Proses Pembayaran
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Transaction History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle>Riwayat Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="border-2 rounded-xl p-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3 pb-3 border-b">
                        <div>
                          <p className="font-semibold text-lg">{transaction.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.date).toLocaleString('id-ID', {
                              dateStyle: 'long',
                              timeStyle: 'short',
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Kasir: {transaction.cashierName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {formatRupiah(transaction.total)}
                          </p>
                          <Badge variant="outline" className="mt-2 border-primary text-primary">
                            {transaction.paymentMethod === 'cash' && 'Tunai'}
                            {transaction.paymentMethod === 'card' && 'Kartu'}
                            {transaction.paymentMethod === 'e-wallet' && 'E-Wallet'}
                          </Badge>
                        </div>
                      </div>

                      {/* Transaction Items */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Item yang dibeli:
                        </p>
                        <div className="rounded-lg border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Produk</TableHead>
                                <TableHead className="text-center">Jumlah</TableHead>
                                <TableHead className="text-right">Harga</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {transaction.items.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">
                                    {item.productName}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {item.quantity}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatRupiah(item.price)}
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">
                                    {formatRupiah(item.subtotal)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
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

      {/* Receipt Dialog */}
      <Dialog open={receiptDialog} onOpenChange={setReceiptDialog}>
        <DialogContent className="max-w-md">
          <DialogTitle className="sr-only">Struk Pembayaran</DialogTitle>
          <DialogDescription className="sr-only">
            Detail transaksi dan struk pembelian Anda
          </DialogDescription>
          {lastTransaction && (
            <div className="space-y-6">
              {/* Receipt Header */}
              <div className="text-center border-b border-border pb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">Pembayaran Berhasil!</h2>
                <p className="text-muted-foreground">Terima kasih atas pembelian Anda</p>
              </div>

              {/* Receipt Details */}
              <div className="space-y-4">
                <div className="bg-secondary rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Receipt className="w-4 h-4" />
                      No. Transaksi
                    </span>
                    <span className="font-mono font-semibold">{lastTransaction.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Tanggal
                    </span>
                    <span>{new Date(lastTransaction.date).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Waktu
                    </span>
                    <span>{new Date(lastTransaction.date).toLocaleTimeString('id-ID')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Kasir
                    </span>
                    <span>{lastTransaction.cashierName}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Detail Pembelian</h3>
                  <div className="bg-secondary rounded-xl p-4 space-y-2">
                    {lastTransaction.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex-1">
                          <p className="line-clamp-1">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} x {formatRupiah(item.price)}
                          </p>
                        </div>
                        <span className="font-medium ml-2">{formatRupiah(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="bg-primary/10 rounded-xl p-4 border-2 border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total Pembayaran</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatRupiah(lastTransaction.total)}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-primary/20">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Metode Pembayaran</span>
                      <Badge className="bg-primary">
                        {lastTransaction.paymentMethod === 'cash' && 'Tunai'}
                        {lastTransaction.paymentMethod === 'card' && 'Kartu'}
                        {lastTransaction.paymentMethod === 'e-wallet' && 'E-Wallet'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.print()}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Cetak
                </Button>
                <Button
                  className="flex-1 bg-primary"
                  onClick={() => setReceiptDialog(false)}
                >
                  Selesai
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
