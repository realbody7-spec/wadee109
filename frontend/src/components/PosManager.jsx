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
  ChefHat, 
  Receipt, 
  Table as TableIcon,
  X,
  Settings,
  User,
  Percent,
  MoreHorizontal,
  Tag,
  FileText,
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

  const categories = [
    { id: 'all', name: 'ทั้งหมด' },
    { id: 'main', name: 'จานหลัก' },
    { id: 'soup', name: 'ต้ม & แกง' },
    { id: 'appetizer', name: 'ทานเล่น' },
    { id: 'beverage', name: 'เครื่องดื่ม' },
    { id: 'dessert', name: 'ของหวาน' },
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
        alert(`บันทึกและส่งออเดอร์ ${createdOrder.orderNo} เรียบร้อยแล้ว!`);
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

  // Filtered menu items
  const filteredMenu = menuItems.filter(item => {
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Calculate empty grid slots to maintain exact 5-column table layout (like image)
  const totalSlotsNeeded = Math.max(20, Math.ceil(filteredMenu.length / 5) * 5);
  const emptySlotsCount = totalSlotsNeeded - filteredMenu.length;
  const emptySlots = Array.from({ length: emptySlotsCount > 0 ? emptySlotsCount : 0 });

  const selectedTableObj = tables.find(t => t.id === selectedTable);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] min-h-[640px] bg-slate-200 overflow-hidden font-sans select-none border border-slate-300">
      
      {/* ================= TOP WORKSPACE (GRID 5 COLS + RECEIPT) ================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ------------ LEFT AREA: EXACT 5-COLUMN FOOD GRID (68% WIDTH) ------------ */}
        <div className="w-[68%] lg:w-[70%] bg-slate-200 p-2.5 flex flex-col justify-between overflow-y-auto">
          
          {/* Main Grid View */}
          {bottomNav === 'menu' && (
            <div className="flex-1 grid grid-cols-5 pos-grid-5 gap-2 overflow-y-auto pr-1 align-content-start">
              {filteredMenu.map(item => {
                const cartQty = cart.find(c => c.id === item.id)?.qty || 0;
                return (
                  <div
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="pos-card-item bg-white rounded border border-slate-300 shadow-2xs hover:shadow hover:border-slate-400 cursor-pointer flex flex-col justify-between active:scale-95 transition-transform overflow-hidden h-[115px] relative"
                  >
                    {cartQty > 0 && (
                      <div className="absolute top-1 left-1 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">
                        {cartQty}x
                      </div>
                    )}
                    {/* Dish Image */}
                    <div className="h-[72px] w-full bg-slate-100 overflow-hidden">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Dish Title Strip */}
                    <div className="h-[43px] px-1 bg-white flex items-center justify-center text-center">
                      <h3 className="font-semibold text-slate-800 text-[11px] leading-tight line-clamp-2">
                        {item.name}
                      </h3>
                    </div>
                  </div>
                );
              })}

              {/* Render Empty White Table Grid Slots (Matching Image) */}
              {emptySlots.map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="bg-white/80 rounded border border-slate-300/80 h-[115px]"
                />
              ))}
            </div>
          )}

          {/* TABLES GRID VIEW */}
          {bottomNav === 'tables' && (
            <div className="flex-1 bg-white p-4 rounded border border-slate-300 overflow-y-auto space-y-3">
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b pb-2">
                <TableIcon className="w-5 h-5 text-indigo-600" />
                เลือกโต๊ะอาหาร
              </h2>
              <div className="grid grid-cols-5 gap-2">
                {tables.map(tbl => (
                  <button
                    key={tbl.id}
                    onClick={() => {
                      setSelectedTable(tbl.id);
                      setSelectedOrderType('dine-in');
                      setBottomNav('menu');
                    }}
                    className={`p-3 rounded border text-center flex flex-col items-center justify-center min-h-[90px] ${
                      selectedTable === tbl.id
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold'
                        : tbl.status === 'occupied'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <TableIcon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">{tbl.name}</span>
                    <span className="text-[10px] text-slate-500">{tbl.capacity} ที่นั่ง</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ORDERS LIST VIEW */}
          {bottomNav === 'orders' && (
            <div className="flex-1 bg-white p-4 rounded border border-slate-300 overflow-y-auto space-y-3">
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b pb-2">
                <ChefHat className="w-5 h-5 text-indigo-600" />
                รายการออเดอร์ทั้งหมด ({orders.length})
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {orders.map(order => (
                  <div key={order.id} className="p-3 rounded border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex justify-between items-start border-b pb-1">
                      <span className="font-bold text-xs text-slate-900">{order.orderNo} ({order.tableName})</span>
                      <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded">{order.status}</span>
                    </div>
                    <div className="space-y-0.5 text-[11px] text-slate-700 max-h-28 overflow-y-auto">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{it.qty}x {it.name}</span>
                          <span>฿{it.price * it.qty}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center border-t pt-1 text-xs font-bold">
                      <span>รวมสุทธิ</span>
                      <span className="text-indigo-600">฿{order.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ------------ RIGHT AREA: RECEIPT PANEL (32% WIDTH) ------------ */}
        <div className="w-[32%] lg:w-[30%] bg-white border-l border-slate-300 flex flex-col justify-between shadow-md">
          
          {/* Header Bar */}
          <div>
            <div className="p-2.5 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50 text-xs">
              <div className="flex items-center gap-1.5 flex-1 bg-white border border-slate-200 px-2 py-1 rounded">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหา..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs focus:outline-none"
                />
              </div>

              <button
                onClick={() => setBottomNav('tables')}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-700 flex items-center gap-1 hover:bg-slate-100"
              >
                <TableIcon className="w-3.5 h-3.5 text-indigo-600" />
                {selectedTableObj?.name || selectedTable}
              </button>
            </div>

            {/* Cart Itemized List */}
            <div className="p-3 space-y-2 max-h-[350px] overflow-y-auto text-xs">
              {cart.length === 0 ? (
                <div className="py-20 text-center text-slate-400 space-y-1">
                  <UtensilsCrossed className="w-8 h-8 mx-auto stroke-1 text-slate-300" />
                  <p className="text-xs">ยังไม่มีรายการสั่งซื้อ</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-1 border-b border-slate-100">
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800">{item.name}</span>
                      <span className="text-[10px] text-slate-400 block">฿{item.price} x {item.qty}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-100 rounded px-1">
                        <button onClick={() => updateCartQty(item.id, -1)} className="w-4 h-4 font-bold text-slate-600">-</button>
                        <span className="w-4 text-center font-bold">{item.qty}</span>
                        <button onClick={() => updateCartQty(item.id, 1)} className="w-4 h-4 font-bold text-slate-600">+</button>
                      </div>
                      <span className="font-bold text-slate-900 w-14 text-right">฿{(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Action Area */}
          <div className="border-t border-slate-200 p-3 bg-slate-50 space-y-2.5">
            {/* Member & Discount Row */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  const name = prompt('ชื่อสมาชิก:');
                  if (name) setCustomerName(name);
                }}
                className="py-1.5 bg-white border border-slate-300 rounded font-semibold text-slate-700 flex items-center justify-center gap-1 hover:bg-slate-100"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                {customerName ? customerName : 'สมาชิก'}
              </button>

              <button
                onClick={() => {
                  const amt = prompt('ระบุส่วนลด (บาท):', discount);
                  if (amt !== null) setDiscount(parseFloat(amt) || 0);
                }}
                className="py-1.5 bg-white border border-slate-300 rounded font-semibold text-slate-700 flex items-center justify-center gap-1 hover:bg-slate-100"
              >
                <Percent className="w-3.5 h-3.5 text-slate-500" />
                {discount > 0 ? `ลด ฿${discount}` : 'ส่วนลดพิเศษ'}
              </button>
            </div>

            {/* Total Amount Display */}
            <div className="flex justify-between items-end pt-1">
              <div>
                <span className="text-[11px] text-slate-500 block">ทั้งหมด ({cart.reduce((a, b) => a + b.qty, 0)} รายการ)</span>
                <span className="text-xl font-bold text-slate-900">฿{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Dual Action Buttons: Blue (บันทึก) & Green (ชำระเงิน) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={cart.length === 0}
                onClick={() => handleCreateOrder(false)}
                className="py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white font-bold rounded text-xs transition-all shadow-sm"
              >
                บันทึก
              </button>

              <button
                disabled={cart.length === 0}
                onClick={() => handleCreateOrder(true)}
                className="py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold rounded text-xs transition-all shadow-sm"
              >
                ชำระเงิน
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= FIXED DARK NAVY BOTTOM TOOLBAR (8 BUTTONS EXACT MATCH) ================= */}
      <div className="h-[58px] bg-[#1a233a] text-slate-300 flex items-center justify-between px-2 shrink-0 border-t border-slate-800 text-xs">
        
        <div className="flex items-center gap-1">
          {/* 1. More options */}
          <button
            onClick={() => setBottomNav('setup')}
            className="p-2 hover:bg-slate-700/60 rounded text-slate-400 hover:text-white"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* 2. Tables */}
          <button
            onClick={() => setBottomNav('tables')}
            className={`flex flex-col items-center justify-center px-3 py-1 rounded transition-all ${
              bottomNav === 'tables' ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-slate-700/60 text-slate-300'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">โต๊ะ</span>
          </button>

          {/* 3. Dine in */}
          <button
            onClick={() => {
              setSelectedOrderType('dine-in');
              setBottomNav('menu');
            }}
            className={`flex flex-col items-center justify-center px-3 py-1 rounded transition-all ${
              selectedOrderType === 'dine-in' && bottomNav === 'menu' ? 'bg-slate-700 text-white font-bold border-b-2 border-indigo-400' : 'hover:bg-slate-700/60 text-slate-300'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">ทานในร้าน</span>
          </button>

          {/* 4. Takeaway */}
          <button
            onClick={() => {
              setSelectedOrderType('takeaway');
              setSelectedTable('Takeaway');
              setBottomNav('menu');
            }}
            className={`flex flex-col items-center justify-center px-3 py-1 rounded transition-all ${
              selectedOrderType === 'takeaway' && bottomNav === 'menu' ? 'bg-slate-700 text-white font-bold border-b-2 border-indigo-400' : 'hover:bg-slate-700/60 text-slate-300'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">สั่งกลับบ้าน</span>
          </button>

          {/* 5. Delivery */}
          <button
            onClick={() => {
              setSelectedOrderType('delivery');
              setSelectedTable('Delivery');
              setBottomNav('menu');
            }}
            className={`flex flex-col items-center justify-center px-3 py-1 rounded transition-all ${
              selectedOrderType === 'delivery' && bottomNav === 'menu' ? 'bg-slate-700 text-white font-bold border-b-2 border-indigo-400' : 'hover:bg-slate-700/60 text-slate-300'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">เดลิเวอรี</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* 6. Menu / Categories */}
          <button
            onClick={() => setBottomNav('menu')}
            className={`flex flex-col items-center justify-center px-3 py-1 rounded transition-all ${
              bottomNav === 'menu' ? 'bg-slate-700 text-white font-bold' : 'hover:bg-slate-700/60 text-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">เมนูอาหาร</span>
          </button>

          {/* 7. Promotions */}
          <button
            onClick={() => {
              const amt = prompt('ระบุส่วนลดโปรโมชัน (บาท):');
              if (amt) setDiscount(parseFloat(amt) || 0);
            }}
            className="flex flex-col items-center justify-center px-3 py-1 rounded hover:bg-slate-700/60 transition-all text-slate-300"
          >
            <Tag className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] mt-0.5">โปรโมชัน</span>
          </button>

          {/* 8. Orders */}
          <button
            onClick={() => setBottomNav('orders')}
            className={`flex flex-col items-center justify-center px-3 py-1 rounded transition-all ${
              bottomNav === 'orders' ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-slate-700/60 text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">รายการ ({orders.length})</span>
          </button>
        </div>
      </div>

      {/* --- PAYMENT MODAL --- */}
      {paymentModalOpen && currentPayingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">ชำระเงินออเดอร์</h3>
                <p className="text-xs text-slate-500">{currentPayingOrder.orderNo} ({currentPayingOrder.tableName})</p>
              </div>
              <button onClick={() => setPaymentModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-xl text-center">
              <span className="text-xs text-slate-400 block">ยอดเงินที่ต้องชำระ</span>
              <span className="text-3xl font-extrabold text-emerald-400">฿{currentPayingOrder.total.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`py-2.5 rounded border flex flex-col items-center gap-1 ${
                  paymentMethod === 'cash' ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold' : 'border-slate-200'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>เงินสด</span>
              </button>

              <button
                onClick={() => setPaymentMethod('promptpay')}
                className={`py-2.5 rounded border flex flex-col items-center gap-1 ${
                  paymentMethod === 'promptpay' ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold' : 'border-slate-200'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>สแกน QR</span>
              </button>

              <button
                onClick={() => setPaymentMethod('credit')}
                className={`py-2.5 rounded border flex flex-col items-center gap-1 ${
                  paymentMethod === 'credit' ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold' : 'border-slate-200'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>บัตรเครดิต</span>
              </button>
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-2 text-xs">
                <label className="font-semibold text-slate-700 block">รับเงินสดมา (บาท)</label>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded text-base font-bold text-slate-800"
                />

                <div className="grid grid-cols-4 gap-1">
                  {[100, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setCashReceived(amt.toString())}
                      className="py-1 bg-slate-100 text-slate-700 rounded font-semibold"
                    >
                      +{amt}
                    </button>
                  ))}
                  <button
                    onClick={() => setCashReceived(currentPayingOrder.total.toString())}
                    className="py-1 bg-indigo-50 text-indigo-700 rounded font-bold"
                  >
                    พอดี
                  </button>
                </div>

                {parseFloat(cashReceived) >= currentPayingOrder.total && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded flex justify-between items-center text-emerald-800">
                    <span>เงินทอน:</span>
                    <span className="text-base font-bold">฿{(parseFloat(cashReceived) - currentPayingOrder.total).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleConfirmPayment}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded text-xs transition-all shadow-md"
            >
              ยืนยันการชำระเงิน & ออกใบเสร็จ
            </button>
          </div>
        </div>
      )}

      {/* --- RECEIPT MODAL --- */}
      {receiptModalOpen && receiptOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-800 text-sm">ใบเสร็จรับเงิน (Receipt)</h3>
              <button onClick={() => setReceiptModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded border border-slate-200 font-mono text-xs text-slate-800 space-y-2">
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                <h4 className="font-bold text-sm text-slate-900">RESTAURANT POS</h4>
                <p className="text-[10px] text-slate-500">ใบเสร็จรับเงินอย่างย่อ</p>
              </div>

              <div className="space-y-0.5 text-[10px] text-slate-600 border-b border-dashed border-slate-300 pb-2">
                <p>เลขที่: {receiptOrder.orderNo}</p>
                <p>โต๊ะ: {receiptOrder.tableName}</p>
                <p>วันที่: {new Date(receiptOrder.createdAt).toLocaleString('th-TH')}</p>
              </div>

              <div className="space-y-1 border-b border-dashed border-slate-300 pb-2">
                {receiptOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.qty}x {item.name}</span>
                    <span>฿{item.price * item.qty}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-bold text-slate-900 pt-1">
                <span>ยอดสุทธิ (TOTAL):</span>
                <span>฿{receiptOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded text-xs flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" /> พิมพ์ใบเสร็จ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
