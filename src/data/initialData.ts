import { DatabaseState } from '../types';

export const initialData: DatabaseState = {
  users: [
    {
      id: '1',
      email: 'admin@gadgetprima.com',
      password: 'admin123',
      name: 'Administrator',
      role: 'admin'
    },
    {
      id: '2',
      email: 'kasir@gadgetprima.com',
      password: 'kasir123',
      name: 'Kasir Prima',
      role: 'cashier'
    },
    {
      id: '3',
      email: 'gudang@gadgetprima.com',
      password: 'gudang123',
      name: 'Staff Gudang',
      role: 'warehouse'
    },
    {
      id: '4',
      email: 'pemilik@gadgetprima.com',
      password: 'pemilik123',
      name: 'Pemilik Toko',
      role: 'owner'
    }
  ],
  products: [
    {
      id: 'P001',
      name: 'iPhone 15 Pro Max',
      category: 'Smartphone',
      brand: 'Apple',
      price: 19500000,
      purchasePrice: 18525000, // 5% margin
      stock: 25,
      sku: 'APL-IP15PM-256',
      description: '256GB, Titanium Blue',
      minStock: 5,
      image: 'https://images.unsplash.com/photo-1520088096110-20308c23a3cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzbWFydHBob25lfGVufDF8fHx8MTc2MTYwNjc0MHww&ixlib=rb-4.1.0&q=80&w=400'
    },
    {
      id: 'P002',
      name: 'Samsung Galaxy S24 Ultra',
      category: 'Smartphone',
      brand: 'Samsung',
      price: 17900000,
      purchasePrice: 16996000, // 5.05% margin
      stock: 30,
      sku: 'SAM-S24U-512',
      description: '512GB, Phantom Black',
      minStock: 5,
      image: 'https://images.unsplash.com/photo-1520088096110-20308c23a3cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzbWFydHBob25lfGVufDF8fHx8MTc2MTYwNjc0MHww&ixlib=rb-4.1.0&q=80&w=400'
    },
    {
      id: 'P003',
      name: 'Apple Watch Series 9',
      category: 'Smartwatch',
      brand: 'Apple',
      price: 6500000,
      purchasePrice: 5980000, // 8% margin
      stock: 15,
      sku: 'APL-AW9-GPS',
      description: '45mm GPS, Midnight Aluminum',
      minStock: 3,
      image: 'https://images.unsplash.com/photo-1716234479503-c460b87bdf98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydHdhdGNoJTIwd2VhcmFibGV8ZW58MXx8fHwxNzYxNjU2NzU4fDA&ixlib=rb-4.1.0&q=80&w=400'
    },
    {
      id: 'P004',
      name: 'Samsung Galaxy Watch 6',
      category: 'Smartwatch',
      brand: 'Samsung',
      price: 4900000,
      purchasePrice: 4508000, // 8% margin
      stock: 20,
      sku: 'SAM-GW6-BT',
      description: '44mm Bluetooth, Graphite',
      minStock: 3,
      image: 'https://images.unsplash.com/photo-1716234479503-c460b87bdf98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydHdhdGNoJTIwd2VhcmFibGV8ZW58MXx8fHwxNzYxNjU2NzU4fDA&ixlib=rb-4.1.0&q=80&w=400'
    },
    {
      id: 'P005',
      name: 'PlayStation 5',
      category: 'Konsol Game',
      brand: 'Sony',
      price: 8150000,
      purchasePrice: 7742500, // 5% margin
      stock: 12,
      sku: 'SNY-PS5-STD',
      description: 'Standard Edition dengan Disc Drive',
      minStock: 5,
      image: 'https://images.unsplash.com/photo-1580234797602-22c37b2a6230?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBjb25zb2xlfGVufDF8fHx8MTc2MTY1MzQ3MHww&ixlib=rb-4.1.0&q=80&w=400'
    },
    {
      id: 'P006',
      name: 'Xbox Series X',
      category: 'Konsol Game',
      brand: 'Microsoft',
      price: 8150000,
      purchasePrice: 7742500, // 5% margin
      stock: 10,
      sku: 'MST-XSX-1TB',
      description: '1TB Storage',
      minStock: 5,
      image: 'https://images.unsplash.com/photo-1580234797602-22c37b2a6230?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBjb25zb2xlfGVufDF8fHx8MTc2MTY1MzQ3MHww&ixlib=rb-4.1.0&q=80&w=400'
    },
    {
      id: 'P007',
      name: 'Nintendo Switch OLED',
      category: 'Konsol Game',
      brand: 'Nintendo',
      price: 5700000,
      purchasePrice: 5415000, // 5% margin
      stock: 18,
      sku: 'NIN-NSW-OLED',
      description: 'White OLED Model',
      minStock: 5,
      image: 'https://images.unsplash.com/photo-1580234797602-22c37b2a6230?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBjb25zb2xlfGVufDF8fHx8MTc2MTY1MzQ3MHww&ixlib=rb-4.1.0&q=80&w=400'
    },
    {
      id: 'P008',
      name: 'iPad Pro 12.9"',
      category: 'Tablet',
      brand: 'Apple',
      price: 17900000,
      purchasePrice: 17005000, // 5% margin
      stock: 8,
      sku: 'APL-IPP-129-512',
      description: '512GB, Space Gray, M2',
      minStock: 3,
      image: 'https://images.unsplash.com/photo-1672239069328-dd1535c0d78a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWJsZXQlMjBkZXZpY2V8ZW58MXx8fHwxNzYxNjI1NTQwfDA&ixlib=rb-4.1.0&q=80&w=400'
    },
    {
      id: 'P009',
      name: 'AirPods Pro 2',
      category: 'Audio',
      brand: 'Apple',
      price: 4060000,
      purchasePrice: 3654000, // 10% margin
      stock: 40,
      sku: 'APL-APP2-USBC',
      description: 'USB-C dengan MagSafe',
      minStock: 10,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlbGVzcyUyMGhlYWRwaG9uZXN8ZW58MXx8fHwxNzYxNjYyNjk1fDA&ixlib=rb-4.1.0&q=80&w=400'
    },
    {
      id: 'P010',
      name: 'Sony WH-1000XM5',
      category: 'Audio',
      brand: 'Sony',
      price: 6500000,
      purchasePrice: 5850000, // 10% margin
      stock: 22,
      sku: 'SNY-WH1000XM5-BLK',
      description: 'Wireless Noise Cancelling, Black',
      minStock: 5,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlbGVzcyUyMGhlYWRwaG9uZXN8ZW58MXx8fHwxNzYxNjYyNjk1fDA&ixlib=rb-4.1.0&q=80&w=400'
    },
    {
      id: 'P011',
      name: 'MacBook Air M3',
      category: 'Laptop',
      brand: 'Apple',
      price: 21200000,
      purchasePrice: 20140000, // 5% margin
      stock: 4,
      sku: 'APL-MBA-M3-256',
      description: '13" M3, 256GB, Midnight',
      minStock: 3,
      image: 'https://images.unsplash.com/photo-1641430034785-47f6f91ab6cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsYXB0b3B8ZW58MXx8fHwxNzYxNjUwODkwfDA&ixlib=rb-4.1.0&q=80&w=400'
    },
    {
      id: 'P012',
      name: 'Google Pixel 8 Pro',
      category: 'Smartphone',
      brand: 'Google',
      price: 16300000,
      purchasePrice: 15485000, // 5% margin
      stock: 16,
      sku: 'GOG-P8P-256',
      description: '256GB, Obsidian',
      minStock: 5,
      image: 'https://images.unsplash.com/photo-1520088096110-20308c23a3cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzbWFydHBob25lfGVufDF8fHx8MTc2MTYwNjc0MHww&ixlib=rb-4.1.0&q=80&w=400'
    }
  ],
  transactions: [
    {
      id: 'T001',
      date: '2025-10-28T09:30:00',
      items: [
        {
          productId: 'P001',
          productName: 'iPhone 15 Pro Max',
          quantity: 2,
          price: 19500000,
          subtotal: 39000000
        },
        {
          productId: 'P009',
          productName: 'AirPods Pro 2',
          quantity: 2,
          price: 4060000,
          subtotal: 8120000
        }
      ],
      total: 47120000,
      cashierId: '2',
      cashierName: 'Kasir Prima',
      paymentMethod: 'card'
    },
    {
      id: 'T002',
      date: '2025-10-28T10:15:00',
      items: [
        {
          productId: 'P005',
          productName: 'PlayStation 5',
          quantity: 1,
          price: 8150000,
          subtotal: 8150000
        }
      ],
      total: 8150000,
      cashierId: '2',
      cashierName: 'Kasir Prima',
      paymentMethod: 'cash'
    },
    {
      id: 'T003',
      date: '2025-10-28T11:45:00',
      items: [
        {
          productId: 'P003',
          productName: 'Apple Watch Series 9',
          quantity: 1,
          price: 6500000,
          subtotal: 6500000
        },
        {
          productId: 'P004',
          productName: 'Samsung Galaxy Watch 6',
          quantity: 1,
          price: 4900000,
          subtotal: 4900000
        }
      ],
      total: 11400000,
      cashierId: '2',
      cashierName: 'Kasir Prima',
      paymentMethod: 'e-wallet'
    },
    {
      id: 'T004',
      date: '2025-10-27T14:20:00',
      items: [
        {
          productId: 'P002',
          productName: 'Samsung Galaxy S24 Ultra',
          quantity: 1,
          price: 17900000,
          subtotal: 17900000
        }
      ],
      total: 17900000,
      cashierId: '2',
      cashierName: 'Kasir Prima',
      paymentMethod: 'card'
    },
    {
      id: 'T005',
      date: '2025-10-27T16:00:00',
      items: [
        {
          productId: 'P007',
          productName: 'Nintendo Switch OLED',
          quantity: 2,
          price: 5700000,
          subtotal: 11400000
        }
      ],
      total: 11400000,
      cashierId: '2',
      cashierName: 'Kasir Prima',
      paymentMethod: 'cash'
    },
    {
      id: 'T006',
      date: '2025-10-26T10:30:00',
      items: [
        {
          productId: 'P010',
          productName: 'Sony WH-1000XM5',
          quantity: 3,
          price: 6500000,
          subtotal: 19500000
        }
      ],
      total: 19500000,
      cashierId: '2',
      cashierName: 'Kasir Prima',
      paymentMethod: 'card'
    },
    {
      id: 'T007',
      date: '2025-10-25T13:15:00',
      items: [
        {
          productId: 'P012',
          productName: 'Google Pixel 8 Pro',
          quantity: 1,
          price: 16300000,
          subtotal: 16300000
        },
        {
          productId: 'P009',
          productName: 'AirPods Pro 2',
          quantity: 1,
          price: 4060000,
          subtotal: 4060000
        }
      ],
      total: 20360000,
      cashierId: '2',
      cashierName: 'Kasir Prima',
      paymentMethod: 'e-wallet'
    }
  ],
  expenses: [
    {
      id: 'E001',
      date: '2025-10-28',
      description: 'Tagihan Listrik',
      amount: 4100000,
      category: 'Utilitas'
    },
    {
      id: 'E002',
      date: '2025-10-27',
      description: 'Perlengkapan Kantor',
      amount: 2450000,
      category: 'Operasional'
    },
    {
      id: 'E003',
      date: '2025-10-26',
      description: 'Sewa Toko',
      amount: 32650000,
      category: 'Sewa'
    },
    {
      id: 'E004',
      date: '2025-10-25',
      description: 'Materi Pemasaran',
      amount: 4900000,
      category: 'Pemasaran'
    },
    {
      id: 'E005',
      date: '2025-10-24',
      description: 'Gaji Karyawan',
      amount: 81650000,
      category: 'Gaji'
    }
  ]
};
