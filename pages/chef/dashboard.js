import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function ChefDashboard() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [message, setMessage] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);
  const [todayHours, setTodayHours] = useState(0);
  const [salaryData, setSalaryData] = useState(null);
  const [newItem, setNewItem] = useState({ item_name: '', category: '', quantity: 0, unit: 'pcs', min_quantity: 0 });
  const [editingItem, setEditingItem] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
    fetchInventory();
    checkAttendance();
    fetchSalaryStatus();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    const res = await fetch('/api/orders/all-pending');
    const data = await res.json();
    setOrders(data.orders || []);
  };

  const fetchInventory = async () => {
    const res = await fetch('/api/inventory/list');
    const data = await res.json();
    setInventory(data.inventory || []);
  };

  const checkAttendance = async () => {
    try {
      const res = await fetch('/api/attendance/check-status');
      const data = await res.json();
      if (data.checkedIn) setCheckedIn(true);
      if (data.hours) setTodayHours(data.hours);
    } catch {}
  };

  const fetchSalaryStatus = async () => {
    try {
      const now = new Date();
      const res = await fetch(`/api/salary/status?month=${now.getMonth()+1}&year=${now.getFullYear()}`);
      const data = await res.json();
      setSalaryData(data);
    } catch {}
  };

  const handleCheckIn = async () => {
    const res = await fetch('/api/attendance/checkin', { method: 'POST' });
    if (res.ok) { setCheckedIn(true); setMessage('Checked in'); }
  };

  const handleCheckOut = async () => {
    const res = await fetch('/api/attendance/checkout', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setCheckedIn(false);
      setTodayHours(data.hoursWorked);
      setMessage('Checked out. Hours: ' + data.hoursWorked);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    await fetch('/api/orders/update-status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    });
    fetchOrders();
    setMessage('Order #' + orderId + ' status: ' + status);
  };

  const handleUpdateInventory = async (itemId, quantity) => {
    await fetch('/api/inventory/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId, quantity }),
    });
    fetchInventory();
  };

  const handleDeleteInventory = async (itemId) => {
    if (confirm('Delete this inventory item?')) {
      await fetch('/api/inventory/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId }),
      });
      fetchInventory();
      setMessage('Item deleted');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    await fetch('/api/inventory/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    setNewItem({ item_name: '', category: '', quantity: 0, unit: 'pcs', min_quantity: 0 });
    fetchInventory();
    setMessage('Item added');
  };

  const handleEditItem = async (e) => {
    e.preventDefault();
    await fetch('/api/inventory/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingItem.id, item_name: editingItem.item_name, min_quantity: editingItem.min_quantity }),
    });
    setEditingItem(null);
    fetchInventory();
    setMessage('Item updated');
  };

  const handleLogout = () => {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
  };

  const s = {
    sidebar: { width: 260, background: 'linear-gradient(180deg, #C8E6C9 0%, #E8F5E9 100%)', borderRight: '1px solid #E0E0E0', padding: '20px 0', position: 'relative', minHeight: '100vh' },
    navLink: function(active) { return { display: 'block', padding: '12px 20px', margin: '4px 12px', borderRadius: '8px', color: '#4A4A4A', textDecoration: 'none', fontWeight: 500, background: active ? 'white' : 'transparent', cursor: 'pointer' }; },
    card: { background: 'white', borderRadius: 12, padding: 24, border: '1px solid #E0E0E0', marginBottom: 16 },
    btn: { background: '#C8E6C9', border: '1px solid #A5D6A7', padding: '8px 16px', borderRadius: '8px', color: '#2E7D32', fontWeight: 600, cursor: 'pointer' },
    btnSm: { padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid' },
    input: { padding: '8px 12px', border: '1px solid #E0E0E0', borderRadius: 6 },
    badge: function(bg, color) { return { background: bg, padding: '4px 12px', borderRadius: 20, fontSize: 12, color: color, display: 'inline-block' }; },
    orderCard: function(status) { return { background: status === 'pending' ? '#FFF8E1' : status === 'preparing' ? '#E3F2FD' : status === 'ready' ? '#E8F5E9' : 'white', borderRadius: 8, padding: 16, marginBottom: 12, borderLeft: '4px solid ' + (status === 'pending' ? '#FF9800' : status === 'preparing' ? '#42A5F5' : '#66BB6A') }; }
  };

  const pendingCount = orders.filter(function(o) { return o.status === 'pending'; }).length;

  return (
    <>
      <Head><title>Chef Dashboard - RestroGreen</title></Head>
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
        <div style={s.sidebar}>
          <div style={{ textAlign: 'center', marginBottom: 30, padding: '0 20px' }}>
            <div style={{ width: 60, height: 60, background: 'white', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={function(e) { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="font-size:24px;font-weight:700;color:#2E7D32">RG</span>'; }} />
            </div>
            <h5 style={{ color: '#2E7D32', margin: 0 }}>RestroGreen</h5>
            <small style={{ color: '#7A7A7A' }}>Chef Panel</small>
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
            <div onClick={function() { setActiveTab('orders'); fetchOrders(); }} style={s.navLink(activeTab === 'orders')}>
              Order Queue {pendingCount > 0 && <span style={{...s.badge('#FFF3E0', '#E65100'), marginLeft: 8 }}>{pendingCount} new</span>}
            </div>
            <div onClick={function() { setActiveTab('inventory'); fetchInventory(); }} style={s.navLink(activeTab === 'inventory')}>Food Inventory</div>
            <div onClick={function() { setActiveTab('salary'); }} style={s.navLink(activeTab === 'salary')}>My Earnings</div>
          </nav>
          <div style={{ position: 'absolute', bottom: 20, left: 12, right: 12 }}>
            <button onClick={handleLogout} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>

        <div style={{ flex: 1, background: '#FAFAFA' }}>
          <div style={{ background: 'white', padding: '16px 24px', borderBottom: '1px solid #E0E0E0', display: 'flex', justifyContent: 'space-between' }}>
            <h4 style={{ color: '#2E7D32', margin: 0 }}>Chef Dashboard</h4>
            <span style={{ color: '#999' }}>Kitchen Management</span>
          </div>
          <div style={{ padding: 24 }}>
            {message && <div style={{ background: '#E8F5E9', color: '#2E7D32', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>{message} <button onClick={function() { setMessage(''); }} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>x</button></div>}

            {activeTab === 'orders' && (
              <div>
                <h5 style={{ color: '#2E7D32', marginBottom: 20 }}>Order Queue</h5>
                {orders.map(function(order) {
                  return (
                    <div key={order.id} style={s.orderCard(order.status)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <h6>Order #{order.id} - Table {order.table_number}</h6>
                          <div style={{ marginBottom: 4 }}>
                            {order.items && order.items.map(function(item, i) {
                              return <span key={i} style={{...s.badge('#F5F5F5', '#4A4A4A'), marginRight: 4 }}>{item.item_name} x{item.quantity}</span>;
                            })}
                          </div>
                          {order.notes && <p style={{ fontSize: 13, color: '#999' }}>Note: {order.notes}</p>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ marginBottom: 8 }}>
                            {order.status === 'pending' && (
                              <>
                                <button onClick={function() { handleUpdateOrderStatus(order.id, 'accepted'); }} style={{...s.btnSm, background: '#E8EAF6', borderColor: '#C5CAE9', color: '#283593', marginRight: 4 }}>Accept</button>
                                <button onClick={function() { handleUpdateOrderStatus(order.id, 'preparing'); }} style={{...s.btnSm, background: '#FFE0B2', borderColor: '#FFCC80', color: '#E65100' }}>Start</button>
                              </>
                            )}
                            {order.status === 'accepted' && (
                              <button onClick={function() { handleUpdateOrderStatus(order.id, 'preparing'); }} style={{...s.btnSm, background: '#FFE0B2', borderColor: '#FFCC80', color: '#E65100' }}>Start Preparing</button>
                            )}
                            {order.status === 'preparing' && (
                              <button onClick={function() { handleUpdateOrderStatus(order.id, 'ready'); }} style={{...s.btnSm, background: '#C8E6C9', borderColor: '#A5D6A7', color: '#2E7D32' }}>Mark Ready</button>
                            )}
                            {order.status === 'ready' && <span style={s.badge('#E8F5E9', '#2E7D32')}>Ready for pickup</span>}
                          </div>
                          <div style={{ fontWeight: 'bold', color: '#2E7D32' }}>Tk. {parseFloat(order.total_amount).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'inventory' && (
              <div>
                {editingItem && (
                  <div style={s.card}>
                    <h6 style={{ marginBottom: 16 }}>Edit Item</h6>
                    <form onSubmit={handleEditItem}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="text" value={editingItem.item_name} onChange={function(e) { setEditingItem({...editingItem, item_name: e.target.value}); }} style={{...s.input, flex: 2 }} required />
                        <input type="number" step="0.01" value={editingItem.min_quantity} onChange={function(e) { setEditingItem({...editingItem, min_quantity: parseFloat(e.target.value)}); }} style={{...s.input, width: 100 }} />
                        <button type="submit" style={s.btn}>Save</button>
                        <button type="button" onClick={function() { setEditingItem(null); }} style={{...s.btn, background: '#eee' }}>Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                <div style={s.card}>
                  <h6 style={{ marginBottom: 16 }}>Add Inventory Item</h6>
                  <form onSubmit={handleAddItem}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <input type="text" placeholder="Item name" required value={newItem.item_name} onChange={function(e) { setNewItem({...newItem, item_name: e.target.value}); }} style={{...s.input, flex: 1, minWidth: 150 }} />
                      <input type="text" placeholder="Category" value={newItem.category} onChange={function(e) { setNewItem({...newItem, category: e.target.value}); }} style={{...s.input, flex: 1, minWidth: 120 }} />
                      <input type="number" step="0.01" placeholder="Qty" value={newItem.quantity} onChange={function(e) { setNewItem({...newItem, quantity: parseFloat(e.target.value)}); }} style={{...s.input, width: 80 }} />
                      <select value={newItem.unit} onChange={function(e) { setNewItem({...newItem, unit: e.target.value}); }} style={{...s.input, width: 100 }}>
                        <option value="pcs">Pcs</option><option value="kg">Kg</option><option value="g">G</option><option value="l">L</option><option value="ml">Ml</option>
                      </select>
                      <input type="number" step="0.01" placeholder="Min" value={newItem.min_quantity} onChange={function(e) { setNewItem({...newItem, min_quantity: parseFloat(e.target.value)}); }} style={{...s.input, width: 70 }} />
                      <button type="submit" style={s.btn}>Add</button>
                    </div>
                  </form>
                </div>

                <div style={{...s.card, padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#E8F5E9' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Item</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Qty</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Unit</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Min</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Update Qty</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map(function(item) {
                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid #E0E0E0' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 500 }}>{item.item_name}</td>
                            <td style={{ padding: '12px 16px' }}>{parseFloat(item.quantity).toFixed(2)}</td>
                            <td style={{ padding: '12px 16px' }}>{item.unit}</td>
                            <td style={{ padding: '12px 16px' }}>{parseFloat(item.min_quantity).toFixed(2)}</td>
                            <td style={{ padding: '12px 16px' }}>
                              {parseFloat(item.quantity) <= parseFloat(item.min_quantity) ? <span style={s.badge('#FFEBEE', '#C62828')}>Low</span> : <span style={s.badge('#E8F5E9', '#2E7D32')}>OK</span>}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <input type="number" step="0.01" defaultValue={parseFloat(item.quantity)} onBlur={function(e) { if(e.target.value) handleUpdateInventory(item.id, parseFloat(e.target.value)); }} style={{...s.input, width: 80 }} />
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <button onClick={function() { setEditingItem({id: item.id, item_name: item.item_name, min_quantity: item.min_quantity}); }} style={{...s.btnSm, background: '#E8EAF6', borderColor: '#C5CAE9', color: '#283593', marginRight: 4 }}>Edit</button>
                              <button onClick={function() { handleDeleteInventory(item.id); }} style={{...s.btnSm, background: '#FFEBEE', borderColor: '#FFCDD2', color: '#C62828' }}>Delete</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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
                ) : <p style={{ color: '#999' }}>No salary data yet.</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}