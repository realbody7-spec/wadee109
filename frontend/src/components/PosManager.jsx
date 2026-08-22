import React, { useState, useEffect } from 'react';
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
  ChefHat, 
  Receipt, 
  Table as TableIcon,
  X,
  Settings,
  User,
  Percent,
  MoreHorizontal,
  Home,
  Tag,
  FileText,
  ChevronUp,
  Layers
} from 'lucide-react';

export default function PosManager({ inventory = [], onRefreshInventory }) {
  // Navigation / View Modes
  const [bottomNav, setBottomNav] = useState('menu'); // 'menu' | 'tables' | 'orders' | 'setup'
  
  // Data states
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cart & Order state
  const [selectedTable, setSelectedTable] = useState('Takeaway');
  const [selectedOrderType, setSelectedOrderType] = useState('dine-in'); // 'dine-in' | 'takeaway' | 'delivery'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]); // [{ id, name, price, qty, notes }]
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState('');

  // Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [currentPayingOrder, setCurrentPayingOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'promptpay' | 'credit'
  const [cashReceived, setCashReceived] = useState('');
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);

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

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCustomerName('');
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const discountAmount = Number(discount) || 0;
  const totalAmount = Math.max(0, subtotal - discountAmount);

  // Submit Order (Save / Send to Kitchen)
  const handleCreateOrder = async (isDirectPay = false) => {
    if (cart.length === 0) return;

    const tableObj = tables.find(t => t.id === selectedTable);
    const tableName = selectedOrderType === 'takeaway' ? 'สั่งกลับบ้าน' : selectedOrderType === 'delivery' ? 'เดลิเวอรี่' : (tableObj ? tableObj.name : selectedTable);

    const orderPayload = {
      tableId: selectedOrderType === 'dine-in' ? selectedTable : selectedOrderType,
      tableName,
      orderType: selectedOrderType,
      items: cart,
      subtotal,
      discount: discountAmount,
      serviceCharge: 0,
      vat: 0,
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
        alert(`บันทึกและส่งออเดอร์ ${createdOrder.orderNo} เข้าครัวเรียบร้อยแล้ว!`);
      }
    } catch (err) {
      console.error('Error creating order:', err);
      alert('เกิดข้อผิดพลาดในการสร้างออเดอร์');
    }
  };

  // Handle Confirm Payment
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

  // Filtered menu items
  const filteredMenu = menuItems.filter(item => {
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const selectedTableObj = tables.find(t => t.id === selectedTable);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] min-h-[650px] bg-slate-200 overflow-hidden font-sans select-none rounded-2xl shadow-xl border border-slate-300">
      
      {/* ================= MAIN CONTENT SPLIT (TOP 90%) ================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ------------ LEFT SIDE: FOOD ITEMS GRID (70% WIDTH) ------------ */}
        <div className="w-[68%] lg:w-[72%] bg-slate-100 p-4 flex flex-col justify-between overflow-y-auto">
          
          {/* Top Search & Category Bar */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาเมนูอาหาร..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            {/* Category Quick Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-[50%] scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grid View Selection: Menu vs Tables vs Orders vs Setup */}
          {bottomNav === 'menu' && (
            <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 overflow-y-auto pr-1">
              {filteredMenu.map(item => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer flex flex-col justify-between group active:scale-95"
                >
                  <div className="aspect-square w-full bg-slate-100 overflow-hidden relative">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop'}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <span className="absolute top-1.5 right-1.5 px-2 py-0.5 bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-extrabold rounded-md shadow">
                      ฿{item.price}
                    </span>
                  </div>

                  <div className="p-2.5 text-center bg-white border-t border-slate-100">
                    <h3 className="font-bold text-slate-800 text-xs line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {item.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TABLES VIEW (IF CLICKED FROM BOTTOM NAV) */}
          {bottomNav === 'tables' && (
            <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-200 overflow-y-auto space-y-4">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2 border-b pb-3">
                <TableIcon className="w-5 h-5 text-indigo-600" />
                เลือกโต๊ะอาหาร (Table Selection)
              </h2>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {tables.map(tbl => (
                  <button
                    key={tbl.id}
                    onClick={() => {
                      setSelectedTable(tbl.id);
                      setSelectedOrderType('dine-in');
                      setBottomNav('menu');
                    }}
                    className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-between min-h-[100px] ${
                      selectedTable === tbl.id
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-md font-bold'
                        : tbl.status === 'occupied'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <TableIcon className="w-6 h-6 mb-1" />
                    <span className="text-sm font-extrabold">{tbl.name}</span>
                    <span className="text-[10px] text-slate-500">{tbl.capacity} ที่นั่ง</span>
                    {tbl.status === 'occupied' && (
                      <span className="mt-1 px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full">กำลังใช้งาน</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ORDERS VIEW (KDS) */}
          {bottomNav === 'orders' && (
            <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-200 overflow-y-auto space-y-4">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2 border-b pb-3">
                <ChefHat className="w-5 h-5 text-indigo-600" />
                ออเดอร์ทั้งหมด ({orders.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {orders.map(order => (
                  <div key={order.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex justify-between items-start border-b pb-2">
                      <div>
                        <span className="font-bold text-sm text-slate-800">{order.orderNo}</span>
                        <p className="text-xs text-slate-500">{order.tableName}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        order.status === 'paid' ? 'bg-slate-900 text-white' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-700 max-h-32 overflow-y-auto">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{it.qty}x {it.name}</span>
                          <span>฿{it.price * it.qty}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center border-t pt-2 text-xs font-bold">
                      <span>ยอดสุทธิ</span>
                      <span className="text-indigo-600">฿{order.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ------------ RIGHT SIDE: ORDER BILL SIDEBAR (32% WIDTH) ------------ */}
        <div className="w-[32%] lg:w-[28%] bg-white border-l border-slate-300 flex flex-col justify-between shadow-lg">
          
          {/* Bill Top Bar: Table & Customer selector */}
          <div>
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">สถานที่ / รูปแบบ:</span>
                <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                  {selectedOrderType === 'takeaway' ? '🛍️ สั่งกลับบ้าน' : selectedOrderType === 'delivery' ? '🛵 เดลิเวอรี' : `🪑 ${selectedTableObj?.name || selectedTable}`}
                </span>
              </div>

              {cart.length > 0 && (
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[11px] text-slate-400">รายการสั่งซื้อในบิล</span>
                  <button onClick={clearCart} className="text-[11px] text-rose-500 font-bold hover:underline">
                    ล้างบิล
                  </button>
                </div>
              )}
            </div>

            {/* Itemized Cart List */}
            <div className="p-3 space-y-2 max-h-[350px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="py-20 text-center text-slate-400 space-y-2">
                  <UtensilsCrossed className="w-8 h-8 mx-auto stroke-1 text-slate-300" />
                  <p className="text-xs font-medium">ไม่มีรายการสินค้าในบิล</p>
                  <p className="text-[10px] text-slate-400">เลือกเมนูอาหารทางด้านซ้ายเพื่อสั่งซื้อ</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="py-2 border-b border-slate-100 space-y-1">
                    <div className="flex justify-between items-start text-xs font-bold text-slate-800">
                      <span className="line-clamp-1">{item.name}</span>
                      <span className="text-slate-900">฿{(item.price * item.qty).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">฿{item.price} x {item.qty}</span>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 bg-slate-100 rounded-md px-1 py-0.5">
                        <button
                          onClick={() => updateCartQty(item.id, -1)}
                          className="w-5 h-5 bg-white rounded flex items-center justify-center font-bold text-slate-600 shadow-2xs hover:bg-slate-200"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-extrabold text-slate-800">{item.qty}</span>
                        <button
                          onClick={() => updateCartQty(item.id, 1)}
                          className="w-5 h-5 bg-white rounded flex items-center justify-center font-bold text-slate-600 shadow-2xs hover:bg-slate-200"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bill Bottom Summary & Action Section */}
          <div className="border-t border-slate-200 p-3.5 bg-slate-50 space-y-3">
            {/* Member & Discount Action Row */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const name = prompt('ระบุชื่อสมาชิก / ลูกค้า:');
                  if (name) setCustomerName(name);
                }}
                className="py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 flex items-center justify-center gap-1.5 hover:bg-slate-100"
              >
                <User className="w-3.5 h-3.5 text-indigo-600" />
                {customerName ? customerName : 'สมาชิก'}
              </button>

              <button
                onClick={() => {
                  const amt = prompt('ระบุส่วนลดพิเศษ (บาท):', discount);
                  if (amt !== null) setDiscount(parseFloat(amt) || 0);
                }}
                className="py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 flex items-center justify-center gap-1.5 hover:bg-slate-100"
              >
                <Percent className="w-3.5 h-3.5 text-indigo-600" />
                {discount > 0 ? `ลด ฿${discount}` : 'ส่วนลดพิเศษ'}
              </button>
            </div>

            {/* Total Item Count & Big Amount Display */}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-end">
              <div>
                <span className="text-[11px] text-slate-500 block">ทั้งหมด ({cart.reduce((a, b) => a + b.qty, 0)} รายการ)</span>
                <span className="text-2xl font-black text-slate-900">฿{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Two Main Action Buttons: Save (Blue) & Pay (Green) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                disabled={cart.length === 0}
                onClick={() => handleCreateOrder(false)}
                className="py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-1 active:scale-95"
              >
                บันทึก
              </button>

              <button
                disabled={cart.length === 0}
                onClick={() => handleCreateOrder(true)}
                className="py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-1 active:scale-95"
              >
                ชำระเงิน
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM POS TOOLBAR (NAVY BAR 10%) ================= */}
      <div className="h-[64px] bg-[#1e293b] text-slate-300 flex items-center justify-between px-3 shrink-0 border-t border-slate-800">
        
        {/* Left Toolbar Items */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* More settings button */}
          <button
            onClick={() => setBottomNav('setup')}
            className="p-2 hover:bg-slate-700/60 rounded-xl transition-all text-slate-400 hover:text-white"
            title="ตั้งค่า"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {/* Tables button */}
          <button
            onClick={() => setBottomNav('tables')}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all ${
              bottomNav === 'tables' ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-slate-700/60 text-slate-300'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span className="text-[10px] font-semibold mt-0.5">โต๊ะ</span>
          </button>

          {/* Order Type: Dine-in */}
          <button
            onClick={() => {
              setSelectedOrderType('dine-in');
              setBottomNav('menu');
            }}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all ${
              selectedOrderType === 'dine-in' && bottomNav === 'menu' ? 'bg-slate-700 text-white font-bold border-b-2 border-indigo-400' : 'hover:bg-slate-700/60 text-slate-300'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span className="text-[10px] font-semibold mt-0.5">ทานในร้าน</span>
          </button>

          {/* Order Type: Takeaway */}
          <button
            onClick={() => {
              setSelectedOrderType('takeaway');
              setSelectedTable('Takeaway');
              setBottomNav('menu');
            }}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all ${
              selectedOrderType === 'takeaway' && bottomNav === 'menu' ? 'bg-slate-700 text-white font-bold border-b-2 border-indigo-400' : 'hover:bg-slate-700/60 text-slate-300'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-[10px] font-semibold mt-0.5">สั่งกลับบ้าน</span>
          </button>

          {/* Order Type: Delivery */}
          <button
            onClick={() => {
              setSelectedOrderType('delivery');
              setSelectedTable('Delivery');
              setBottomNav('menu');
            }}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all ${
              selectedOrderType === 'delivery' && bottomNav === 'menu' ? 'bg-slate-700 text-white font-bold border-b-2 border-indigo-400' : 'hover:bg-slate-700/60 text-slate-300'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span className="text-[10px] font-semibold mt-0.5">เดลิเวอรี</span>
          </button>
        </div>

        {/* Right Toolbar Items */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Categories button */}
          <button
            onClick={() => setBottomNav('menu')}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all ${
              bottomNav === 'menu' ? 'bg-slate-700 text-white font-bold' : 'hover:bg-slate-700/60 text-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[10px] font-semibold mt-0.5">เมนูอาหาร</span>
          </button>

          {/* Promotion Button */}
          <button
            onClick={() => {
              const amt = prompt('ระบุส่วนลดโปรโมชัน (บาท):');
              if (amt) setDiscount(parseFloat(amt) || 0);
            }}
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-xl hover:bg-slate-700/60 transition-all text-slate-300"
          >
            <Tag className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-semibold mt-0.5">โปรโมชัน</span>
          </button>

          {/* Orders / KDS List button */}
          <button
            onClick={() => setBottomNav('orders')}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all relative ${
              bottomNav === 'orders' ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-slate-700/60 text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-[10px] font-semibold mt-0.5">ออเดอร์ ({orders.length})</span>
          </button>
        </div>
      </div>

      {/* --- PAYMENT MODAL --- */}
      {paymentModalOpen && currentPayingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">ชำระเงินออเดอร์</h3>
                <p className="text-xs text-slate-500">{currentPayingOrder.orderNo} ({currentPayingOrder.tableName})</p>
              </div>
              <button onClick={() => setPaymentModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-2xl text-center">
              <span className="text-xs text-slate-400 block uppercase tracking-wider">ยอดเงินที่ต้องชำระ</span>
              <span className="text-3xl font-extrabold text-emerald-400">฿{currentPayingOrder.total.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`py-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'cash' ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold' : 'border-slate-200 text-slate-600'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span className="text-xs">เงินสด</span>
              </button>

              <button
                onClick={() => setPaymentMethod('promptpay')}
                className={`py-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'promptpay' ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold' : 'border-slate-200 text-slate-600'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span className="text-xs">สแกน QR</span>
              </button>

              <button
                onClick={() => setPaymentMethod('credit')}
                className={`py-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'credit' ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold' : 'border-slate-200 text-slate-600'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">บัตรเครดิต</span>
              </button>
            </div>

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

                {parseFloat(cashReceived) >= currentPayingOrder.total && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center text-emerald-800">
                    <span className="text-xs font-semibold">เงินทอน (Change):</span>
                    <span className="text-lg font-extrabold">฿{(parseFloat(cashReceived) - currentPayingOrder.total).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleConfirmPayment}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all text-sm flex items-center justify-center gap-2"
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
              <button onClick={() => setReceiptModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 space-y-3">
              <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
                <h4 className="font-bold text-sm text-slate-900 uppercase">RESTAURANT POS</h4>
                <p className="text-[10px] text-slate-500">ใบเสร็จรับเงินอย่างย่อ</p>
              </div>

              <div className="space-y-0.5 text-[11px] text-slate-600 border-b border-dashed border-slate-300 pb-2">
                <p>เลขที่: {receiptOrder.orderNo}</p>
                <p>โต๊ะ: {receiptOrder.tableName}</p>
                <p>วันที่: {new Date(receiptOrder.createdAt).toLocaleString('th-TH')}</p>
              </div>

              <div className="space-y-1 border-b border-dashed border-slate-300 pb-3">
                {receiptOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.qty}x {item.name}</span>
                    <span>฿{item.price * item.qty}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>ยอดสุทธิ (TOTAL):</span>
                  <span>฿{receiptOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md"
            >
              <Printer className="w-4 h-4" /> พิมพ์ใบเสร็จ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
