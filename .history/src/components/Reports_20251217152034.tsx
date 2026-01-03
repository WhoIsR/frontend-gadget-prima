import { useEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Transaction, Product } from '../types';
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
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
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

export const Reports = () => {
  const { getItem } = useLocalStorage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [datePickerOpen, setDatePickerOpen] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    const storedTransactions = getItem('transactions') || [];
    const storedProducts = getItem('products') || [];
    setTransactions(storedTransactions);
    setProducts(storedProducts);

    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    setEndDate(today);
    setStartDate(thirtyDaysAgo);
  }, []);

  // Filter transactions by date range
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();
    
    end.setHours(23, 59, 59, 999);
    
    return transactionDate >= start && transactionDate <= end;
  });

  // Calculate metrics
  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalTransactions = filteredTransactions.length;
  const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Calculate COGS (Cost of Goods Sold) - using actual purchase prices
  const totalCOGS = filteredTransactions.reduce((sum, transaction) => {
    return sum + transaction.items.reduce((itemSum, item) => {
      const product = products.find(p => p.id === item.productId);
      const purchasePrice = product?.purchasePrice || (item.price * 0.60); // Fallback to 60% if no purchase price
      return itemSum + (purchasePrice * item.quantity);
    }, 0);
  }, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Operating expenses estimation (rent, utilities, salaries, etc.) - 15% of revenue
  const OPERATING_EXPENSE_PERCENTAGE = 0.15;
  const operatingExpenses = totalRevenue * OPERATING_EXPENSE_PERCENTAGE;
  const netProfit = grossProfit - operatingExpenses;
  const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Calculate total items sold
  const totalItemsSold = filteredTransactions.reduce((sum, transaction) => {
    return sum + transaction.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
  }, 0);

  // Calculate stock value (current inventory worth)
  const totalStockValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  
  // Calculate total capital invested (stock value represents unsold inventory)
  const totalCapitalInInventory = totalStockValue;

  // Payment method breakdown
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

  // Daily sales data with more details
  const dailySalesMap = filteredTransactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    if (!acc[date]) {
      acc[date] = { 
        date, 
        revenue: 0, 
        count: 0, 
        profit: 0,
        cogs: 0,
        items: 0,
        averageValue: 0
      };
    }
    const transactionCOGS = transaction.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      const purchasePrice = product?.purchasePrice || (item.price * 0.60);
      return sum + (purchasePrice * item.quantity);
    }, 0);
    acc[date].revenue += transaction.total;
    acc[date].cogs += transactionCOGS;
    acc[date].profit += transaction.total - transactionCOGS;
    acc[date].count += 1;
    acc[date].items += transaction.items.reduce((sum, item) => sum + item.quantity, 0);
    return acc;
  }, {} as Record<string, { date: string; revenue: number; count: number; profit: number; cogs: number; items: number; averageValue: number }>);

  const dailySalesData = Object.values(dailySalesMap).map(day => ({
    ...day,
    averageValue: day.count > 0 ? day.revenue / day.count : 0,
  })).sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  // Top selling products with more metrics
  const productSalesMap = filteredTransactions.reduce((acc, transaction) => {
    transaction.items.forEach(item => {
      if (!acc[item.productId]) {
        const product = products.find(p => p.id === item.productId);
        acc[item.productId] = {
          id: item.productId,
          name: item.productName,
          quantity: 0,
          revenue: 0,
          profit: 0,
          cogs: 0,
          transactions: 0,
          category: product?.category || 'Unknown',
          brand: product?.brand || 'Unknown',
          purchasePrice: product?.purchasePrice || 0,
        };
      }
      const product = products.find(p => p.id === item.productId);
      const purchasePrice = product?.purchasePrice || (item.price * 0.60);
      const itemCOGS = purchasePrice * item.quantity;
      
      acc[item.productId].quantity += item.quantity;
      acc[item.productId].revenue += item.subtotal;
      acc[item.productId].cogs += itemCOGS;
      acc[item.productId].profit += item.subtotal - itemCOGS;
      acc[item.productId].transactions += 1;
    });
    return acc;
  }, {} as Record<string, { 
    id: string; 
    name: string; 
    quantity: number; 
    revenue: number; 
    profit: number;
    cogs: number;
    transactions: number;
    category: string;
    brand: string;
    purchasePrice: number;
  }>);

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Category breakdown with comprehensive metrics
  const categoryMap = filteredTransactions.reduce((acc, transaction) => {
    transaction.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const category = product.category;
        if (!acc[category]) {
          acc[category] = { 
            category, 
            revenue: 0, 
            count: 0, 
            profit: 0,
            cogs: 0,
            transactions: 0,
            products: new Set(),
          };
        }
        const purchasePrice = product.purchasePrice || (item.price * 0.60);
        const itemCOGS = purchasePrice * item.quantity;
        
        acc[category].revenue += item.subtotal;
        acc[category].cogs += itemCOGS;
        acc[category].profit += item.subtotal - itemCOGS;
        acc[category].count += item.quantity;
        acc[category].products.add(item.productId);
      }
    });
    return acc;
  }, {} as Record<string, { 
    category: string; 
    revenue: number; 
    count: number; 
    profit: number;
    cogs: number;
    transactions: number;
    products: Set<string>;
  }>);

  const categoryData = Object.values(categoryMap).map(cat => ({
    ...cat,
    uniqueProducts: cat.products.size,
    profitMargin: (cat.profit / cat.revenue) * 100,
  })).sort((a, b) => b.revenue - a.revenue);

  // Hourly analysis
  const hourlyMap = filteredTransactions.reduce((acc, transaction) => {
    const hour = new Date(transaction.date).getHours();
    if (!acc[hour]) {
      acc[hour] = { hour: `${hour}:00`, transactions: 0, revenue: 0 };
    }
    acc[hour].transactions += 1;
    acc[hour].revenue += transaction.total;
    return acc;
  }, {} as Record<number, { hour: string; transactions: number; revenue: number }>);

  const hourlyData = Object.values(hourlyMap).sort((a, b) => 
    parseInt(a.hour) - parseInt(b.hour)
  );

  // Cashier performance
  const cashierMap = filteredTransactions.reduce((acc, transaction) => {
    const cashier = transaction.cashierName;
    if (!acc[cashier]) {
      acc[cashier] = { 
        name: cashier, 
        transactions: 0, 
        revenue: 0,
        items: 0,
      };
    }
    acc[cashier].transactions += 1;
    acc[cashier].revenue += transaction.total;
    acc[cashier].items += transaction.items.reduce((sum, item) => sum + item.quantity, 0);
    return acc;
  }, {} as Record<string, { name: string; transactions: number; revenue: number; items: number }>);

  const cashierData = Object.values(cashierMap).sort((a, b) => b.revenue - a.revenue);

  const COLORS = ['#2563eb', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#f43f5e', '#14b8a6'];

  const handlePrint = () => {
    window.print();
  };

  const handleQuickRange = (days: number) => {
    const today = new Date();
    const past = new Date(today);
    past.setDate(past.getDate() - days);
    
    setEndDate(today);
    setStartDate(past);
  };

  const handleExport = () => {
    let csv = 'No. Transaksi,Tanggal,Waktu,Kasir,Metode Pembayaran,Total,Item Terjual\n';
    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      const itemCount = t.items.reduce((sum, item) => sum + item.quantity, 0);
      csv += `${t.id},${date.toLocaleDateString('id-ID')},${date.toLocaleTimeString('id-ID')},${t.cashierName},${t.paymentMethod === 'cash' ? 'Tunai' : t.paymentMethod === 'card' ? 'Kartu' : 'E-Wallet'},${t.total},${itemCount}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="mb-2">Laporan & Analisis</h2>
          <p className="text-muted-foreground">Laporan komprehensif penjualan, keuangan, dan performa bisnis</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handlePrint} className="bg-primary print:hidden">
            <Printer className="w-4 h-4 mr-2" />
            Cetak
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="border-2 shadow-lg print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Periode Laporan
          </CardTitle>
          <CardDescription>
            Pilih rentang tanggal untuk melihat laporan terperinci
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Popover open={datePickerOpen === 'start'} onOpenChange={(open) => setDatePickerOpen(open ? 'start' : null)}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left border-2 h-11"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'dd MMMM yyyy', { locale: id }) : 'Pilih tanggal'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        setDatePickerOpen(null);
                      }}
                      initialFocus
                      locale={id}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Tanggal Selesai</Label>
                <Popover open={datePickerOpen === 'end'} onOpenChange={(open) => setDatePickerOpen(open ? 'end' : null)}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left border-2 h-11"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'dd MMMM yyyy', { locale: id }) : 'Pilih tanggal'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date);
                        setDatePickerOpen(null);
                      }}
                      initialFocus
                      locale={id}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => handleQuickRange(7)} className="border-primary text-primary hover:bg-primary hover:text-white">
                7 Hari Terakhir
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickRange(30)} className="border-primary text-primary hover:bg-primary hover:text-white">
                30 Hari Terakhir
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickRange(90)} className="border-primary text-primary hover:bg-primary hover:text-white">
                90 Hari Terakhir
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const today = new Date();
                const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                setStartDate(firstDayOfMonth);
                setEndDate(today);
              }} className="border-primary text-primary hover:bg-primary hover:text-white">
                Bulan Ini
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const today = new Date();
                const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
                setStartDate(firstDayOfYear);
                setEndDate(today);
              }} className="border-primary text-primary hover:bg-primary hover:text-white">
                Tahun Ini
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Header */}
      <div className="hidden print:block mb-6">
        <div className="text-center border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold">Gadget Prima POS System</h1>
          <p className="text-lg">Laporan Penjualan & Keuangan Komprehensif</p>
          <p className="text-sm mt-2">
            Periode: {startDate ? format(startDate, 'dd MMMM yyyy', { locale: id }) : '-'} sampai {endDate ? format(endDate, 'dd MMMM yyyy', { locale: id }) : '-'}
          </p>
          <p className="text-xs mt-1">
            Dicetak pada: {format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}
          </p>
        </div>
      </div>

      {/* Tabs for Different Reports */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Ringkasan</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Keuangan</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Produk</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Transaksi</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Pendapatan</CardTitle>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatRupiah(totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">Penjualan kotor periode ini</p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Transaksi</CardTitle>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{totalTransactions}</div>
                <p className="text-xs text-muted-foreground mt-1">Transaksi berhasil diselesaikan</p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Rata-rata per Transaksi</CardTitle>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatRupiah(averageTransaction)}</div>
                <p className="text-xs text-muted-foreground mt-1">Nilai rata-rata per transaksi</p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Item Terjual</CardTitle>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{totalItemsSold}</div>
                <p className="text-xs text-muted-foreground mt-1">Unit produk terjual</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle>Grafik Penjualan Harian</CardTitle>
                <CardDescription>Pendapatan dan jumlah transaksi per hari</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={dailySalesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis yAxisId="left" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === 'Pendapatan') return formatRupiah(value);
                        return value;
                      }}
                      contentStyle={{ backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#2563eb" name="Pendapatan" radius={[8, 8, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} name="Transaksi" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle>Distribusi per Kategori</CardTitle>
                <CardDescription>Pendapatan berdasarkan kategori produk</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, revenue }) => {
                        const percentage = (revenue / totalRevenue) * 100;
                        return `${category} (${percentage.toFixed(1)}%)`;
                      }}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatRupiah(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods Detailed */}
          {paymentMethodData.length > 0 && (
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle>Analisis Metode Pembayaran</CardTitle>
                <CardDescription>Perbandingan penggunaan metode pembayaran</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {paymentMethodData.map((item) => {
                    const percentage = (item.total / totalRevenue) * 100;
                    const Icon = item.methodKey === 'cash' ? Banknote : item.methodKey === 'card' ? CreditCard : Wallet;
                    return (
                      <div key={item.method} className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <span className="font-semibold">{item.method}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{item.count} transaksi</Badge>
                                <Badge variant="outline" className="text-xs">
                                  Rata-rata: {formatRupiah(item.average)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary text-xl">{formatRupiah(item.total)}</p>
                            <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}% dari total</p>
                          </div>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hourly Performance */}
          {hourlyData.length > 0 && (
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle>Analisis Waktu Penjualan</CardTitle>
                <CardDescription>Distribusi transaksi berdasarkan jam operasional</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="hour" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === 'Pendapatan') return formatRupiah(value);
                        return value;
                      }}
                      contentStyle={{ backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="transactions" fill="#8b5cf6" name="Jumlah Transaksi" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 flex items-start gap-2">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Grafik ini menunjukkan jam-jam dengan aktivitas penjualan tertinggi, membantu perencanaan shift karyawan dan strategi promosi.
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cashier Performance */}
          {cashierData.length > 0 && (
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle>Performa Kasir</CardTitle>
                <CardDescription>Produktivitas dan kontribusi masing-masing kasir</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cashierData.map((cashier, index) => {
                    const percentage = (cashier.revenue / totalRevenue) * 100;
                    const avgPerTransaction = cashier.revenue / cashier.transactions;
                    return (
                      <div key={cashier.name} className="p-4 rounded-lg border-2 hover:border-primary/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                              index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-primary'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold">{cashier.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {cashier.transactions} transaksi
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {cashier.items} item terjual
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary text-xl">{formatRupiah(cashier.revenue)}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Avg: {formatRupiah(avgPerTransaction)}
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Kontribusi: {percentage.toFixed(1)}% dari total pendapatan
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          {/* Key Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Pendapatan Kotor</CardTitle>
                <TrendingUp className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatRupiah(totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">Total penjualan</p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Laba Kotor</CardTitle>
                <DollarSign className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatRupiah(grossProfit)}</div>
                <p className="text-xs text-muted-foreground mt-1">Margin {grossProfitMargin.toFixed(1)}%</p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Laba Bersih</CardTitle>
                <Calculator className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatRupiah(netProfit)}</div>
                <p className="text-xs text-muted-foreground mt-1">Margin {netProfitMargin.toFixed(1)}%</p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Nilai Stok Tersedia</CardTitle>
                <Package className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{formatRupiah(totalStockValue)}</div>
                <p className="text-xs text-muted-foreground mt-1">Modal dalam inventori</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed P&L Statement */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Laporan Laba Rugi (Income Statement)
              </CardTitle>
              <CardDescription>
                Analisis keuangan mendetail periode {startDate ? format(startDate, 'dd MMM yyyy', { locale: id }) : '-'} - {endDate ? format(endDate, 'dd MMM yyyy', { locale: id }) : '-'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Revenue Section */}
                <div className="p-4 rounded-lg bg-green-50 border-2 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 font-medium">Pendapatan Penjualan</p>
                      <p className="text-xs text-green-600 mt-1">
                        {totalTransactions} transaksi × rata-rata {formatRupiah(averageTransaction)}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-green-700">{formatRupiah(totalRevenue)}</p>
                  </div>
                </div>

                <Separator />

                {/* COGS Section */}
                <div className="border-l-4 border-red-500 pl-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-700">Harga Pokok Penjualan (HPP / COGS)</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Total biaya pembelian produk yang terjual (dari harga beli)
                      </p>
                    </div>
                    <p className="text-xl font-semibold text-red-600">- {formatRupiah(totalCOGS)}</p>
                  </div>
                </div>

                <Separator className="border-dashed" />

                {/* Gross Profit */}
                <div className="p-4 rounded-lg bg-blue-50 border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-blue-800">Laba Kotor (Gross Profit)</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Margin Laba Kotor: {grossProfitMargin.toFixed(2)}%
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{formatRupiah(grossProfit)}</p>
                  </div>
                </div>

                <Separator />

                {/* Operating Expenses */}
                <div className="border-l-4 border-orange-500 pl-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-orange-700">Biaya Operasional</p>
                    <p className="text-xl font-semibold text-orange-600">- {formatRupiah(operatingExpenses)}</p>
                  </div>
                  <div className="space-y-2 ml-4 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>• Gaji & Upah Karyawan (7%)</span>
                      <span>{formatRupiah(totalRevenue * 0.07)}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>• Sewa Toko & Utilitas (5%)</span>
                      <span>{formatRupiah(totalRevenue * 0.05)}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>• Marketing & Operasional (3%)</span>
                      <span>{formatRupiah(totalRevenue * 0.03)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Total estimasi {OPERATING_EXPENSE_PERCENTAGE * 100}% dari pendapatan
                  </p>
                </div>

                <Separator className="border-dashed" />

                {/* Net Profit */}
                <div className="p-5 rounded-lg bg-gradient-to-r from-primary/10 to-primary/20 border-2 border-primary">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-primary">Laba Bersih (Net Profit)</p>
                      <p className="text-xs text-primary/80 mt-1">
                        Margin Laba Bersih: {netProfitMargin.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Keuntungan setelah dikurangi semua biaya
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-primary">{formatRupiah(netProfit)}</p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">Catatan Perhitungan:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>HPP (COGS) dihitung dari harga beli/modal produk yang tercatat di sistem</li>
                        <li>Jika harga beli tidak tersedia, diestimasikan 60% dari harga jual</li>
                        <li>Biaya operasional diestimasikan 15% dari pendapatan total</li>
                        <li>Untuk laporan akurat, pastikan harga beli produk sudah diinput dengan benar</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue vs Profit Trend */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle>Tren Pendapatan, Laba & Biaya</CardTitle>
              <CardDescription>Perbandingan pendapatan, laba kotor, dan HPP harian</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={dailySalesData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCOGS" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    formatter={(value: number) => formatRupiah(value)}
                    contentStyle={{ backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    name="Pendapatan"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorProfit)" 
                    name="Laba Kotor"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cogs" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCOGS)" 
                    name="HPP"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Financial Performance */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle>Analisis Keuangan per Kategori</CardTitle>
              <CardDescription>Performa pendapatan dan laba masing-masing kategori produk</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-center">Unit Terjual</TableHead>
                      <TableHead className="text-right">Pendapatan</TableHead>
                      <TableHead className="text-right">HPP</TableHead>
                      <TableHead className="text-right">Laba Kotor</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryData.map((cat) => (
                      <TableRow key={cat.category}>
                        <TableCell className="font-medium">{cat.category}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{cat.count} unit</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatRupiah(cat.revenue)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatRupiah(cat.cogs)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatRupiah(cat.profit)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="border-green-500 text-green-700">
                            {cat.profitMargin.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-secondary font-semibold">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-center">
                        <Badge>{totalItemsSold} unit</Badge>
                      </TableCell>
                      <TableCell className="text-right text-primary">
                        {formatRupiah(totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatRupiah(totalCOGS)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatRupiah(grossProfit)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-green-600">
                          {grossProfitMargin.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card className="border-2 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
            <CardHeader>
              <CardTitle>Ringkasan Keuangan</CardTitle>
              <CardDescription>Indikator keuangan utama untuk evaluasi bisnis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg shadow-sm border">
                  <p className="text-sm text-muted-foreground mb-1">Return on Sales (ROS)</p>
                  <p className="text-2xl font-bold text-primary">{netProfitMargin.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Laba bersih per rupiah penjualan</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm border">
                  <p className="text-sm text-muted-foreground mb-1">Gross Profit Margin</p>
                  <p className="text-2xl font-bold text-green-600">{grossProfitMargin.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Persentase laba kotor</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm border">
                  <p className="text-sm text-muted-foreground mb-1">Operating Expense Ratio</p>
                  <p className="text-2xl font-bold text-orange-600">{(OPERATING_EXPENSE_PERCENTAGE * 100).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Biaya operasional vs pendapatan</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm border">
                  <p className="text-sm text-muted-foreground mb-1">Inventory Value</p>
                  <p className="text-2xl font-bold text-purple-600">{formatRupiah(totalStockValue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Modal tertanam di inventori</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm border">
                  <p className="text-sm text-muted-foreground mb-1">Average Transaction Value</p>
                  <p className="text-2xl font-bold text-blue-600">{formatRupiah(averageTransaction)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Nilai rata-rata per transaksi</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm border">
                  <p className="text-sm text-muted-foreground mb-1">Items per Transaction</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {totalTransactions > 0 ? (totalItemsSold / totalTransactions).toFixed(1) : '0'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Rata-rata item per transaksi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {/* Top Products */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle>Produk Terlaris (Top 10)</CardTitle>
              <CardDescription>Ranking produk berdasarkan total pendapatan</CardDescription>
            </CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <div className="rounded-lg border-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Rank</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-center">Terjual</TableHead>
                        <TableHead className="text-center">Transaksi</TableHead>
                        <TableHead className="text-right">Pendapatan</TableHead>
                        <TableHead className="text-right">Laba Est.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topProducts.map((product, index) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                              index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-primary'
                            }`}>
                              {index + 1}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-primary">{product.quantity} unit</Badge>
                          </TableCell>
                          <TableCell className="text-center">{product.transactions}x</TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            {formatRupiah(product.revenue)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {formatRupiah(product.profit)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-muted-foreground">Belum ada data penjualan produk</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Performance Detailed */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle>Analisis Detail per Kategori</CardTitle>
              <CardDescription>Performa lengkap setiap kategori produk</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <div className="space-y-4">
                  {categoryData.map((cat, index) => {
                    const revenuePercentage = (cat.revenue / totalRevenue) * 100;
                    return (
                      <div key={cat.category} className="p-5 rounded-lg border-2 hover:border-primary/50 transition-colors bg-gradient-to-r from-white to-gray-50">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white`}
                                 style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                              #{index + 1}
                            </div>
                            <div>
                              <h4 className="font-bold text-lg">{cat.category}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {cat.uniqueProducts} produk berbeda • {cat.count} unit terjual
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary text-2xl">{formatRupiah(cat.revenue)}</p>
                            <Badge variant="outline" className="mt-1 border-green-500 text-green-700">
                              Laba: {formatRupiah(cat.profit)}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div className="text-center p-2 bg-white rounded border">
                            <p className="text-xs text-muted-foreground">Kontribusi</p>
                            <p className="font-semibold text-primary">{revenuePercentage.toFixed(1)}%</p>
                          </div>
                          <div className="text-center p-2 bg-white rounded border">
                            <p className="text-xs text-muted-foreground">Margin Laba</p>
                            <p className="font-semibold text-green-600">{cat.profitMargin.toFixed(1)}%</p>
                          </div>
                          <div className="text-center p-2 bg-white rounded border">
                            <p className="text-xs text-muted-foreground">Avg per Item</p>
                            <p className="font-semibold">{formatRupiah(cat.revenue / cat.count)}</p>
                          </div>
                          <div className="text-center p-2 bg-white rounded border">
                            <p className="text-xs text-muted-foreground">HPP Total</p>
                            <p className="font-semibold text-red-600">{formatRupiah(cat.cogs)}</p>
                          </div>
                        </div>

                        <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${revenuePercentage}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <PieChartIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-muted-foreground">Belum ada data kategori</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alert Section */}
          <Card className="border-2 border-orange-300 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Laporan Stok Rendah & Habis
              </CardTitle>
              <CardDescription>
                Monitoring produk yang memerlukan restock untuk menghindari kehabisan stok
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {(() => {
                const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= p.minStock);
                const outOfStockProducts = products.filter((p) => p.stock === 0);
                const allLowStock = [...outOfStockProducts, ...lowStockProducts].sort((a, b) => a.stock - b.stock);

                if (allLowStock.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 mx-auto mb-4 text-green-300" />
                      <p className="text-muted-foreground font-medium">Semua produk memiliki stok yang cukup</p>
                      <p className="text-xs text-muted-foreground mt-2">Tidak ada produk dengan stok rendah atau habis</p>
                    </div>
                  );
                }

                // Calculate total value needed for restock
                const totalRestockValue = allLowStock.reduce((sum, product) => {
                  const needed = Math.max(product.minStock - product.stock, 0) + 5; // Add buffer of 5 units
                  return sum + (product.purchasePrice || 0) * needed;
                }, 0);

                return (
                  <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-2 border-red-200">
                        <p className="text-sm text-muted-foreground mb-1">Stok Habis</p>
                        <p className="text-3xl font-bold text-red-600">{outOfStockProducts.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">Produk tidak tersedia</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border-2 border-orange-200">
                        <p className="text-sm text-muted-foreground mb-1">Stok Rendah</p>
                        <p className="text-3xl font-bold text-orange-600">{lowStockProducts.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">Perlu segera diisi</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
                        <p className="text-sm text-muted-foreground mb-1">Total Produk</p>
                        <p className="text-3xl font-bold text-blue-600">{allLowStock.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">Memerlukan perhatian</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-200">
                        <p className="text-sm text-muted-foreground mb-1">Estimasi Modal Restock</p>
                        <p className="text-xl font-bold text-purple-600">{formatRupiah(totalRestockValue)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Untuk restock optimal</p>
                      </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="rounded-lg border-2">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-secondary">
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Produk</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead className="text-center">Stok Saat Ini</TableHead>
                            <TableHead className="text-center">Stok Minimum</TableHead>
                            <TableHead className="text-center">Perlu Restock</TableHead>
                            <TableHead className="text-right">Harga Beli</TableHead>
                            <TableHead className="text-right">Harga Jual</TableHead>
                            <TableHead className="text-right">Estimasi Modal</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allLowStock.map((product, index) => {
                            const isOutOfStock = product.stock === 0;
                            const restockNeeded = Math.max(product.minStock - product.stock, 0) + 5;
                            const restockCost = (product.purchasePrice || 0) * restockNeeded;
                            const profitMargin = product.purchasePrice ? ((product.price - product.purchasePrice) / product.price * 100) : 0;

                            return (
                              <TableRow key={product.id} className={isOutOfStock ? "bg-red-50/50" : "hover:bg-orange-50/30"}>
                                <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {product.image && (
                                      <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                        <img
                                          src={product.image}
                                          alt={product.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="font-medium text-sm truncate">{product.name}</p>
                                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">{product.category}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge 
                                    variant={isOutOfStock ? "destructive" : "outline"}
                                    className={!isOutOfStock ? "border-orange-400 text-orange-600 font-semibold" : "font-semibold"}
                                  >
                                    {product.stock} unit
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center text-sm font-medium">
                                  {product.minStock} unit
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className="bg-blue-600 font-semibold">
                                    {restockNeeded} unit
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <p className="font-semibold text-blue-600">{formatRupiah(product.purchasePrice || 0)}</p>
                                  <p className="text-xs text-muted-foreground">per unit</p>
                                </TableCell>
                                <TableCell className="text-right">
                                  <p className="font-semibold text-primary">{formatRupiah(product.price)}</p>
                                  <Badge variant="outline" className="text-xs mt-1 border-green-500 text-green-700">
                                    +{profitMargin.toFixed(1)}%
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <p className="font-bold text-purple-600">{formatRupiah(restockCost)}</p>
                                  <p className="text-xs text-muted-foreground">untuk {restockNeeded} unit</p>
                                </TableCell>
                                <TableCell className="text-center">
                                  {isOutOfStock ? (
                                    <Badge variant="destructive" className="font-semibold">
                                      HABIS
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-orange-500 hover:bg-orange-600 font-semibold">
                                      RENDAH
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Action Recommendation */}
                    <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <Info className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-blue-900 mb-2">Rekomendasi Tindakan</h4>
                          <ul className="space-y-1 text-sm text-blue-800">
                            <li>• <strong>{outOfStockProducts.length}</strong> produk habis - <strong>segera lakukan pemesanan</strong> untuk menghindari kehilangan penjualan</li>
                            <li>• <strong>{lowStockProducts.length}</strong> produk mendekati batas minimum - rencanakan restock dalam 1-2 hari</li>
                            <li>• Total estimasi modal yang dibutuhkan: <strong>{formatRupiah(totalRestockValue)}</strong></li>
                            <li>• Hubungi supplier untuk ketersediaan produk dan negosiasi harga terbaik</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Riwayat Transaksi Lengkap ({filteredTransactions.length})
              </CardTitle>
              <CardDescription>
                Detail seluruh transaksi dalam periode terpilih
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length > 0 ? (
                <ScrollArea className="h-[700px] pr-4">
                  <div className="space-y-4">
                    {filteredTransactions.map((transaction) => {
                      const itemCount = transaction.items.reduce((sum, item) => sum + item.quantity, 0);
                      const transactionCOGS = transaction.items.reduce((sum, item) => {
                        const product = products.find(p => p.id === item.productId);
                        const purchasePrice = product?.purchasePrice || (item.price * 0.60);
                        return sum + (purchasePrice * item.quantity);
                      }, 0);
                      const profit = transaction.total - transactionCOGS;
                      
                      return (
                        <div key={transaction.id} className="border-2 rounded-xl p-5 hover:border-primary/50 transition-colors">
                          <div className="flex items-start justify-between mb-4 pb-3 border-b">
                            <div>
                              <p className="font-bold text-lg">{transaction.id}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {new Date(transaction.date).toLocaleString('id-ID', {
                                  dateStyle: 'full',
                                  timeStyle: 'short',
                                })}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  <Users className="w-3 h-3 mr-1" />
                                  {transaction.cashierName}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  <Package className="w-3 h-3 mr-1" />
                                  {itemCount} item
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-bold text-primary">
                                {formatRupiah(transaction.total)}
                              </p>
                              <Badge className="mt-2 border-primary bg-primary">
                                {transaction.paymentMethod === 'cash' && (
                                  <><Banknote className="w-3 h-3 mr-1" /> Tunai</>
                                )}
                                {transaction.paymentMethod === 'card' && (
                                  <><CreditCard className="w-3 h-3 mr-1" /> Kartu</>
                                )}
                                {transaction.paymentMethod === 'e-wallet' && (
                                  <><Wallet className="w-3 h-3 mr-1" /> E-Wallet</>
                                )}
                              </Badge>
                              <p className="text-xs text-green-600 mt-1 font-medium">
                                Est. Laba: {formatRupiah(profit)}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                              <ShoppingCart className="w-4 h-4" />
                              Item yang Dibeli:
                            </p>
                            <div className="rounded-lg border-2">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Produk</TableHead>
                                    <TableHead className="text-center">Qty</TableHead>
                                    <TableHead className="text-right">Harga Satuan</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                    <TableHead className="text-right">Laba Est.</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {transaction.items.map((item, index) => {
                                    const product = products.find(p => p.id === item.productId);
                                    const purchasePrice = product?.purchasePrice || (item.price * 0.60);
                                    const itemCOGS = purchasePrice * item.quantity;
                                    const itemProfit = item.subtotal - itemCOGS;
                                    return (
                                      <TableRow key={index}>
                                        <TableCell className="font-medium">{item.productName}</TableCell>
                                        <TableCell className="text-center">
                                          <Badge variant="outline">{item.quantity}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{formatRupiah(item.price)}</TableCell>
                                        <TableCell className="text-right font-semibold text-primary">
                                          {formatRupiah(item.subtotal)}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600 font-medium">
                                          {formatRupiah(itemProfit)}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-muted-foreground">Tidak ada transaksi dalam periode ini</p>
                  <p className="text-sm text-muted-foreground mt-2">Ubah filter tanggal untuk melihat data lain</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
