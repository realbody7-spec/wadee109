import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  UtensilsCrossed, 
  Coffee, 
  IceCream, 
  Soup, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  QrCode, 
  DollarSign, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Filter, 
  ChefHat, 
  Receipt, 
  Table as TableIcon,
  X,
  Settings,
  Sparkles,
  ArrowRight,
  Send,
  UserCheck
} from 'lucide-react';

export default function PosManager({ inventory = [], onRefreshInventory }) {
  const [activeTab, setActiveTab] = useState('cashier'); // 'cashier' | 'orders' | 'setup'
  
  // Data states
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cashier state
  const [selectedTable, setSelectedTable] = useState('Takeaway');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]); // [{ id, name, price, qty, notes }]
  const [discount, setDiscount] = useState(0);
  const [includeVat, setIncludeVat] = useState(true);
  const [includeServiceCharge, setIncludeServiceCharge] = useState(true);

  // Active Order Modal / Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [currentPayingOrder, setCurrentPayingOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'promptpay' | 'credit'
  const [cashReceived, setCashReceived] = useState('');

  // Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);

  // Setup Form State
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'main',
    price: '',
    description: '',
    image: '',
    ingredients: []
  });

  const categories = [
    { id: 'all', name: 'ทั้งหมด', icon: UtensilsCrossed },
    { id: 'main', name: 'อาหารจานหลัก', icon: UtensilsCrossed },
    { id: 'soup', name: 'ต้ม & แกง', icon: Soup },
    { id: 'appetizer', name: 'ทานเล่น', icon: ChefHat },
    { id: 'beverage', name: 'เครื่องดื่ม', icon: Coffee },
    { id: 'dessert', name: 'ของหวาน', icon: IceCream },
  ];

  // Fetch initial POS data
  useEffect(() => {
    fetchPosData();
  }, []);

  const fetchPosData = async () => {
    try {
      setLoading(true);
      const [menuRes, tablesRes, ordersRes] = await Promise.all([
        fetch('/api/pos/menu').then(r => r.json()),
        fetch('/api/pos/tables').then(r => r.json()),
        fetch('/api/pos/orders').then(r => r.json())
      ]);

      setMenuItems(menuRes || []);
      setTables(tablesRes || []);
      setOrders(ordersRes || []);
    } catch (err) {
      console.error('Error fetching POS data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cart logic
  const addToCart = (item) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(i => i.id === item.id);
      if (existingIndex !== -1) {
        const updated = [...prevCart];
        updated[existingIndex].qty += 1;
        return updated;
      }
      return [...prevCart, { ...item, qty: 1, notes: '' }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const updateCartNotes = (id, notes) => {
    setCart(prevCart => prevCart.map(i => i.id === id ? { ...i, notes } : i));
  };

  const removeFromCart = (id) => {
    setCart(prevCart => prevCart.filter(i => i.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const discountAmount = Number(discount) || 0;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const serviceChargeAmount = includeServiceCharge ? Math.round(afterDiscount * 0.1) : 0;
  const vatAmount = includeVat ? Math.round((afterDiscount + serviceChargeAmount) * 0.07) : 0;
  const totalAmount = afterDiscount + serviceChargeAmount + vatAmount;

  // Submit Order (Send to kitchen or pay)
  const handleCreateOrder = async (isDirectPay = false) => {
    if (cart.length === 0) return;

    const tableObj = tables.find(t => t.id === selectedTable);
    const tableName = selectedTable === 'Takeaway' ? 'สั่งกลับบ้าน' : selectedTable === 'Delivery' ? 'เดลิเวอรี่' : (tableObj ? tableObj.name : selectedTable);
    const orderType = selectedTable === 'Takeaway' ? 'takeaway' : selectedTable === 'Delivery' ? 'delivery' : 'dine-in';

    const orderPayload = {
      tableId: selectedTable,
      tableName,
      orderType,
      items: cart,
      subtotal,
      discount: discountAmount,
      serviceCharge: serviceChargeAmount,
      vat: vatAmount,
      total: totalAmount,
      status: 'pending'
    };

    try {
      const res = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const createdOrder = await res.json();
      
      clearCart();
      await fetchPosData();

      if (isDirectPay) {
        setCurrentPayingOrder(createdOrder);
        setCashReceived(createdOrder.total.toString());
        setPaymentModalOpen(true);
      } else {
        alert(`ส่งออเดอร์หมายเลข ${createdOrder.orderNo} เข้าห้องครัวเรียบร้อยแล้ว!`);
      }
    } catch (err) {
      console.error('Error creating order:', err);
      alert('เกิดข้อผิดพลาดในการสร้างออเดอร์');
    }
  };

  // Handle Paying Order
  const handleConfirmPayment = async () => {
    if (!currentPayingOrder) return;
    const recAmt = parseFloat(cashReceived) || currentPayingOrder.total;
    if (paymentMethod === 'cash' && recAmt < currentPayingOrder.total) {
      alert('จำนวนเงินสดรับมาไม่เพียงพอกับยอดชำระ');
      return;
    }

    try {
      const res = await fetch(`/api/pos/orders/${currentPayingOrder.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          receivedAmount: recAmt
        })
      });
      const paidOrder = await res.json();
      
      setPaymentModalOpen(false);
      setReceiptOrder(paidOrder);
      setReceiptModalOpen(true);

      if (onRefreshInventory) onRefreshInventory();
      await fetchPosData();
    } catch (err) {
      console.error('Error processing payment:', err);
      alert('เกิดข้อผิดพลาดในการชำระเงิน');
    }
  };

  // Update Status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await fetch(`/api/pos/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      await fetchPosData();
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  // Cancel Order
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('คุณต้องการยกเลิกออเดอร์นี้ใช่หรือไม่?')) return;
    try {
      await fetch(`/api/pos/orders/${orderId}`, { method: 'DELETE' });
      await fetchPosData();
    } catch (err) {
      console.error('Error cancelling order:', err);
    }
  };

  // Menu item CRUD
  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.price) {
      alert('กรุณากรอกชื่อเมนูและราคา');
      return;
    }

    try {
      if (editingItem) {
        await fetch(`/api/pos/menu/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemForm)
        });
      } else {
        await fetch('/api/pos/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemForm)
        });
      }
      setEditingItem(null);
      setItemForm({ name: '', category: 'main', price: '', description: '', image: '', ingredients: [] });
      await fetchPosData();
    } catch (err) {
      console.error('Error saving menu item:', err);
    }
  };

  const handleDeleteMenuItem = async (id) => {
    if (!window.confirm('คุณต้องการลบเมนูนี้ใช่หรือไม่?')) return;
    try {
      await fetch(`/api/pos/menu/${id}`, { method: 'DELETE' });
      await fetchPosData();
    } catch (err) {
      console.error('Error deleting menu item:', err);
    }
  };

  // Filtered menu items
  const filteredMenu = menuItems.filter(item => {
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-200">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">ระบบหน้าร้านขายอาหาร (Restaurant POS)</h1>
            <p className="text-sm text-slate-500">จัดการการขาย เปิดโต๊ะ สั่งอาหาร คำนวณบิล และตัดสต็อกวัตถุดิบอัตโนมัติ</p>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('cashier')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'cashier' 
                ? 'bg-white text-indigo-600 shadow-sm font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            หน้าร้าน & ขาย (Cashier)
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all relative ${
              activeTab === 'orders' 
                ? 'bg-white text-indigo-600 shadow-sm font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            รายการออเดอร์ (KDS)
            {orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled').length > 0 && (
              <span className="w-5 h-5 bg-rose-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                {orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'setup' 
                ? 'bg-white text-indigo-600 shadow-sm font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            จัดการเมนูอาหาร
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white/60 rounded-2xl">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          กำลังโหลดข้อมูล POS...
        </div>
      ) : (
        <>
          {/* TAB 1: CASHIER MODE */}
          {activeTab === 'cashier' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Menu & Filters (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                {/* Table & Search Header */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
                  {/* Table Selection Bar */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                      เลือกโต๊ะ / รูปแบบการสั่งอาหาร
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedTable('Takeaway')}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                          selectedTable === 'Takeaway'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        🛍️ สั่งกลับบ้าน (Takeaway)
                      </button>
                      <button
                        onClick={() => setSelectedTable('Delivery')}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                          selectedTable === 'Delivery'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        🛵 เดลิเวอรี่ (Delivery)
                      </button>

                      {tables.map(tbl => (
                        <button
                          key={tbl.id}
                          onClick={() => setSelectedTable(tbl.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                            selectedTable === tbl.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                              : tbl.status === 'occupied'
                              ? 'bg-amber-50 text-amber-700 border-amber-300 font-bold'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <TableIcon className="w-3.5 h-3.5" />
                          {tbl.name}
                          {tbl.status === 'occupied' && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search and Categories */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ค้นหาเมนูอาหาร..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 scrollbar-none">
                      {categories.map(cat => {
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                              selectedCategory === cat.id
                                ? 'bg-slate-800 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Food Menu Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredMenu.map(item => (
                    <div
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative h-32 w-full bg-slate-100 overflow-hidden">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop'}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-2 right-2 px-2 py-1 bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold rounded-lg">
                            ฿{item.price}
                          </span>
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-slate-800 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="p-3 pt-0">
                        <button className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all">
                          <Plus className="w-3.5 h-3.5" />
                          เพิ่มลงออเดอร์
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Order Cart & Bill Checkout (4 cols) */}
              <div className="lg:col-span-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4 sticky top-6 flex flex-col justify-between min-h-[550px]">
                  <div>
                    {/* Cart Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-indigo-600" />
                          รายการสั่งซื้อ
                        </h2>
                        <p className="text-xs text-indigo-600 font-medium mt-0.5">
                          ปลายทาง: {selectedTable === 'Takeaway' ? '🛍️ สั่งกลับบ้าน' : selectedTable === 'Delivery' ? '🛵 เดลิเวอรี่' : `🪑 โต๊ะ ${tables.find(t=>t.id===selectedTable)?.name || selectedTable}`}
                        </p>
                      </div>

                      {cart.length > 0 && (
                        <button
                          onClick={clearCart}
                          className="text-xs text-rose-500 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> ล้างทั้งหมด
                        </button>
                      )}
                    </div>

                    {/* Cart Items Scroll Container */}
                    <div className="space-y-3 max-h-[300px] overflow-y-auto my-3 pr-1">
                      {cart.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 space-y-2">
                          <UtensilsCrossed className="w-10 h-10 mx-auto stroke-1 text-slate-300" />
                          <p className="text-sm">ยังไม่มีรายการในออเดอร์</p>
                          <p className="text-xs text-slate-400">คลิกเลือกเมนูอาหารด้านซ้ายเพื่อสั่งซื้อ</p>
                        </div>
                      ) : (
                        cart.map((item) => (
                          <div key={item.id} className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm text-slate-800">{item.name}</span>
                              <span className="font-bold text-sm text-indigo-600">฿{item.price * item.qty}</span>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              {/* Notes Input */}
                              <input
                                type="text"
                                placeholder="หมายเหตุ (เช่น ไม่เผ็ด/หวานน้อย)..."
                                value={item.notes || ''}
                                onChange={(e) => updateCartNotes(item.id, e.target.value)}
                                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />

                              {/* Quantity Controls */}
                              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shrink-0">
                                <button
                                  onClick={() => updateCartQty(item.id, -1)}
                                  className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-slate-800">{item.qty}</span>
                                <button
                                  onClick={() => updateCartQty(item.id, 1)}
                                  className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Bill Summary & Action Buttons */}
                  <div className="border-t border-slate-100 pt-3 space-y-3">
                    {/* Additional Fees & Discounts */}
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>ยอดรวมสินค้า (Subtotal)</span>
                        <span className="font-semibold">฿{subtotal}</span>
                      </div>

                      {/* Discount Input */}
                      <div className="flex items-center justify-between gap-2">
                        <span>ส่วนลดพิเศษ (฿)</span>
                        <input
                          type="number"
                          min="0"
                          value={discount}
                          onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-20 text-right bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      {/* Toggle Options */}
                      <div className="flex justify-between items-center pt-1">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeServiceCharge}
                            onChange={(e) => setIncludeServiceCharge(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600"
                          />
                          Service Charge (10%)
                        </label>
                        <span>฿{serviceChargeAmount}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeVat}
                            onChange={(e) => setIncludeVat(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600"
                          />
                          VAT (7%)
                        </label>
                        <span>฿{vatAmount}</span>
                      </div>
                    </div>

                    {/* Net Total */}
                    <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-md">
                      <div>
                        <span className="text-xs text-slate-400 block">ยอดสุทธิ (Total)</span>
                        <span className="text-xl font-bold text-emerald-400">฿{totalAmount}</span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-slate-800 rounded text-slate-300">
                        {cart.reduce((a, b) => a + b.qty, 0)} ชิ้น
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled={cart.length === 0}
                        onClick={() => handleCreateOrder(false)}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        สั่งเข้าครัว
                      </button>
                      <button
                        disabled={cart.length === 0}
                        onClick={() => handleCreateOrder(true)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-1"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        ชำระเงินทันที
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE ORDERS (KDS) */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-indigo-600" />
                  รายการออเดอร์ & สถานะครัว
                </h2>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">ทั้งหมด {orders.length} รายการ</span>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center text-slate-400 space-y-3">
                  <Receipt className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
                  <p className="text-base font-medium">ยังไม่มีออเดอร์ในขณะนี้</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orders.map(order => (
                    <div
                      key={order.id}
                      className={`bg-white rounded-2xl p-5 shadow-sm border transition-all space-y-4 flex flex-col justify-between ${
                        order.status === 'pending'
                          ? 'border-amber-300 bg-amber-50/20'
                          : order.status === 'cooking'
                          ? 'border-indigo-300 bg-indigo-50/20'
                          : order.status === 'served'
                          ? 'border-emerald-300 bg-emerald-50/20'
                          : 'border-slate-200 opacity-80'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Order Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <span className="font-bold text-slate-800 text-base">{order.orderNo}</span>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <TableIcon className="w-3.5 h-3.5 text-indigo-600" />
                              {order.tableName}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${
                              order.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : order.status === 'cooking'
                                ? 'bg-indigo-100 text-indigo-800 animate-pulse'
                                : order.status === 'served'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'paid'
                                ? 'bg-slate-800 text-white'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {order.status === 'pending' && '⏳ รอรับออเดอร์'}
                              {order.status === 'cooking' && '🍳 กำลังทำครัว'}
                              {order.status === 'served' && '✅ เสิร์ฟเรียบร้อย'}
                              {order.status === 'paid' && '💳 ชำระเงินแล้ว'}
                              {order.status === 'cancelled' && '❌ ยกเลิก'}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(order.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        {/* Order Items List */}
                        <div className="space-y-1.5 text-xs text-slate-700 max-h-48 overflow-y-auto pr-1">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-start py-0.5">
                              <div>
                                <span className="font-bold text-slate-900">{it.qty}x</span> {it.name}
                                {it.notes && <span className="block text-[11px] text-amber-600 font-medium">({it.notes})</span>}
                              </div>
                              <span className="font-semibold text-slate-600">฿{it.price * it.qty}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total and Actions */}
                      <div className="border-t border-slate-100 pt-3 space-y-3">
                        <div className="flex justify-between items-center text-sm font-bold text-slate-800">
                          <span>ยอดรวมสุทธิ</span>
                          <span className="text-indigo-600 text-base">฿{order.total}</span>
                        </div>

                        {/* Status Change Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'cooking')}
                              className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-all"
                            >
                              เริ่มปรุงอาหาร
                            </button>
                          )}
                          {order.status === 'cooking' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'served')}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all"
                            >
                              เสิร์ฟอาหารแล้ว
                            </button>
                          )}
                          {order.status !== 'paid' && order.status !== 'cancelled' && (
                            <button
                              onClick={() => {
                                setCurrentPayingOrder(order);
                                setCashReceived(order.total.toString());
                                setPaymentModalOpen(true);
                              }}
                              className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                            >
                              ชำระเงิน
                            </button>
                          )}
                          {order.status === 'paid' && (
                            <button
                              onClick={() => {
                                setReceiptOrder(order);
                                setReceiptModalOpen(true);
                              }}
                              className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                            >
                              <Printer className="w-3.5 h-3.5" /> พิมพ์ใบเสร็จ
                            </button>
                          )}
                          {order.status !== 'paid' && order.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="px-2 py-1.5 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-all"
                            >
                              ยกเลิก
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MENU & SETUP MODE */}
          {activeTab === 'setup' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Column (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  {editingItem ? 'แก้ไขเมนูอาหาร' : 'เพิ่มเมนูอาหารใหม่'}
                </h3>

                <form onSubmit={handleSaveMenuItem} className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ชื่อเมนูอาหาร *</label>
                    <input
                      type="text"
                      required
                      value={itemForm.name}
                      onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                      placeholder="เช่น ผัดไทยกุ้งสด"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">หมวดหมู่ *</label>
                      <select
                        value={itemForm.category}
                        onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                      >
                        <option value="main">อาหารจานหลัก</option>
                        <option value="soup">ต้ม & แกง</option>
                        <option value="appetizer">ทานเล่น</option>
                        <option value="beverage">เครื่องดื่ม</option>
                        <option value="dessert">ของหวาน</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">ราคา (บาท) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={itemForm.price}
                        onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                        placeholder="129"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">รูปภาพ URL</label>
                    <input
                      type="text"
                      value={itemForm.image}
                      onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">รายละเอียด</label>
                    <textarea
                      rows="2"
                      value={itemForm.description}
                      onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                      placeholder="คำอธิบายเมนูอาหาร..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-100"
                    >
                      {editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มรายการเมนู'}
                    </button>
                    {editingItem && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(null);
                          setItemForm({ name: '', category: 'main', price: '', description: '', image: '', ingredients: [] });
                        }}
                        className="w-full mt-2 py-2 bg-slate-100 text-slate-600 font-semibold rounded-xl text-xs"
                      >
                        ยกเลิก
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Menu List Column (7 cols) */}
              <div className="lg:col-span-7 space-y-3">
                <h3 className="font-bold text-slate-800 text-base">รายการเมนูอาหารทั้งหมด ({menuItems.length})</h3>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
                  {menuItems.map(item => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop'}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <div>
                          <span className="font-bold text-slate-800 text-sm block">{item.name}</span>
                          <span className="text-xs text-indigo-600 font-semibold">฿{item.price}</span>
                          <span className="text-[11px] text-slate-400 ml-2">({item.category})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setItemForm(item);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDeleteMenuItem(item.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* --- PAYMENT MODAL --- */}
      {paymentModalOpen && currentPayingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">ชำระเงินออเดอร์</h3>
                <p className="text-xs text-slate-500">{currentPayingOrder.orderNo} ({currentPayingOrder.tableName})</p>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Display */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl text-center">
              <span className="text-xs text-slate-400 block uppercase tracking-wider">ยอดเงินที่ต้องชำระ</span>
              <span className="text-3xl font-extrabold text-emerald-400">฿{currentPayingOrder.total}</span>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`py-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'cash'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span className="text-xs">เงินสด</span>
              </button>

              <button
                onClick={() => setPaymentMethod('promptpay')}
                className={`py-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'promptpay'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span className="text-xs">สแกน QR</span>
              </button>

              <button
                onClick={() => setPaymentMethod('credit')}
                className={`py-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'credit'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">บัตรเครดิต</span>
              </button>
            </div>

            {/* Payment Details Form */}
            {paymentMethod === 'cash' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">รับเงินสดมา (บาท)</label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Fast Cash Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[100, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setCashReceived(amt.toString())}
                      className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                    >
                      +{amt}
                    </button>
                  ))}
                  <button
                    onClick={() => setCashReceived(currentPayingOrder.total.toString())}
                    className="py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold"
                  >
                    พอดี
                  </button>
                </div>

                {/* Change Calculation */}
                {parseFloat(cashReceived) >= currentPayingOrder.total && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center text-emerald-800">
                    <span className="text-xs font-semibold">เงินทอน (Change):</span>
                    <span className="text-lg font-extrabold">฿{(parseFloat(cashReceived) - currentPayingOrder.total).toFixed(0)}</span>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'promptpay' && (
              <div className="text-center py-4 space-y-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-36 h-36 bg-white p-2 rounded-xl mx-auto shadow-sm border border-slate-200 flex items-center justify-center">
                  <QrCode className="w-28 h-28 text-slate-800" />
                </div>
                <p className="text-xs text-slate-500 font-medium">สแกน QR Code PromptPay เพื่อรับชำระเงิน ฿{currentPayingOrder.total}</p>
              </div>
            )}

            {paymentMethod === 'credit' && (
              <div className="p-4 bg-slate-50 rounded-2xl text-center text-slate-600 text-xs space-y-2 border border-slate-100">
                <CreditCard className="w-8 h-8 text-indigo-600 mx-auto" />
                <p>เสียบบัตรหรือแตะบัตร EDC เพื่อรับชำระเงิน</p>
              </div>
            )}

            {/* Confirm Payment Button */}
            <button
              onClick={handleConfirmPayment}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all text-sm flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              ยืนยันการชำระเงิน & ออกใบเสร็จ
            </button>
          </div>
        </div>
      )}

      {/* --- RECEIPT MODAL --- */}
      {receiptModalOpen && receiptOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">ใบเสร็จรับเงิน (Receipt)</h3>
              <button
                onClick={() => setReceiptModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thermal Receipt Body */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 space-y-3">
              <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
                <h4 className="font-bold text-sm text-slate-900 uppercase">RESTAURANT POS</h4>
                <p className="text-[10px] text-slate-500">ใบเสร็จรับเงินอย่างย่อ</p>
                <p className="text-[10px] text-slate-500">เลขประจำตัวผู้เสียภาษี: 0105565000000</p>
              </div>

              <div className="space-y-0.5 text-[11px] text-slate-600 border-b border-dashed border-slate-300 pb-2">
                <p>เลขที่: {receiptOrder.orderNo}</p>
                <p>โต๊ะ: {receiptOrder.tableName}</p>
                <p>วันที่: {new Date(receiptOrder.createdAt).toLocaleString('th-TH')}</p>
              </div>

              {/* Items */}
              <div className="space-y-1 border-b border-dashed border-slate-300 pb-3">
                {receiptOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.qty}x {item.name}</span>
                    <span>฿{item.price * item.qty}</span>
                  </div>
                ))}
              </div>

              {/* Total Calculation */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>ยอดรวม (Subtotal):</span>
                  <span>฿{receiptOrder.subtotal}</span>
                </div>
                {receiptOrder.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>ส่วนลด (Discount):</span>
                    <span>-฿{receiptOrder.discount}</span>
                  </div>
                )}
                {receiptOrder.serviceCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Service Charge (10%):</span>
                    <span>฿{receiptOrder.serviceCharge}</span>
                  </div>
                )}
                {receiptOrder.vat > 0 && (
                  <div className="flex justify-between">
                    <span>VAT (7%):</span>
                    <span>฿{receiptOrder.vat}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-300">
                  <span>สุทธิ (TOTAL):</span>
                  <span>฿{receiptOrder.total}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="border-t border-dashed border-slate-300 pt-2 text-[10px] space-y-0.5 text-slate-600">
                <p>วิธีชำระ: {receiptOrder.paymentMethod === 'cash' ? 'เงินสด' : receiptOrder.paymentMethod === 'promptpay' ? 'PromptPay' : 'บัตรเครดิต'}</p>
                {receiptOrder.paymentMethod === 'cash' && (
                  <>
                    <p>เงินรับ: ฿{receiptOrder.receivedAmount}</p>
                    <p>เงินทอน: ฿{receiptOrder.changeAmount}</p>
                  </>
                )}
              </div>

              <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-dashed border-slate-300">
                *** ขอบคุณที่อุดหนุน ***
              </div>
            </div>

            {/* Print Button */}
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4" /> พิมพ์ใบเสร็จ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
