import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function WaiterDashboard() {
  const [activeTab, setActiveTab] = useState('new-order');
  const [orders, setOrders] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  const [items, setItems] = useState([{ item_name: '', quantity: 1, price: 0 }]);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);
  const [todayHours, setTodayHours] = useState(0);
  const [salaryData, setSalaryData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchMyOrders();
    fetchSalaryStatus();
    checkAttendance();
  }, []);

  const fetchMyOrders = async () => {
    const res = await fetch('/api/orders/my-orders');
    const data = await res.json();
    setOrders(data.orders || []);
  };

  const fetchSalaryStatus = async () => {
    try {
      const now = new Date();
      const res = await fetch('/api/salary/status?month=' + (now.getMonth()+1) + '&year=' + now.getFullYear());
      const data = await res.json();
      setSalaryData(data);
    } catch {}
  };

  const checkAttendance = async () => {
    try {
      const res = await fetch('/api/attendance/check-status');
      const data = await res.json();
      if (data.checkedIn) setCheckedIn(true);
      if (data.hours) setTodayHours(data.hours);
    } catch {}
  };

  const handleCheckIn = async () => {
    const res = await fetch('/api/attendance/checkin', { method: 'POST' });
    if (res.ok) { setCheckedIn(true); setMessage('Checked in successfully'); }
  };

  const handleCheckOut = async () => {
    const res = await fetch('/api/attendance/checkout', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setCheckedIn(false);
      setTodayHours(data.hoursWorked);
      setMessage('Checked out. Hours worked: ' + data.hoursWorked);
    }
  };

  const addItem = function() { setItems([...items, { item_name: '', quantity: 1, price: 0 }]); };
  const removeItem = function(i) { setItems(items.filter(function(_, idx) { return idx !== i; })); };
  const updateItem = function(i, field, value) {
    const newItems = [...items];
    newItems[i][field] = value;
    setItems(newItems);
  };

  const totalAmount = items.reduce(function(sum, item) { return sum + (item.quantity * item.price); }, 0);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    // Validate input before sending
    if (!tableNumber || isNaN(parseInt(tableNumber))) {
        setMessage('Please enter a valid table number.');
        return;
    }

    const validItems = items.filter(i => i.item_name.trim() !== '' && i.quantity > 0 && i.price >= 0);
    if (validItems.length === 0) {
        setMessage('Please add at least one valid item with name, quantity and price.');
        return;
    }

    // If some items were empty, clean them up
    if (validItems.length !== items.length) {
        setItems(validItems);
    }

    try {
        const res = await fetch('/api/orders/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                table_number: parseInt(tableNumber),
                items: validItems,
                notes
            }),
        });

        const data = await res.json();

        if (res.ok) {
            setMessage(`Order #${data.orderId} sent to chef!`);
            setTableNumber('');
            setItems([{ item_name: '', quantity: 1, price: 0 }]);
            setNotes('');
            fetchMyOrders();
        } else {
            // Show server error message
            setMessage(`Error: ${data.error || 'Failed to create order'}`);
        }
    } catch (error) {
        setMessage('Network error – could not reach the server.');
    }
};

  const handleMarkServed = async function(orderId) {
    await fetch('/api/orders/update-status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status: 'served' }),
    });
    fetchMyOrders();
    setMessage('Order marked as served');
  };

  const handleLogout = function() {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
  };

  const readyOrders = orders.filter(function(o) { return o.status === 'ready'; }).length;

  const s = {
    sidebar: { width: 260, background: 'linear-gradient(180deg, #C8E6C9 0%, #E8F5E9 100%)', borderRight: '1px solid #E0E0E0', padding: '20px 0', position: 'relative', minHeight: '100vh' },
    navLink: function(active) { return { display: 'block', padding: '12px 20px', margin: '4px 12px', borderRadius: '8px', color: '#4A4A4A', textDecoration: 'none', fontWeight: 500, background: active ? 'white' : 'transparent', boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', cursor: 'pointer' }; },
    card: { background: 'white', borderRadius: 12, padding: 24, border: '1px solid #E0E0E0', marginBottom: 16 },
    btn: { background: '#C8E6C9', border: '1px solid #A5D6A7', padding: '8px 20px', borderRadius: '8px', color: '#2E7D32', fontWeight: 600, cursor: 'pointer' },
    btnSm: { background: '#C8E6C9', border: '1px solid #A5D6A7', padding: '6px 12px', borderRadius: 6, color: '#2E7D32', fontWeight: 600, cursor: 'pointer', fontSize: 13 },
    input: { padding: '8px 12px', border: '1px solid #E0E0E0', borderRadius: 6 },
    badge: function(bg, color) { return { background: bg, padding: '4px 12px', borderRadius: 20, fontSize: 13, color: color, display: 'inline-block' }; },
    orderCard: function(status) { return { background: status === 'ready' ? '#E8F5E9' : status === 'preparing' ? '#E3F2FD' : 'white', borderRadius: 8, padding: 16, marginBottom: 12, borderLeft: '4px solid ' + (status === 'ready' ? '#66BB6A' : status === 'preparing' ? '#42A5F5' : '#A5D6A7') }; }
  };

  return (
    <>
      <Head><title>Waiter Dashboard - RestroGreen</title></Head>
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
        <div style={s.sidebar}>
          <div style={{ textAlign: 'center', marginBottom: 30, padding: '0 20px' }}>
            <div style={{ width: 60, height: 60, background: 'white', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={function(e) { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="font-size:24px;font-weight:700;color:#2E7D32">RG</span>'; }} />
            </div>
            <h5 style={{ color: '#2E7D32', margin: 0 }}>RestroGreen</h5>
            <small style={{ color: '#7A7A7A' }}>Waiter Panel</small>
          </div>
          <div style={{ padding: '0 12px', marginBottom: 12 }}>
            {!checkedIn ? (
              <button onClick={handleCheckIn} style={{...s.btn, width: '100%' }}>Clock In</button>
            ) : (
              <button onClick={handleCheckOut} style={{...s.btn, width: '100%', background: '#FFE0B2', border: '1px solid #FFCC80', color: '#E65100' }}>Clock Out</button>
            )}
            {todayHours > 0 && <p style={{ fontSize: 12, textAlign: 'center', color: '#666', marginTop: 4 }}>Today: {todayHours} hrs</p>}
          </div>
          <nav>
            <div onClick={function() { setActiveTab('new-order'); }} style={s.navLink(activeTab === 'new-order')}>New Order</div>
            <div onClick={function() { setActiveTab('my-orders'); fetchMyOrders(); }} style={s.navLink(activeTab === 'my-orders')}>
              My Orders {readyOrders > 0 && <span style={{...s.badge('#E8F5E9', '#2E7D32'), marginLeft: 8 }}>{readyOrders} ready</span>}
            </div>
            <div onClick={function() { setActiveTab('salary'); }} style={s.navLink(activeTab === 'salary')}>My Earnings</div>
          </nav>
          <div style={{ position: 'absolute', bottom: 20, left: 12, right: 12 }}>
            <button onClick={handleLogout} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>

        <div style={{ flex: 1, background: '#FAFAFA' }}>
          <div style={{ background: 'white', padding: '16px 24px', borderBottom: '1px solid #E0E0E0', display: 'flex', justifyContent: 'space-between' }}>
            <h4 style={{ color: '#2E7D32', margin: 0 }}>Waiter Dashboard</h4>
            <span style={{ color: '#999' }}>Order Management</span>
          </div>
          <div style={{ padding: 24 }}>
            {message && <div style={{ background: '#E8F5E9', color: '#2E7D32', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>{message} <button onClick={function() { setMessage(''); }} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>x</button></div>}
            {readyOrders > 0 && <div style={{ background: '#FFF3E0', color: '#E65100', padding: '12px 16px', borderRadius: 8, marginBottom: 16, border: '1px solid #FFE0B2' }}>{readyOrders} order(s) ready for pickup!</div>}

            {activeTab === 'new-order' && (
              <div style={s.card}>
                <h5 style={{ color: '#2E7D32', marginBottom: 20 }}>Create New Order</h5>
                <form onSubmit={handleSubmitOrder}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontWeight: 500, display: 'block', marginBottom: 6 }}>Table No.</label>
                    <input type="number" required min="1" value={tableNumber} onChange={function(e) { setTableNumber(e.target.value); }} style={{...s.input, maxWidth: 200 }} placeholder="Table #" />
                  </div>
                  <label style={{ fontWeight: 500, display: 'block', marginBottom: 8 }}>Order Items</label>
                  {items.map(function(item, i) {
                    return (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input type="text" placeholder="Item name" required value={item.item_name} onChange={function(e) { updateItem(i, 'item_name', e.target.value); }} style={{...s.input, flex: 2 }} />
                        <input type="number" placeholder="Qty" min="1" value={item.quantity} onChange={function(e) { updateItem(i, 'quantity', parseInt(e.target.value) || 1); }} style={{...s.input, width: 70 }} />
                        <input type="number" step="0.01" placeholder="Price" value={item.price} onChange={function(e) { updateItem(i, 'price', parseFloat(e.target.value) || 0); }} style={{...s.input, width: 100 }} />
                        {items.length > 1 && <button type="button" onClick={function() { removeItem(i); }} style={{...s.btnSm, background: '#FFEBEE', border: '1px solid #FFCDD2', color: '#C62828' }}>X</button>}
                      </div>
                    );
                  })}
                  <button type="button" onClick={addItem} style={{...s.btnSm, marginBottom: 16 }}>+ Add Item</button>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontWeight: 500, display: 'block', marginBottom: 6 }}>Notes</label>
                    <textarea value={notes} onChange={function(e) { setNotes(e.target.value); }} style={{...s.input, height: 60, width: '100%' }} placeholder="Special instructions..." />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#2E7D32', fontSize: 18 }}>Total: Tk. {totalAmount.toFixed(2)}</strong>
                    <button type="submit" style={{...s.btn, padding: '12px 30px', fontSize: 16 }}>Send to Chef</button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'my-orders' && (
              <div>
                <h5 style={{ color: '#2E7D32', marginBottom: 20 }}>My Orders</h5>
                {orders.map(function(order) {
                  return (
                    <div key={order.id} style={s.orderCard(order.status)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <h6>Order #{order.id} - Table {order.table_number}</h6>
                          <div style={{ marginBottom: 4 }}>
                            {order.items && order.items.map(function(item, i) {
                              return <span key={i} style={{...s.badge('#F5F5F5', '#4A4A4A'), marginRight: 4, marginBottom: 4 }}>{item.item_name} x{item.quantity}</span>;
                            })}
                          </div>
                          {order.notes && <p style={{ fontSize: 13, color: '#999' }}>Note: {order.notes}</p>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={s.badge(order.status === 'ready' ? '#E8F5E9' : order.status === 'preparing' ? '#E3F2FD' : '#FFF3E0', order.status === 'ready' ? '#2E7D32' : order.status === 'preparing' ? '#0D47A1' : '#E65100')}>
                            {order.status}
                          </span>
                          <div style={{ fontWeight: 'bold', color: '#2E7D32', marginTop: 8 }}>Tk. {parseFloat(order.total_amount).toFixed(2)}</div>
                          {order.status === 'ready' && (
                            <button onClick={function() { handleMarkServed(order.id); }} style={{...s.btn, marginTop: 8 }}>Mark Served</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'salary' && (
              <div style={s.card}>
                <h5 style={{ color: '#2E7D32', marginBottom: 20 }}>My Earnings</h5>
                {salaryData && salaryData.salary ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div><strong>Total Hours:</strong> {parseFloat(salaryData.salary.total_hours).toFixed(1)} hrs</div>
                    <div><strong>Full Days:</strong> {salaryData.salary.total_days}</div>
                    <div><strong>Half Days:</strong> {salaryData.salary.half_days}</div>
                    <div><strong>Amount:</strong> <span style={{ color: '#2E7D32', fontWeight: 700 }}>Tk. {parseFloat(salaryData.salary.amount).toFixed(2)}</span></div>
                    <div><strong>Status:</strong> <span style={{ color: salaryData.salary.status === 'paid' ? '#2E7D32' : '#E65100', fontWeight: 600 }}>{salaryData.salary.status}</span></div>
                  </div>
                ) : <p style={{ color: '#999' }}>No salary data for this month yet.</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}