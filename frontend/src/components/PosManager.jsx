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
  ChevronRight,
  Layers,
  Sparkles,
  Edit3,
  Check
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
  const [selectedTable, setSelectedTable] = useState('T01');
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

  // Quick Preset Notes for Food
  const presetNotes = ['ไม่เผ็ด', 'เผ็ดน้อย', 'เผ็ดมาก', 'หวานน้อย', 'ไม่ใส่ผัก', 'แยกน้ำ', 'เพิ่มไข่ดาว'];

  const categories = [
    { id: 'all', name: 'ทั้งหมด', icon: UtensilsCrossed },
    { id: 'main', name: 'จานหลัก', icon: UtensilsCrossed },
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

  const addPresetNoteToItem = (id, noteText) => {
    setCart(prevCart => prevCart.map(i => {
      if (i.id === id) {
        const existingNotes = i.notes ? i.notes.split(', ') : [];
        if (existingNotes.includes(noteText)) {
          const filtered = existingNotes.filter(n => n !== noteText);
          return { ...i, notes: filtered.join(', ') };
        } else {
          return { ...i, notes: [...existingNotes, noteText].join(', ') };
        }
      }
      return i;
    }));
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
        alert(`บันทึกส่งออเดอร์ ${createdOrder.orderNo} เข้าครัวเรียบร้อยแล้ว!`);
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
    <div className="flex flex-col h-[calc(100vh-80px)] min-h-[680px] bg-slate-100 overflow-hidden font-sans select-none rounded-3xl shadow-2xl border border-slate-300">
      
      {/* ================= TOP POS WORKSPACE (90% HEIGHT) ================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ------------ LEFT SIDE: MENU & FOOD SELECTION GRID (70% WIDTH) ------------ */}
        <div className="w-[68%] lg:w-[72%] bg-slate-100 p-4 flex flex-col justify-between overflow-y-auto">
          
          {/* Header Search & Category Filter */}
          <div className="space-y-3 mb-3 shrink-0">
            <div className="flex items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="พิมพ์ค้นหาเมนูอาหาร..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 shadow-2xs"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Order Mode Badge */}
              <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-slate-200 shadow-2xs text-xs font-bold text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>โหมด: {selectedOrderType === 'takeaway' ? '🛍️ สั่งกลับบ้าน' : selectedOrderType === 'delivery' ? '🛵 เดลิเวอรี' : `🪑 ${selectedTableObj?.name || selectedTable}`}</span>
              </div>
            </div>

            {/* Category Chips Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map(cat => {
                const Icon = cat.icon;
                const count = cat.id === 'all' ? menuItems.length : menuItems.filter(m => m.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-2xs ${
                      selectedCategory === cat.id
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.name}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      selectedCategory === cat.id ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN GRID VIEW: FOOD MENU */}
          {bottomNav === 'menu' && (
            <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3.5 overflow-y-auto pr-1">
              {filteredMenu.map(item => {
                const cartQty = cart.find(c => c.id === item.id)?.qty || 0;
                return (
                  <div
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className={`bg-white rounded-2xl overflow-hidden border transition-all cursor-pointer flex flex-col justify-between group active:scale-95 relative ${
                      cartQty > 0 ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md' : 'border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-400'
                    }`}
                  >
                    {/* Quantity Badge on food card */}
                    {cartQty > 0 && (
                      <div className="absolute top-2 left-2 z-10 bg-indigo-600 text-white w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shadow-md animate-in zoom-in-50">
                        {cartQty}
                      </div>
                    )}

                    {/* Food Image Container */}
                    <div className="aspect-4/3 w-full bg-slate-100 overflow-hidden relative">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop'}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                      />
                      {/* Price Badge */}
                      <span className="absolute bottom-2 right-2 px-2.5 py-1 bg-slate-900/85 backdrop-blur-md text-white text-xs font-black rounded-xl shadow-md">
                        ฿{item.price}
                      </span>
                    </div>

                    {/* Food Details Title */}
                    <div className="p-2.5 text-center bg-white">
                      <h3 className="font-bold text-slate-800 text-xs line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {item.name}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TABLES SELECTION GRID */}
          {bottomNav === 'tables' && (
            <div className="flex-1 bg-white p-6 rounded-3xl border border-slate-200/90 overflow-y-auto space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <TableIcon className="w-5 h-5 text-indigo-600" />
                  เลือกโต๊ะอาหาร (Table Selection)
                </h2>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> ว่าง (Available)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> กำลังใช้บริการ (Occupied)</span>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
                {tables.map(tbl => (
                  <button
                    key={tbl.id}
                    onClick={() => {
                      setSelectedTable(tbl.id);
                      setSelectedOrderType('dine-in');
                      setBottomNav('menu');
                    }}
                    className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-between min-h-[110px] active:scale-95 ${
                      selectedTable === tbl.id
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-md font-bold'
                        : tbl.status === 'occupied'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <TableIcon className="w-6 h-6 mb-1" />
                    <span className="text-sm font-black">{tbl.name}</span>
                    <span className="text-[10px] text-slate-500">{tbl.capacity} ที่นั่ง</span>
                    {tbl.status === 'occupied' && (
                      <span className="mt-1 px-2 py-0.5 bg-amber-500 text-white text-[9px] font-extrabold rounded-full">มีลูกค้า</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVE ORDERS LIST (KDS) */}
          {bottomNav === 'orders' && (
            <div className="flex-1 bg-white p-6 rounded-3xl border border-slate-200/90 overflow-y-auto space-y-4 shadow-2xs">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2 border-b pb-3">
                <ChefHat className="w-5 h-5 text-indigo-600" />
                รายการออเดอร์ทั้งหมด ({orders.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {orders.map(order => (
                  <div key={order.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-3 shadow-2xs">
                    <div className="flex justify-between items-start border-b pb-2">
                      <div>
                        <span className="font-bold text-sm text-slate-900">{order.orderNo}</span>
                        <p className="text-xs text-slate-500">{order.tableName}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        order.status === 'paid' ? 'bg-slate-900 text-white' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {order.status === 'pending' ? '⏳ รอยืนยัน' : order.status === 'cooking' ? '🍳 ปรุงอาหาร' : order.status === 'served' ? '✅ เสิร์ฟแล้ว' : '💳 ชำระแล้ว'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-700 max-h-36 overflow-y-auto">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{it.qty}x {it.name}</span>
                          <span className="font-semibold">฿{it.price * it.qty}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center border-t pt-2 text-xs font-bold">
                      <span>ยอดสุทธิ</span>
                      <span className="text-indigo-600 text-sm">฿{order.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ------------ RIGHT SIDE: ORDER RECEIPT SIDEBAR (32% WIDTH) ------------ */}
        <div className="w-[32%] lg:w-[28%] bg-white border-l border-slate-200/90 flex flex-col justify-between shadow-xl z-10">
          
          {/* Bill Top Bar */}
          <div>
            <div className="p-4 bg-slate-50/90 border-b border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">สถานที่ / โต๊ะ:</span>
                <span className="font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200 shadow-2xs">
                  {selectedOrderType === 'takeaway' ? '🛍️ สั่งกลับบ้าน' : selectedOrderType === 'delivery' ? '🛵 เดลิเวอรี' : `🪑 ${selectedTableObj?.name || selectedTable}`}
                </span>
              </div>

              {cart.length > 0 && (
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-slate-400 font-medium">รายการในบิล ({cart.reduce((a, b) => a + b.qty, 0)} ชิ้น)</span>
                  <button onClick={clearCart} className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> ล้างบิล
                  </button>
                </div>
              )}
            </div>

            {/* Cart Itemized List */}
            <div className="p-3.5 space-y-3 max-h-[360px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="py-24 text-center text-slate-400 space-y-2">
                  <UtensilsCrossed className="w-10 h-10 mx-auto stroke-1 text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">ไม่มีรายการในบิล</p>
                  <p className="text-[11px] text-slate-400">เลือกเมนูอาหารด้านซ้ายเพื่อสั่งซื้อ</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="p-2.5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2 shadow-2xs">
                    <div className="flex justify-between items-start text-xs font-bold text-slate-800">
                      <span className="line-clamp-1">{item.name}</span>
                      <span className="text-slate-900 font-black">฿{(item.price * item.qty).toFixed(2)}</span>
                    </div>

                    {/* Quantity Controls & Price */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">฿{item.price} x {item.qty}</span>

                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-1 py-0.5 shadow-2xs">
                        <button
                          onClick={() => updateCartQty(item.id, -1)}
                          className="w-6 h-6 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center font-black text-slate-700 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-black text-slate-800 text-xs">{item.qty}</span>
                        <button
                          onClick={() => updateCartQty(item.id, 1)}
                          className="w-6 h-6 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center font-black text-slate-700 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Preset Notes Chips */}
                    <div className="pt-1 flex flex-wrap gap-1">
                      {presetNotes.map(n => {
                        const active = item.notes && item.notes.includes(n);
                        return (
                          <button
                            key={n}
                            onClick={() => addPresetNoteToItem(item.id, n)}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                              active ? 'bg-amber-500 text-white font-bold' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {n}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bill Footer & Action Buttons Section */}
          <div className="border-t border-slate-200 p-4 bg-slate-50/90 space-y-3">
            {/* Member & Discount Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const name = prompt('ระบุชื่อสมาชิก / ลูกค้า:');
                  if (name) setCustomerName(name);
                }}
                className="py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 hover:bg-slate-100 shadow-2xs transition-all"
              >
                <User className="w-3.5 h-3.5 text-indigo-600" />
                {customerName ? customerName : 'สมาชิก'}
              </button>

              <button
                onClick={() => {
                  const amt = prompt('ระบุส่วนลดพิเศษ (บาท):', discount);
                  if (amt !== null) setDiscount(parseFloat(amt) || 0);
                }}
                className="py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 hover:bg-slate-100 shadow-2xs transition-all"
              >
                <Percent className="w-3.5 h-3.5 text-indigo-600" />
                {discount > 0 ? `ลด ฿${discount}` : 'ส่วนลดพิเศษ'}
              </button>
            </div>

            {/* Subtotal & Net Total Display */}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-end">
              <div>
                <span className="text-[11px] text-slate-500 block font-medium">รวมสินค้า ({cart.reduce((a, b) => a + b.qty, 0)} ชิ้น)</span>
                <span className="text-2xl font-black text-slate-900 tracking-tight">฿{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* DUAL ACTION BUTTONS: SAVE (BLUE) & PAY (GREEN) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                disabled={cart.length === 0}
                onClick={() => handleCreateOrder(false)}
                className="py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white font-bold rounded-2xl text-sm transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Check className="w-4 h-4" />
                บันทึก
              </button>

              <button
                disabled={cart.length === 0}
                onClick={() => handleCreateOrder(true)}
                className="py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold rounded-2xl text-sm transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <CreditCard className="w-4 h-4" />
                ชำระเงิน
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= FIXED DARK BOTTOM POS TOOLBAR ================= */}
      <div className="h-[64px] bg-slate-900 text-slate-300 flex items-center justify-between px-4 shrink-0 border-t border-slate-800 shadow-2xl">
        
        {/* Left Toolbar Items */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Settings button */}
          <button
            onClick={() => setBottomNav('setup')}
            className="p-2 hover:bg-slate-800 rounded-2xl transition-all text-slate-400 hover:text-white"
            title="ตั้งค่า"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {/* Tables button */}
          <button
            onClick={() => setBottomNav('tables')}
            className={`flex flex-col items-center justify-center px-3.5 py-1 rounded-2xl transition-all ${
              bottomNav === 'tables' ? 'bg-indigo-600 text-white font-bold shadow-md' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span className="text-[10px] font-bold mt-0.5">โต๊ะ</span>
          </button>

          {/* Dine-in Button */}
          <button
            onClick={() => {
              setSelectedOrderType('dine-in');
              setBottomNav('menu');
            }}
            className={`flex flex-col items-center justify-center px-3.5 py-1 rounded-2xl transition-all ${
              selectedOrderType === 'dine-in' && bottomNav === 'menu' ? 'bg-slate-800 text-white font-bold border-b-2 border-indigo-400' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span className="text-[10px] font-bold mt-0.5">ทานในร้าน</span>
          </button>

          {/* Takeaway Button */}
          <button
            onClick={() => {
              setSelectedOrderType('takeaway');
              setSelectedTable('Takeaway');
              setBottomNav('menu');
            }}
            className={`flex flex-col items-center justify-center px-3.5 py-1 rounded-2xl transition-all ${
              selectedOrderType === 'takeaway' && bottomNav === 'menu' ? 'bg-slate-800 text-white font-bold border-b-2 border-indigo-400' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-[10px] font-bold mt-0.5">สั่งกลับบ้าน</span>
          </button>

          {/* Delivery Button */}
          <button
            onClick={() => {
              setSelectedOrderType('delivery');
              setSelectedTable('Delivery');
              setBottomNav('menu');
            }}
            className={`flex flex-col items-center justify-center px-3.5 py-1 rounded-2xl transition-all ${
              selectedOrderType === 'delivery' && bottomNav === 'menu' ? 'bg-slate-800 text-white font-bold border-b-2 border-indigo-400' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span className="text-[10px] font-bold mt-0.5">เดลิเวอรี</span>
          </button>
        </div>

        {/* Right Toolbar Items */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Menu Categories Button */}
          <button
            onClick={() => setBottomNav('menu')}
            className={`flex flex-col items-center justify-center px-3.5 py-1 rounded-2xl transition-all ${
              bottomNav === 'menu' ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[10px] font-bold mt-0.5">เมนูอาหาร</span>
          </button>

          {/* Promotion Button */}
          <button
            onClick={() => {
              const amt = prompt('ระบุส่วนลดโปรโมชัน (บาท):');
              if (amt) setDiscount(parseFloat(amt) || 0);
            }}
            className="flex flex-col items-center justify-center px-3.5 py-1 rounded-2xl hover:bg-slate-800 transition-all text-slate-300"
          >
            <Tag className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-bold mt-0.5">โปรโมชัน</span>
          </button>

          {/* Orders / KDS List Button */}
          <button
            onClick={() => setBottomNav('orders')}
            className={`flex flex-col items-center justify-center px-3.5 py-1 rounded-2xl transition-all relative ${
              bottomNav === 'orders' ? 'bg-indigo-600 text-white font-bold shadow-md' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-[10px] font-bold mt-0.5">ออเดอร์ ({orders.length})</span>
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
              <span className="text-3xl font-black text-emerald-400">฿{currentPayingOrder.total.toFixed(2)}</span>
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
                    <span className="text-lg font-black">฿{(parseFloat(cashReceived) - currentPayingOrder.total).toFixed(2)}</span>
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
