'use client';

import { useState, useEffect } from 'react';
import { Package, ShoppingCart, TrendingUp, AlertTriangle, Plus, Search, FileText } from 'lucide-react';
import { Product, Sale, Purchase, DashboardStats } from '@/lib/types';
import {
  getProducts,
  getSales,
  getPurchases,
  getInventoryValue,
  getTodaySales,
  getTodayProfit,
  getMonthlySales,
  getMonthlyProfit,
  getLowStockCount,
  addProduct,
  addSale,
  addPurchase,
  updateProduct,
} from '@/lib/store';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'sales' | 'purchases' | 'reports'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalInventoryValue: 0,
    todaySales: 0,
    todayProfit: 0,
    totalProducts: 0,
    lowStockItems: 0,
    monthlySales: 0,
    monthlyProfit: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState<'product' | 'sale' | 'purchase' | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const productsData = getProducts();
    const salesData = getSales();
    const purchasesData = getPurchases();

    setProducts(productsData);
    setSales(salesData);
    setPurchases(purchasesData);

    setStats({
      totalInventoryValue: getInventoryValue(),
      todaySales: getTodaySales(),
      todayProfit: getTodayProfit(),
      totalProducts: productsData.filter(p => p.status === 'in-stock').length,
      lowStockItems: getLowStockCount(),
      monthlySales: getMonthlySales(),
      monthlyProfit: getMonthlyProfit(),
    });
  };

  const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const product: Product = {
      id: Date.now().toString(),
      name: formData.get('name') as string,
      brand: formData.get('brand') as string,
      category: formData.get('category') as 'mobile' | 'accessory' | 'other',
      imei: formData.get('imei') as string || undefined,
      color: formData.get('color') as string || undefined,
      storage: formData.get('storage') as string || undefined,
      mfgDate: formData.get('mfgDate') as string || undefined,
      purchasePrice: parseFloat(formData.get('purchasePrice') as string),
      salePrice: parseFloat(formData.get('salePrice') as string),
      quantity: parseInt(formData.get('quantity') as string),
      supplier: formData.get('supplier') as string || undefined,
      dateAdded: new Date().toISOString(),
      status: 'in-stock',
    };
    addProduct(product);

    // Also add to purchases
    const purchase: Purchase = {
      id: Date.now().toString(),
      productName: product.name,
      brand: product.brand,
      category: product.category,
      imei: product.imei,
      color: product.color,
      storage: product.storage,
      quantity: product.quantity,
      purchasePrice: product.purchasePrice,
      expectedSalePrice: product.salePrice,
      supplier: product.supplier || 'N/A',
      date: new Date().toISOString(),
      billNumber: `PUR-${Date.now()}`,
    };
    addPurchase(purchase);

    setShowAddModal(null);
    loadData();
  };

  const handleAddSale = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productId = formData.get('productId') as string;
    const product = products.find(p => p.id === productId);

    if (product) {
      const salePrice = parseFloat(formData.get('salePrice') as string);
      const sale: Sale = {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.name,
        imei: product.imei,
        salePrice: salePrice,
        customerName: formData.get('customerName') as string || undefined,
        customerPhone: formData.get('customerPhone') as string || undefined,
        paymentMethod: formData.get('paymentMethod') as 'cash' | 'card' | 'bank-transfer' | 'installment',
        profit: salePrice - product.purchasePrice,
        date: new Date().toISOString(),
        invoiceNumber: `INV-${Date.now()}`,
      };
      addSale(sale);

      // Update product quantity/status
      if (product.quantity > 1) {
        updateProduct(product.id, { quantity: product.quantity - 1 });
      } else {
        updateProduct(product.id, { status: 'sold', quantity: 0 });
      }

      setShowAddModal(null);
      loadData();
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.imei && p.imei.includes(searchTerm))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mobile Shop Management</h1>
              <p className="text-sm text-gray-600">Pakistan Mobile Market System</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total Inventory</div>
              <div className="text-xl font-bold text-primary">PKR {stats.totalInventoryValue.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'inventory', label: 'Inventory', icon: Package },
              { id: 'sales', label: 'Sales', icon: ShoppingCart },
              { id: 'purchases', label: 'Purchases', icon: Plus },
              { id: 'reports', label: 'Reports', icon: FileText },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Today's Sales"
                value={`PKR ${stats.todaySales.toLocaleString()}`}
                icon={ShoppingCart}
                color="blue"
              />
              <StatCard
                title="Today's Profit"
                value={`PKR ${stats.todayProfit.toLocaleString()}`}
                icon={TrendingUp}
                color="green"
              />
              <StatCard
                title="Total Products"
                value={stats.totalProducts.toString()}
                icon={Package}
                color="purple"
              />
              <StatCard
                title="Low Stock Items"
                value={stats.lowStockItems.toString()}
                icon={AlertTriangle}
                color="red"
              />
            </div>

            {/* Monthly Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-2">This Month</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Sales:</span>
                    <span className="font-bold text-blue-600">PKR {stats.monthlySales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Profit:</span>
                    <span className="font-bold text-green-600">PKR {stats.monthlyProfit.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowAddModal('product')}
                    className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark"
                  >
                    Add New Product
                  </button>
                  <button
                    onClick={() => setShowAddModal('sale')}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                  >
                    Record Sale
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Sales</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Invoice</th>
                      <th className="text-left py-2">Product</th>
                      <th className="text-left py-2">Customer</th>
                      <th className="text-left py-2">Amount</th>
                      <th className="text-left py-2">Profit</th>
                      <th className="text-left py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.slice(-10).reverse().map(sale => (
                      <tr key={sale.id} className="border-b">
                        <td className="py-2">{sale.invoiceNumber}</td>
                        <td className="py-2">{sale.productName}</td>
                        <td className="py-2">{sale.customerName || 'Walk-in'}</td>
                        <td className="py-2">PKR {sale.salePrice.toLocaleString()}</td>
                        <td className="py-2 text-green-600">PKR {sale.profit.toLocaleString()}</td>
                        <td className="py-2">{new Date(sale.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by name, brand, or IMEI..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg w-80"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowAddModal('product')}
                className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark flex items-center space-x-2"
              >
                <Plus size={18} />
                <span>Add Product</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4">Product</th>
                      <th className="text-left py-3 px-4">Category</th>
                      <th className="text-left py-3 px-4">IMEI</th>
                      <th className="text-left py-3 px-4">Color</th>
                      <th className="text-left py-3 px-4">Purchase Price</th>
                      <th className="text-left py-3 px-4">Sale Price</th>
                      <th className="text-left py-3 px-4">Quantity</th>
                      <th className="text-left py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.brand}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{product.category}</td>
                        <td className="py-3 px-4 font-mono text-sm">{product.imei || '-'}</td>
                        <td className="py-3 px-4">{product.color || '-'}</td>
                        <td className="py-3 px-4">PKR {product.purchasePrice.toLocaleString()}</td>
                        <td className="py-3 px-4">PKR {product.salePrice.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={product.quantity < 5 ? 'text-red-600 font-bold' : ''}>
                            {product.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            product.status === 'in-stock' ? 'bg-green-100 text-green-800' :
                            product.status === 'sold' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {product.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Sales Records</h2>
              <button
                onClick={() => setShowAddModal('sale')}
                className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
              >
                <Plus size={18} />
                <span>Record Sale</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4">Invoice No</th>
                      <th className="text-left py-3 px-4">Product</th>
                      <th className="text-left py-3 px-4">IMEI</th>
                      <th className="text-left py-3 px-4">Customer</th>
                      <th className="text-left py-3 px-4">Phone</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Profit</th>
                      <th className="text-left py-3 px-4">Payment</th>
                      <th className="text-left py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.slice().reverse().map(sale => (
                      <tr key={sale.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm">{sale.invoiceNumber}</td>
                        <td className="py-3 px-4">{sale.productName}</td>
                        <td className="py-3 px-4 font-mono text-sm">{sale.imei || '-'}</td>
                        <td className="py-3 px-4">{sale.customerName || 'Walk-in'}</td>
                        <td className="py-3 px-4">{sale.customerPhone || '-'}</td>
                        <td className="py-3 px-4 font-bold">PKR {sale.salePrice.toLocaleString()}</td>
                        <td className="py-3 px-4 text-green-600 font-bold">PKR {sale.profit.toLocaleString()}</td>
                        <td className="py-3 px-4">{sale.paymentMethod}</td>
                        <td className="py-3 px-4">{new Date(sale.date).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'purchases' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Purchase Records</h2>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4">Bill No</th>
                      <th className="text-left py-3 px-4">Product</th>
                      <th className="text-left py-3 px-4">Category</th>
                      <th className="text-left py-3 px-4">IMEI</th>
                      <th className="text-left py-3 px-4">Color</th>
                      <th className="text-left py-3 px-4">Qty</th>
                      <th className="text-left py-3 px-4">Purchase Price</th>
                      <th className="text-left py-3 px-4">Supplier</th>
                      <th className="text-left py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.slice().reverse().map(purchase => (
                      <tr key={purchase.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm">{purchase.billNumber}</td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{purchase.productName}</div>
                            <div className="text-sm text-gray-500">{purchase.brand}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{purchase.category}</td>
                        <td className="py-3 px-4 font-mono text-sm">{purchase.imei || '-'}</td>
                        <td className="py-3 px-4">{purchase.color || '-'}</td>
                        <td className="py-3 px-4">{purchase.quantity}</td>
                        <td className="py-3 px-4">PKR {purchase.purchasePrice.toLocaleString()}</td>
                        <td className="py-3 px-4">{purchase.supplier}</td>
                        <td className="py-3 px-4">{new Date(purchase.date).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Sales Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Sales (All Time):</span>
                    <span className="font-bold">PKR {sales.reduce((sum, s) => sum + s.salePrice, 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Profit (All Time):</span>
                    <span className="font-bold text-green-600">PKR {sales.reduce((sum, s) => sum + s.profit, 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Transactions:</span>
                    <span className="font-bold">{sales.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Sale Value:</span>
                    <span className="font-bold">PKR {sales.length > 0 ? (sales.reduce((sum, s) => sum + s.salePrice, 0) / sales.length).toFixed(0) : 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Inventory Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Products:</span>
                    <span className="font-bold">{products.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>In Stock:</span>
                    <span className="font-bold text-green-600">{products.filter(p => p.status === 'in-stock').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sold:</span>
                    <span className="font-bold text-gray-600">{products.filter(p => p.status === 'sold').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Inventory Value:</span>
                    <span className="font-bold">PKR {stats.totalInventoryValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
                <div className="space-y-2">
                  {['cash', 'card', 'bank-transfer', 'installment'].map(method => {
                    const count = sales.filter(s => s.paymentMethod === method).length;
                    const total = sales.filter(s => s.paymentMethod === method).reduce((sum, s) => sum + s.salePrice, 0);
                    return (
                      <div key={method} className="flex justify-between">
                        <span className="capitalize">{method}:</span>
                        <span>{count} sales (PKR {total.toLocaleString()})</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
                <div className="space-y-2">
                  {['mobile', 'accessory', 'other'].map(category => {
                    const count = products.filter(p => p.category === category).length;
                    const inStock = products.filter(p => p.category === category && p.status === 'in-stock').length;
                    return (
                      <div key={category} className="flex justify-between">
                        <span className="capitalize">{category}:</span>
                        <span>{inStock} in stock / {count} total</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      {showAddModal === 'product' && (
        <Modal onClose={() => setShowAddModal(null)} title="Add New Product">
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input type="text" name="name" required className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Brand *</label>
                <input type="text" name="brand" required className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select name="category" required className="w-full border rounded px-3 py-2">
                  <option value="mobile">Mobile</option>
                  <option value="accessory">Accessory</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">IMEI</label>
                <input type="text" name="imei" className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <input type="text" name="color" className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Storage</label>
                <input type="text" name="storage" placeholder="e.g., 128GB" className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Manufacturing Date</label>
                <input type="date" name="mfgDate" className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Supplier</label>
                <input type="text" name="supplier" className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Purchase Price (PKR) *</label>
                <input type="number" name="purchasePrice" required min="0" step="0.01" className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sale Price (PKR) *</label>
                <input type="number" name="salePrice" required min="0" step="0.01" className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity *</label>
                <input type="number" name="quantity" required min="1" defaultValue="1" className="w-full border rounded px-3 py-2" />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button type="button" onClick={() => setShowAddModal(null)} className="px-4 py-2 border rounded hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark">
                Add Product
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Sale Modal */}
      {showAddModal === 'sale' && (
        <Modal onClose={() => setShowAddModal(null)} title="Record Sale">
          <form onSubmit={handleAddSale} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Product *</label>
              <select name="productId" required className="w-full border rounded px-3 py-2">
                <option value="">Choose a product...</option>
                {products.filter(p => p.status === 'in-stock' && p.quantity > 0).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {p.brand} {p.imei ? `(IMEI: ${p.imei})` : ''} - PKR {p.salePrice}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sale Price (PKR) *</label>
              <input type="number" name="salePrice" required min="0" step="0.01" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Customer Name</label>
              <input type="text" name="customerName" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Customer Phone</label>
              <input type="tel" name="customerPhone" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Method *</label>
              <select name="paymentMethod" required className="w-full border rounded px-3 py-2">
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank-transfer">Bank Transfer</option>
                <option value="installment">Installment</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button type="button" onClick={() => setShowAddModal(null)} className="px-4 py-2 border rounded hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Record Sale
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
