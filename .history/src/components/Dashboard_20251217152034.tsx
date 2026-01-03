import { useEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Product, Transaction } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { formatRupiah } from '../utils/currency';
import { 
  DollarSign, 
  Package, 
  TrendingUp, 
  ShoppingCart, 
  TrendingDown,
  AlertTriangle,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3,
  Activity
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

export const Dashboard = () => {
  const { getItem } = useLocalStorage();
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const storedProducts = getItem('products') || [];
    const storedTransactions = getItem('transactions') || [];
    setProducts(storedProducts);
    setTransactions(storedTransactions);
  }, []);

  // Calculate metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayTransactions = transactions.filter(
    (t) => new Date(t.date) >= yesterday && new Date(t.date) < today
  );
  const yesterdayRevenue = yesterdayTransactions.reduce((sum, t) => sum + t.total, 0);

  const todayTransactions = transactions.filter(
    (t) => new Date(t.date) >= today
  );
  const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.total, 0);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekTransactions = transactions.filter(
    (t) => new Date(t.date) >= weekAgo
  );
  const weekRevenue = weekTransactions.reduce((sum, t) => sum + t.total, 0);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthTransactions = transactions.filter(
    (t) => new Date(t.date) >= monthStart
  );
  const monthRevenue = monthTransactions.reduce((sum, t) => sum + t.total, 0);

  // Calculate percentage changes
  const revenueChange = yesterdayRevenue > 0 
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
    : todayRevenue > 0 ? 100 : 0;

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
  const outOfStockProducts = products.filter((p) => p.stock === 0);

  // Calculate best-selling products based on actual sales
  const productSales = products.map(product => {
    const totalSold = transactions.reduce((sum, transaction) => {
      const item = transaction.items.find(i => i.productId === product.id);
      return sum + (item?.quantity || 0);
    }, 0);
    
    const totalRevenue = transactions.reduce((sum, transaction) => {
      const item = transaction.items.find(i => i.productId === product.id);
      return sum + (item?.subtotal || 0);
    }, 0);

    return {
      ...product,
      totalSold,
      totalRevenue,
    };
  });

  const bestSellingProducts = [...productSales]
    .filter(p => p.totalSold > 0)
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 5);

  // Chart data - Last 7 days revenue
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  const revenueChartData = last7Days.map(date => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= dayStart && tDate <= dayEnd;
    });

    const revenue = dayTransactions.reduce((sum, t) => sum + t.total, 0);

    return {
      date: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
      revenue: revenue,
      transaksi: dayTransactions.length,
    };
  });

  // Hourly sales data (for today)
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const hourTransactions = todayTransactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getHours() === hour;
    });

    return {
      hour: `${hour}:00`,
      transaksi: hourTransactions.length,
      revenue: hourTransactions.reduce((sum, t) => sum + t.total, 0),
    };
  }).filter(h => h.transaksi > 0);

  // Category distribution by revenue
  const categoryRevenue = Array.from(
    products.reduce((map, product) => {
      const revenue = transactions.reduce((sum, transaction) => {
        const item = transaction.items.find(i => i.productId === product.id);
        return sum + (item?.subtotal || 0);
      }, 0);
      
      const current = map.get(product.category) || 0;
      map.set(product.category, current + revenue);
      return map;
    }, new Map<string, number>())
  ).map(([category, revenue]) => ({
    name: category,
    value: revenue,
  })).sort((a, b) => b.value - a.value);

  // Payment method distribution
  const paymentMethodData = transactions.reduce((acc, t) => {
    const method = t.paymentMethod === 'cash' ? 'Tunai' : 
                   t.paymentMethod === 'card' ? 'Kartu' : 'E-Wallet';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const paymentChartData = Object.entries(paymentMethodData).map(([name, value]) => ({
    name,
    value,
  }));

  // Recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const COLORS = ['#2563eb', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Selamat datang kembali! Berikut ringkasan performa toko Anda</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Pendapatan Hari Ini</CardTitle>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatRupiah(todayRevenue)}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={revenueChange >= 0 ? "default" : "destructive"} className="text-xs">
                {revenueChange >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-1" />
                )}
                {Math.abs(revenueChange).toFixed(1)}%
              </Badge>
              <p className="text-xs text-muted-foreground">
                vs kemarin
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Transaksi Hari Ini</CardTitle>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{todayTransactions.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Rata-rata {todayTransactions.length > 0 ? formatRupiah(todayRevenue / todayTransactions.length) : 'Rp 0'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Produk</CardTitle>
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {totalStock} unit total stok
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Pendapatan Minggu Ini</CardTitle>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatRupiah(weekRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {weekTransactions.length} transaksi minggu ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards - Low Stock Information */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lowStockProducts.length > 0 && (
              <Card className="border-2 border-orange-200 bg-orange-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="w-5 h-5" />
                    Stok Rendah ({lowStockProducts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {lowStockProducts.slice(0, 3).map(product => (
                      <div key={product.id} className="flex items-center justify-between text-sm">
                        <span className="line-clamp-1">{product.name}</span>
                        <Badge variant="outline" className="border-orange-400 text-orange-600">
                          {product.stock} tersisa
                        </Badge>
                      </div>
                    ))}
                    {lowStockProducts.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{lowStockProducts.length - 3} produk lainnya
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {outOfStockProducts.length > 0 && (
              <Card className="border-2 border-red-200 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    Stok Habis ({outOfStockProducts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {outOfStockProducts.slice(0, 3).map(product => (
                      <div key={product.id} className="flex items-center justify-between text-sm">
                        <span className="line-clamp-1">{product.name}</span>
                        <Badge variant="destructive">Habis</Badge>
                      </div>
                    ))}
                    {outOfStockProducts.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{outOfStockProducts.length - 3} produk lainnya
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Detailed Low Stock List */}
          <Card className="border-2 border-orange-300 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Detail Produk Stok Rendah & Habis
              </CardTitle>
              <CardDescription>
                Daftar lengkap produk yang memerlukan restock segera
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary">
                      <tr className="border-b">
                        <th className="text-left p-3 text-sm font-semibold">Produk</th>
                        <th className="text-left p-3 text-sm font-semibold">Kategori</th>
                        <th className="text-center p-3 text-sm font-semibold">Stok Saat Ini</th>
                        <th className="text-center p-3 text-sm font-semibold">Stok Min</th>
                        <th className="text-right p-3 text-sm font-semibold">Harga Beli</th>
                        <th className="text-right p-3 text-sm font-semibold">Harga Jual</th>
                        <th className="text-center p-3 text-sm font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...outOfStockProducts, ...lowStockProducts]
                        .sort((a, b) => a.stock - b.stock)
                        .map((product) => {
                          const isOutOfStock = product.stock === 0;
                          return (
                            <tr key={product.id} className="border-b hover:bg-secondary/30 transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  {product.image && (
                                    <ImageWithFallback
                                      src={product.image}
                                      alt={product.name}
                                      className="w-10 h-10 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium text-sm">{product.name}</p>
                                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline" className="text-xs">{product.category}</Badge>
                              </td>
                              <td className="p-3 text-center">
                                <Badge 
                                  variant={isOutOfStock ? "destructive" : "outline"}
                                  className={!isOutOfStock ? "border-orange-400 text-orange-600" : ""}
                                >
                                  {product.stock} unit
                                </Badge>
                              </td>
                              <td className="p-3 text-center text-sm text-muted-foreground">
                                {product.minStock} unit
                              </td>
                              <td className="p-3 text-right text-sm font-medium text-blue-600">
                                {formatRupiah(product.purchasePrice || 0)}
                              </td>
                              <td className="p-3 text-right text-sm font-medium text-primary">
                                {formatRupiah(product.price)}
                              </td>
                              <td className="p-3 text-center">
                                {isOutOfStock ? (
                                  <Badge variant="destructive" className="font-semibold">
                                    HABIS
                                  </Badge>
                                ) : (
                                  <Badge className="bg-orange-500 hover:bg-orange-600 font-semibold">
                                    RENDAH
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="border-2 shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Tren Pendapatan 7 Hari Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
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
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle>Pendapatan per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryRevenue}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryRevenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatRupiah(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle>Produk Terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            {bestSellingProducts.length > 0 ? (
              <div className="space-y-4">
                {bestSellingProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-600' : 'bg-primary'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.totalSold} terjual • {formatRupiah(product.totalRevenue)}
                      </p>
                    </div>
                    <Progress 
                      value={(product.totalSold / bestSellingProducts[0].totalSold) * 100} 
                      className="w-20"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada data penjualan</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Transaksi Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{transaction.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleString('id-ID', { 
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{formatRupiah(transaction.total)}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {transaction.items.reduce((sum, item) => sum + item.quantity, 0)} item
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada transaksi</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary */}
      <Card className="border-2 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Ringkasan Bulan Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-white shadow-sm">
              <p className="text-sm text-muted-foreground mb-1">Total Pendapatan</p>
              <p className="text-xl font-bold text-primary">{formatRupiah(monthRevenue)}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-white shadow-sm">
              <p className="text-sm text-muted-foreground mb-1">Total Transaksi</p>
              <p className="text-xl font-bold text-blue-600">{monthTransactions.length}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-white shadow-sm">
              <p className="text-sm text-muted-foreground mb-1">Rata-rata/Hari</p>
              <p className="text-xl font-bold text-green-600">
                {formatRupiah(monthRevenue / new Date().getDate())}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-white shadow-sm">
              <p className="text-sm text-muted-foreground mb-1">Item Terjual</p>
              <p className="text-xl font-bold text-purple-600">
                {monthTransactions.reduce((sum, t) => 
                  sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
