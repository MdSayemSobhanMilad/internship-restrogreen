import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [cashEntries, setCashEntries] = useState([]);
  const [totalCash, setTotalCash] = useState(0);
  const [message, setMessage] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);
  const [todayHours, setTodayHours] = useState(0);
  const [salaryData, setSalaryData] = useState(null);
  const [cashForm, setCashForm] = useState({ amount: '', type: 'cash_in', description: '' });
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
    fetchInventory();
    fetchCash();
    checkAttendance();
    fetchSalaryStatus();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders/list');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) { console.error(err); }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory/list');
      const data = await res.json();
      setInventory(data.inventory || []);
    } catch (err) { console.error(err); }
  };

  const fetchCash = async () => {
    try {
      const res = await fetch('/api/cash/list');
      const data = await res.json();
      setCashEntries(data.entries || []);
      setTotalCash(Number(data.totalCash) || 0);
    } catch (err) { console.error(err); }
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
    if (res.ok) { setCheckedIn(true); setMessage('Checked in successfully'); }
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

  const handleCashUpdate = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/cash/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cashForm),
    });
    if (res.ok) {
      setMessage('Cash updated');
      setCashForm({ amount: '', type: 'cash_in', description: '' });
      fetchCash();
    }
  };

  const handleGenerateSlip = async (orderId) => {
    try {
      setMessage('Generating PDF...');
      const res = await fetch('/api/payment/generate-slip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, payment_method: 'cash' }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'payment-slip-' + orderId + '.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setMessage('Payment slip downloaded');
        fetchOrders();
        fetchCash();
      } else {
        const data = await res.json();
        setMessage('Error: ' + (data.error || 'Failed'));
      }
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
  };

  const handleLogout = () => {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
  };

  const styles = {
    sidebar: { width: 260, background: 'linear-gradient(180deg, #C8E6C9 0%, #E8F5E9 100%)', borderRight: '1px solid #E0E0E0', padding: '20px 0', position: 'relative', minHeight: '100vh' },
    navLink: function(active) { return { display: 'block', padding: '12px 20px', margin: '4px 12px', borderRadius: '8px', color: '#4A4A4A', textDecoration: 'none', fontWeight: 500, background: active ? 'white' : 'transparent', boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', cursor: 'pointer' }; },
    card: { background: 'white', borderRadius: 12, padding: 24, border: '1px solid #E0E0E0', marginBottom: 16 },
    btn: { background: '#C8E6C9', border: '1px solid #A5D6A7', padding: '8px 20px', borderRadius: '8px', color: '#2E7D32', fontWeight: 600, cursor: 'pointer' },
    btnSm: { background: '#C8E6C9', border: '1px solid #A5D6A7', padding: '6px 12px', borderRadius: 6, color: '#2E7D32', fontWeight: 600, cursor: 'pointer', fontSize: 13 },
    input: { padding: '8px 12px', border: '1px solid #E0E0E0', borderRadius: 6, width: '100%' },
    badge: function(bg, color) { return { background: bg, padding: '4px 12px', borderRadius: 20, fontSize: 12, color: color, display: 'inline-block', fontWeight: 500 }; },
    statCard: { background: 'white', borderRadius: 12, padding: 20, border: '1px solid #E0E0E0', textAlign: 'center' }
  };

  const pendingOrders = orders.filter(function(o) { return o.status === 'pending'; }).length;
  const preparingOrders = orders.filter(function(o) { return o.status === 'preparing'; }).length;
  const readyOrders = orders.filter(function(o) { return o.status === 'ready'; }).length;
  const unpaidTotal = orders.filter(function(o) { return o.payment_status === 'unpaid'; }).reduce(function(sum, o) { return sum + parseFloat(o.total_amount || 0); }, 0);

  return (
    <>
      <Head><title>Manager Dashboard - RestroGreen</title></Head>
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
        
        <div style={styles.sidebar}>
          <div style={{ textAlign: 'center', marginBottom: 30, padding: '0 20px' }}>
            <div style={{ width: 60, height: 60, background: 'white', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={function(e) { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="font-size:24px;font-weight:700;color:#2E7D32">RG</span>'; }} />
            </div>
            <h5 style={{ color: '#2E7D32', margin: 0 }}>RestroGreen</h5>
            <small style={{ color: '#7A7A7A' }}>Manager Panel</small>
          </div>

          <div style={{ padding: '0 12px', marginBottom: 12 }}>
            {!checkedIn ? (
              <button onClick={handleCheckIn} style={{...styles.btn, width: '100%' }}>Clock In</button>
            ) : (
              <button onClick={handleCheckOut} style={{...styles.btn, width: '100%', background: '#FFE0B2', border: '1px solid #FFCC80', color: '#E65100' }}>Clock Out</button>
            )}
            {todayHours > 0 && <p style={{ fontSize: 12, textAlign: 'center', color: '#666', marginTop: 4 }}>Today: {todayHours} hrs</p>}
          </div>

          <nav>
            <div onClick={function() { setActiveTab('orders'); }} style={styles.navLink(activeTab === 'orders')}>
              Order Monitoring
              {readyOrders > 0 && <span style={{...styles.badge('#E8F5E9', '#2E7D32'), marginLeft: 8 }}>{readyOrders} ready</span>}
            </div>
            <div onClick={function() { setActiveTab('inventory'); }} style={styles.navLink(activeTab === 'inventory')}>Food Inventory</div>
            <div onClick={function() { setActiveTab('cash'); }} style={styles.navLink(activeTab === 'cash')}>Cash Management</div>
            <div onClick={function() { setActiveTab('salary'); }} style={styles.navLink(activeTab === 'salary')}>My Earnings</div>
          </nav>

          <div style={{ position: 'absolute', bottom: 20, left: 12, right: 12 }}>
            <button onClick={handleLogout} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>

        <div style={{ flex: 1, background: '#FAFAFA' }}>
          <div style={{ background: 'white', padding: '16px 24px', borderBottom: '1px solid #E0E0E0', display: 'flex', justifyContent: 'space-between' }}>
            <h4 style={{ color: '#2E7D32', margin: 0 }}>Manager Dashboard</h4>
            <span style={{ color: '#999' }}>Restaurant Management</span>
          </div>

          <div style={{ padding: 24 }}>
            {message && (
              <div style={{ background: '#E8F5E9', color: '#2E7D32', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>
                {message}
                <button onClick={function() { setMessage(''); }} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>x</button>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div style={styles.statCard}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#E65100' }}>{pendingOrders}</div>
                    <div style={{ fontSize: 13, color: '#999' }}>PENDING</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#0D47A1' }}>{preparingOrders}</div>
                    <div style={{ fontSize: 13, color: '#999' }}>PREPARING</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#2E7D32' }}>{readyOrders}</div>
                    <div style={{ fontSize: 13, color: '#999' }}>READY</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#C62828' }}>Tk. {unpaidTotal.toFixed(0)}</div>
                    <div style={{ fontSize: 13, color: '#999' }}>UNPAID</div>
                  </div>
                </div>
                
                <div style={{...styles.card, padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#E8F5E9' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Order ID</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Table</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Items</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Total</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Payment</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(function(order) {
                        return (
                          <tr key={order.id} style={{ borderBottom: '1px solid #E0E0E0' }}>
                            <td style={{ padding: '12px 16px' }}>#{order.id}</td>
                            <td style={{ padding: '12px 16px' }}>Table {order.table_number}</td>
                            <td style={{ padding: '12px 16px' }}>
                              {order.items && order.items.map(function(item, i) {
                                return <span key={i} style={{...styles.badge('#F5F5F5', '#4A4A4A'), marginRight: 4, marginBottom: 2 }}>{item.item_name} x{item.quantity}</span>;
                              })}
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#2E7D32' }}>Tk. {parseFloat(order.total_amount).toFixed(2)}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={styles.badge(
                                order.status === 'completed' ? '#F3E5F5' : order.status === 'ready' ? '#E8F5E9' : order.status === 'preparing' ? '#E3F2FD' : '#FFF3E0',
                                order.status === 'completed' ? '#4A148C' : order.status === 'ready' ? '#2E7D32' : order.status === 'preparing' ? '#0D47A1' : '#E65100'
                              )}>{order.status}</span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={styles.badge(order.payment_status === 'paid' ? '#E8F5E9' : '#FFF3E0', order.payment_status === 'paid' ? '#2E7D32' : '#E65100')}>
                                {order.payment_status}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {order.payment_status === 'unpaid' ? (
                                <button onClick={function() { handleGenerateSlip(order.id); }} style={styles.btnSm}>Take Payment & Print</button>
                              ) : (
                                <button onClick={function() { handleGenerateSlip(order.id); }} style={{...styles.btnSm, background: '#E8EAF6', border: '1px solid #C5CAE9', color: '#283593' }}>Reprint</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Cash Tab */}
            {activeTab === 'cash' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div style={styles.statCard}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#2E7D32' }}>Tk. {Number(totalCash).toFixed(2)}</div>
                    <div style={{ fontSize: 13, color: '#999' }}>CURRENT BALANCE</div>
                  </div>
                </div>

                <div style={styles.card}>
                  <h6 style={{ marginBottom: 16, color: '#4A4A4A' }}>Update Cash</h6>
                  <form onSubmit={handleCashUpdate}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <input type="number" step="0.01" placeholder="Amount" required value={cashForm.amount} onChange={function(e) { setCashForm({...cashForm, amount: e.target.value}); }} style={{...styles.input, flex: 1 }} />
                      <select value={cashForm.type} onChange={function(e) { setCashForm({...cashForm, type: e.target.value}); }} style={{...styles.input, width: 150 }}>
                        <option value="cash_in">Cash In (+)</option>
                        <option value="cash_out">Cash Out (-)</option>
                      </select>
                      <input type="text" placeholder="Description" value={cashForm.description} onChange={function(e) { setCashForm({...cashForm, description: e.target.value}); }} style={{...styles.input, flex: 2 }} />
                      <button type="submit" style={styles.btn}>Update</button>
                    </div>
                  </form>
                </div>

                <div style={{...styles.card, padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#E8F5E9' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Date</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Type</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Amount</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashEntries.map(function(entry, idx) {
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #E0E0E0' }}>
                            <td style={{ padding: '12px 16px' }}>{new Date(entry.created_at).toLocaleString()}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={styles.badge(entry.type === 'cash_in' ? '#E8F5E9' : '#FFEBEE', entry.type === 'cash_in' ? '#2E7D32' : '#C62828')}>
                                {entry.type === 'cash_in' ? 'Cash In' : 'Cash Out'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>Tk. {parseFloat(entry.amount).toFixed(2)}</td>
                            <td style={{ padding: '12px 16px' }}>{entry.description || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Salary Tab */}
            {activeTab === 'salary' && (
              <div style={styles.card}>
                <h5 style={{ color: '#2E7D32', marginBottom: 20 }}>My Earnings</h5>
                {salaryData && salaryData.salary ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div><strong>Total Hours:</strong> {parseFloat(salaryData.salary.total_hours).toFixed(1)} hrs</div>
                    <div><strong>Full Days:</strong> {salaryData.salary.total_days}</div>
                    <div><strong>Half Days:</strong> {salaryData.salary.half_days}</div>
                    <div><strong>Amount:</strong> <span style={{ color: '#2E7D32', fontWeight: 700 }}>Tk. {parseFloat(salaryData.salary.amount).toFixed(2)}</span></div>
                    <div><strong>Status:</strong> <span style={{ color: salaryData.salary.status === 'paid' ? '#2E7D32' : '#E65100', fontWeight: 600 }}>{salaryData.salary.status}</span></div>
                  </div>
                ) : (
                  <p style={{ color: '#999' }}>No salary data for this month yet.</p>
                )}
              </div>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <div>
                <h5 style={{ color: '#2E7D32', marginBottom: 20 }}>Food Inventory</h5>
                <div style={{...styles.card, padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#E8F5E9' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Item</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Category</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Quantity</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Unit</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2E7D32' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map(function(item) {
                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid #E0E0E0' }}>
                            <td style={{ padding: '12px 16px' }}>{item.item_name}</td>
                            <td style={{ padding: '12px 16px' }}>{item.category || '-'}</td>
                            <td style={{ padding: '12px 16px' }}>{parseFloat(item.quantity).toFixed(2)}</td>
                            <td style={{ padding: '12px 16px' }}>{item.unit}</td>
                            <td style={{ padding: '12px 16px' }}>
                              {parseFloat(item.quantity) <= parseFloat(item.min_quantity) ? (
                                <span style={styles.badge('#FFEBEE', '#C62828')}>Low Stock</span>
                              ) : (
                                <span style={styles.badge('#E8F5E9', '#2E7D32')}>In Stock</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}