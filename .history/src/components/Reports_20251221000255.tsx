import { useEffect, useState } from 'react';
import axios from 'axios';
import { Transaction, Product, Expense } from '../types'; // Tambah Expense
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { formatRupiah } from '../utils/currency';
import {
  Calendar as CalendarIcon,
  Printer,
  FileText,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Package,
  Download,
  Filter,
  History,
  PieChart as PieChartIcon,
  BarChart3,
  Wallet,
  CreditCard,
  Banknote,
  Users,
  AlertCircle,
  Info,
  Calculator,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ComposedChart } from 'recharts';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { toast } from 'sonner';

export const Reports = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]); // State baru buat pengeluaran
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [datePickerOpen, setDatePickerOpen] = useState<'start' | 'end' | null>(null);

  // --- FETCH DATA (TRANSAKSI, PRODUK, & PENGELUARAN) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transRes, prodRes, expRes] = await Promise.all([
          axios.get('http://127.0.0.1:8000/api/transactions'),
          axios.get('http://127.0.0.1:8000/api/products'),
          axios.get('http://127.0.0.1:8000/api/expenses') // Ambil data pengeluaran
        ]);

        setTransactions(transRes.data.data);
        
        // Mapping Produk
        const mappedProducts = prodRes.data.data.map((p: any) => ({
          ...p,
          purchasePrice: p.buy_price || p.purchasePrice || 0,
          minStock: p.min_stock || p.minStock || 0
        }));
        setProducts(mappedProducts);

        // Simpan Pengeluaran
        setExpenses(expRes.data.data);

        // Default Date Range (30 Hari Terakhir)
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        setEndDate(today);
        setStartDate(thirtyDaysAgo);

      } catch (error) {
        console.error("Gagal memuat laporan:", error);
        toast.error("Gagal mengambil data laporan");
      }
    };

    fetchData();
  }, []);

  // --- LOGIC FILTERING & KALKULASI ---

  // 1. Filter Transaksi
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    return transactionDate >= start && transactionDate <= end;
  });

  // 2. Filter Pengeluaran (Expense) berdasarkan tanggal
  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    return expenseDate >= start && expenseDate <= end;
  });

  // Hitung Total Pendapatan
  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalTransactions = filteredTransactions.length;
  const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Hitung HPP (Modal Barang Terjual)
  const totalCOGS = filteredTransactions.reduce((sum, transaction) => {
    return sum + transaction.items.reduce((itemSum, item) => {
      const product = products.find(p => String(p.id) === String(item.productId));
      // @ts-ignore
      const purchasePrice = product?.purchasePrice || (item.price * 0.60); 
      return itemSum + (purchasePrice * item.quantity);
    }, 0);
  }, 0);

  // Hitung Laba Kotor
  const grossProfit = totalRevenue - totalCOGS;
  const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Hitung Biaya Operasional (REAL DATA)
  const operatingExpenses = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  
  // Hitung Laba Bersih
  const netProfit = grossProfit - operatingExpenses;
  const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Ratio Expense vs Pendapatan
  const operatingExpenseRatio = totalRevenue > 0 ? (operatingExpenses / totalRevenue) * 100 : 0;

  // Total Barang Terjual & Nilai Stok
  const totalItemsSold = filteredTransactions.reduce((sum, transaction) => {
    return sum + transaction.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
  }, 0);
  const totalStockValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  // --- SISA LOGIC UNTUK CHART & DETAIL (TIDAK BERUBAH) ---
  const paymentMethodStats = filteredTransactions.reduce((acc, transaction) => {
    const method = transaction.paymentMethod;
    if (!acc[method]) {
      acc[method] = { total: 0, count: 0, transactions: [] };
    }
    acc[method].total += transaction.total;
    acc[method].count += 1;
    acc[method].transactions.push(transaction);
    return acc;
  }, {} as Record<string, { total: number; count: number; transactions: Transaction[] }>);

  const paymentMethodData = Object.entries(paymentMethodStats).map(([method, data]) => ({
    method: method === 'cash' ? 'Tunai' : method === 'card' ? 'Kartu Debit/Kredit' : 'E-Wallet',
    methodKey: method,
    total: data.total,
    count: data.count,
    average: data.total / data.count,
  }));

  // Daily Sales Map (Updated with Expenses logic? Maybe later. For now focus on P&L)
  const dailySalesMap = filteredTransactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    if (!acc[date]) {
      acc[date] = { date, revenue: 0, count: 0, profit: 0, cogs: 0, items: 0, averageValue: 0 };
    }
    const transactionCOGS = transaction.items.reduce((sum, item) => {
      const product = products.find(p => String(p.id) === String(item.productId));
      // @ts-ignore
      const purchasePrice = product?.purchasePrice || (item.price * 0.60);
      return sum + (purchasePrice * item.quantity);
    }, 0);
    acc[date].revenue += transaction.total;
    acc[date].cogs += transactionCOGS;
    acc[date].profit += transaction.total - transactionCOGS;
    acc[date].count += 1;
    acc[date].items += transaction.items.reduce((sum, item) => sum + item.quantity, 0);
    return acc;
  }, {} as Record<string, any>);

  const dailySalesData = Object.values(dailySalesMap).sort((a, b) => 0); // Simplified sort

  // Top Products
  const productSalesMap = filteredTransactions.reduce((acc, transaction) => {
    transaction.items.forEach(item => {
      if (!acc[item.productId]) {
        const product = products.find(p => String(p.id) === String(item.productId));
        acc[item.productId] = {
          // @ts-ignore
          id: item.productId,
          name: item.productName,
          quantity: 0,
          revenue: 0,
          profit: 0,
          // @ts-ignore
          category: product?.category || 'Unknown',
          transactions: 0,
        };
      }
      const product = products.find(p => String(p.id) === String(item.productId));
      // @ts-ignore
      const purchasePrice = product?.purchasePrice || (item.price * 0.60);
      const itemCOGS = purchasePrice * item.quantity;
      acc[item.productId].quantity += item.quantity;
      acc[item.productId].revenue += item.subtotal;
      acc[item.productId].profit += item.subtotal - itemCOGS;
      acc[item.productId].transactions += 1;
    });
    return acc;
  }, {} as Record<string, any>);

  const topProducts = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Category Breakdown
  const categoryMap = filteredTransactions.reduce((acc, transaction) => {
    transaction.items.forEach(item => {
      const product = products.find(p => String(p.id) === String(item.productId));
      if (product) {
        const category = product.category;
        if (!acc[category]) {
          acc[category] = { category, revenue: 0, count: 0, profit: 0, cogs: 0, uniqueProducts: 0, products: new Set() };
        }
        // @ts-ignore
        const purchasePrice = product.purchasePrice || (item.price * 0.60);
        const itemCOGS = purchasePrice * item.quantity;
        acc[category].revenue += item.subtotal;
        acc[category].cogs += itemCOGS;
        acc[category].profit += item.subtotal - itemCOGS;
        acc[category].count += item.quantity;
        acc[category].products.add(String(item.productId));
      }
    });
    return acc;
  }, {} as Record<string, any>);

  const categoryData = Object.values(categoryMap).map(cat => ({
    ...cat,
    uniqueProducts: cat.products.size,
    profitMargin: (cat.profit / cat.revenue) * 100,
  })).sort((a, b) => b.revenue - a.revenue);

  // Helper Functions
  const handlePrint = () => window.print();
  
  const handleQuickRange = (days: number) => {
    const today = new Date();
    const past = new Date(today);
    past.setDate(past.getDate() - days);
    setEndDate(today);
    setStartDate(past);
  };

  const handleExport = () => {
    const headers = ['No. Transaksi', 'Tanggal', 'Waktu', 'Kasir', 'Metode', 'Total (Rp)', 'Item Terjual'];
    const rows = filteredTransactions.map(t => {
      const date = new Date(t.date);
      const itemCount = t.items.reduce((sum, item) => sum + item.quantity, 0);
      return [
        t.id,
        format(date, 'dd/MM/yyyy', { locale: id }),
        format(date, 'HH:mm', { locale: id }),
        `"${t.cashierName}"`,
        t.paymentMethod,
        t.total,
        itemCount
      ].join(';');
    });
    const csvContent = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Laporan_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const COLORS = ['#2563eb', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'];

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page { margin: 20mm; size: auto; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          ::-webkit-scrollbar { display: none; }
        }
      `}</style>

      <div className="print-area">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="mb-2 text-2xl font-bold">Laporan & Analisis</h2>
            <p className="text-muted-foreground">Laporan komprehensif penjualan, keuangan, dan performa bisnis</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button onClick={handleExport} variant="outline" className="border-primary text-primary">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Button onClick={handlePrint} className="bg-primary">
              <Printer className="w-4 h-4 mr-2" /> Cetak
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <Card className="border-2 shadow-lg print:hidden mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" /> Filter Periode Laporan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Popover open={datePickerOpen === 'start'} onOpenChange={(open) => setDatePickerOpen(open ? 'start' : null)}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left border-2">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'dd MMMM yyyy', { locale: id }) : 'Pilih tanggal mulai'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={(date) => { setStartDate(date); setDatePickerOpen(null); }} initialFocus locale={id} />
                  </PopoverContent>
                </Popover>
                <Popover open={datePickerOpen === 'end'} onOpenChange={(open) => setDatePickerOpen(open ? 'end' : null)}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left border-2">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'dd MMMM yyyy', { locale: id }) : 'Pilih tanggal akhir'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={(date) => { setEndDate(date); setDatePickerOpen(null); }} initialFocus locale={id} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-wrap gap-2">
                {[7, 30, 90].map(days => (
                  <Button key={days} variant="outline" size="sm" onClick={() => handleQuickRange(days)}>
                    {days} Hari Terakhir
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Print Header */}
        <div className="hidden print:block mb-6 mt-6">
          <div className="text-center border-b-2 border-black pb-4">
            <h1 className="text-2xl font-bold">Gadget Prima POS System</h1>
            <p className="text-lg">Laporan Keuangan Real-Time</p>
            <p className="text-sm mt-2">Periode: {startDate ? format(startDate, 'dd MMM yyyy', { locale: id }) : '-'} s/d {endDate ? format(endDate, 'dd MMM yyyy', { locale: id }) : '-'}</p>
          </div>
        </div>

        <Tabs defaultValue="financial" className="w-full mt-6">
          <TabsList className="grid w-full grid-cols-3 mb-6 print:hidden">
            <TabsTrigger value="financial"><DollarSign className="w-4 h-4 mr-2" />Keuangan (P&L)</TabsTrigger>
            <TabsTrigger value="products"><Package className="w-4 h-4 mr-2" />Produk</TabsTrigger>
            <TabsTrigger value="transactions"><History className="w-4 h-4 mr-2" />Transaksi</TabsTrigger>
          </TabsList>

          {/* FINANCIAL TAB (YANG PALING PENTING) */}
          <TabsContent value="financial" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-2 shadow-lg">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Pendapatan Kotor</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-primary">{formatRupiah(totalRevenue)}</div></CardContent>
              </Card>
              <Card className="border-2 shadow-lg">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Laba Kotor</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-green-600">{formatRupiah(grossProfit)}</div></CardContent>
              </Card>
              <Card className="border-2 shadow-lg">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Biaya Operasional</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-orange-600">{formatRupiah(operatingExpenses)}</div></CardContent>
              </Card>
              <Card className="border-2 shadow-lg">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Laba Bersih</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-blue-600">{formatRupiah(netProfit)}</div></CardContent>
              </Card>
            </div>

            {/* Income Statement Detailed */}
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Laporan Laba Rugi (Income Statement)</CardTitle>
                <CardDescription>Analisis keuangan berdasarkan data transaksi dan pengeluaran aktual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Revenue */}
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-green-700">Pendapatan Penjualan</p>
                      <p className="text-xs text-green-600 mt-1">{totalTransactions} transaksi berhasil</p>
                    </div>
                    <p className="text-2xl font-bold text-green-700">{formatRupiah(totalRevenue)}</p>
                  </div>

                  <Separator />

                  {/* COGS */}
                  <div className="border-l-4 border-red-500 pl-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-red-700">Harga Pokok Penjualan (HPP)</p>
                      <p className="text-xs text-muted-foreground">Total modal produk terjual</p>
                    </div>
                    <p className="text-xl font-semibold text-red-600">- {formatRupiah(totalCOGS)}</p>
                  </div>

                  {/* Gross Profit */}
                  <div className="pl-4 flex justify-between items-center">
                    <p className="font-semibold text-blue-800">Laba Kotor</p>
                    <p className="text-xl font-bold text-blue-700">{formatRupiah(grossProfit)}</p>
                  </div>

                  <Separator className="border-dashed" />

                  {/* Operating Expenses (DYNAMIC) */}
                  <div className="border-l-4 border-orange-500 pl-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-orange-700">Biaya Operasional (Aktual)</p>
                        <p className="text-xs text-muted-foreground">Total pengeluaran tercatat di sistem</p>
                      </div>
                      <p className="text-xl font-semibold text-orange-600">- {formatRupiah(operatingExpenses)}</p>
                    </div>
                    
                    {/* Detail Expense Items */}
                    {filteredExpenses.length > 0 ? (
                      <div className="ml-2 space-y-1">
                        {filteredExpenses.map((exp, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                            <span>• {exp.description} ({format(new Date(exp.date), 'dd/MM')})</span>
                            <span>{formatRupiah(exp.amount)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic ml-2">Belum ada data pengeluaran di periode ini.</p>
                    )}
                  </div>

                  <Separator className="border-dashed" />

                  {/* Net Profit */}
                  <div className="p-5 rounded-lg bg-gradient-to-r from-primary/10 to-primary/20 border-2 border-primary flex justify-between items-center">
                    <div>
                      <p className="font-bold text-primary">Laba Bersih (Net Profit)</p>
                      <p className="text-xs text-primary/80 mt-1">Margin: {netProfitMargin.toFixed(2)}%</p>
                    </div>
                    <p className="text-3xl font-bold text-primary">{formatRupiah(netProfit)}</p>
                  </div>

                  {/* Info Box Updated */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex gap-2">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Status Laporan:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Pendapatan berdasarkan transaksi real-time.</li>
                          <li>Biaya operasional berdasarkan data yang diinput di menu Pengaturan.</li>
                          <li>Jika HPP produk Rp 0, pastikan Anda sudah mengisi "Harga Beli" saat edit produk.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary Ratios */}
            <Card className="border-2 shadow-lg">
              <CardHeader><CardTitle>Rasio Keuangan</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded bg-gray-50">
                    <p className="text-xs text-gray-500">Gross Margin</p>
                    <p className="text-xl font-bold text-green-600">{grossProfitMargin.toFixed(2)}%</p>
                  </div>
                  <div className="p-4 border rounded bg-gray-50">
                    <p className="text-xs text-gray-500">Expense Ratio</p>
                    <p className="text-xl font-bold text-orange-600">{operatingExpenseRatio.toFixed(2)}%</p>
                  </div>
                  <div className="p-4 border rounded bg-gray-50">
                    <p className="text-xs text-gray-500">Net Profit Margin</p>
                    <p className="text-xl font-bold text-blue-600">{netProfitMargin.toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PRODUCTS TAB (Simple View) */}
          <TabsContent value="products">
            <Card className="border-2 shadow-lg">
              <CardHeader><CardTitle>Produk Terlaris</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead>Terjual</TableHead>
                      <TableHead className="text-right">Pendapatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{p.quantity}</TableCell>
                        <TableCell className="text-right">{formatRupiah(p.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TRANSACTIONS TAB */}
          <TabsContent value="transactions">
            <Card className="border-2 shadow-lg">
              <CardHeader><CardTitle>Riwayat Transaksi</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Kasir</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono">{t.id}</TableCell>
                        <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                        <TableCell>{t.cashierName}</TableCell>
                        <TableCell className="text-right font-bold">{formatRupiah(t.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};