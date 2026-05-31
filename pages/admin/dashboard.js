import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [message, setMessage] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '', email: '', password: '', role: 'waiter', salary_per_hour: 0
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
    fetchAttendance();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users/manage');
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (err) { console.error(err); }
  };

  const fetchAttendance = async () => {
    try {
      const res = await fetch('/api/attendance/report?month=' + selectedMonth + '&year=' + selectedYear);
      const data = await res.json();
      if (data.attendance) setAttendance(data.attendance);
    } catch (err) { console.error(err); }
  };

  const fetchSalaries = async () => {
    try {
      const res = await fetch('/api/salary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear })
      });
      const data = await res.json();
      if (data.data) setSalaries(data.data);
      setMessage('Salary data refreshed');
    } catch (err) { setMessage('Error: ' + err.message); }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('User ' + newUser.name + ' created!');
        setShowAddUser(false);
        setNewUser({ name: '', email: '', password: '', role: 'waiter', salary_per_hour: 0 });
        fetchUsers();
      } else {
        setMessage('Error: ' + (data.error || 'Failed'));
      }
    } catch (err) { setMessage('Error: ' + err.message); }
  };

  const handleDeleteUser = async (userId) => {
    if (confirm('Deactivate this user?')) {
      await fetch('/api/users/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      fetchUsers();
      setMessage('User deactivated');
    }
  };

  const handlePaySalary = async (userId) => {
    try {
      const res = await fetch('/api/salary/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, month: selectedMonth, year: selectedYear })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Salary marked as paid');
        fetchSalaries();
      } else {
        setMessage('Error: ' + data.error);
      }
    } catch (err) { setMessage('Error: ' + err.message); }
  };

  const handleUpdateSalary = async (userId, salary_per_hour) => {
    const newRate = prompt('Enter new hourly rate:', salary_per_hour);
    if (newRate) {
      await fetch('/api/users/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, salary_per_hour: parseFloat(newRate) })
      });
      fetchUsers();
      setMessage('Salary rate updated');
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
    btnDanger: { background: '#FFEBEE', border: '1px solid #FFCDD2', padding: '6px 12px', borderRadius: 6, color: '#C62828', cursor: 'pointer', fontSize: 13 },
    input: { padding: '8px 12px', border: '1px solid #E0E0E0', borderRadius: 6, width: '100%' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '12px 16px', textAlign: 'left', color: '#2E7D32', background: '#E8F5E9', fontWeight: 600 },
    td: { padding: '12px 16px', borderBottom: '1px solid #E0E0E0' },
    badge: function(bg, color) { return { background: bg, padding: '4px 12px', borderRadius: 20, fontSize: 13, color: color || '#4A4A4A', display: 'inline-block' }; }
  };

  return (
    <>
      <Head><title>Admin Dashboard - RestroGreen</title></Head>
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
        <div style={styles.sidebar}>
          <div style={{ textAlign: 'center', marginBottom: 30, padding: '0 20px' }}>
            <div style={{ width: 60, height: 60, background: 'white', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={function(e) { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="font-size:24px;font-weight:700;color:#2E7D32">RG</span>'; }} />
            </div>
            <h5 style={{ color: '#2E7D32', margin: 0 }}>RestroGreen</h5>
            <small style={{ color: '#7A7A7A' }}>Admin Panel</small>
          </div>
          <nav>
            <div onClick={function() { setActiveTab('users'); }} style={styles.navLink(activeTab === 'users')}>Manage Users</div>
            <div onClick={function() { setActiveTab('attendance'); fetchAttendance(); }} style={styles.navLink(activeTab === 'attendance')}>Attendance</div>
            <div onClick={function() { setActiveTab('salaries'); fetchSalaries(); }} style={styles.navLink(activeTab === 'salaries')}>Salaries</div>
          </nav>
          <div style={{ position: 'absolute', bottom: 20, left: 12, right: 12 }}>
            <button onClick={handleLogout} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>

        <div style={{ flex: 1, background: '#FAFAFA' }}>
          <div style={{ background: 'white', padding: '16px 24px', borderBottom: '1px solid #E0E0E0', display: 'flex', justifyContent: 'space-between' }}>
            <h4 style={{ color: '#2E7D32', margin: 0 }}>Admin Dashboard</h4>
            <span style={{ color: '#999' }}>Administrator</span>
          </div>
          <div style={{ padding: 24 }}>
            {message && (
              <div style={{ background: '#E8F5E9', color: '#2E7D32', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>
                {message} <button onClick={function() { setMessage(''); }} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>x</button>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h5 style={{ color: '#2E7D32', margin: 0 }}>User Management</h5>
                  <button onClick={function() { setShowAddUser(!showAddUser); }} style={styles.btn}>+ Add New User</button>
                </div>
                {showAddUser && (
                  <div style={styles.card}>
                    <h6 style={{ marginBottom: 16, color: '#4A4A4A' }}>Add New User</h6>
                    <form onSubmit={handleAddUser}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <input type="text" placeholder="Name" required value={newUser.name} onChange={function(e) { setNewUser({...newUser, name: e.target.value}); }} style={styles.input} />
                        <input type="email" placeholder="Email" required value={newUser.email} onChange={function(e) { setNewUser({...newUser, email: e.target.value}); }} style={styles.input} />
                        <input type="password" placeholder="Password" required value={newUser.password} onChange={function(e) { setNewUser({...newUser, password: e.target.value}); }} style={styles.input} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <select value={newUser.role} onChange={function(e) { setNewUser({...newUser, role: e.target.value}); }} style={styles.input}>
                          <option value="waiter">Waiter</option>
                          <option value="chef">Chef</option>
                          <option value="manager">Manager</option>
                        </select>
                        <input type="number" step="0.01" placeholder="Salary/hr (Tk)" value={newUser.salary_per_hour} onChange={function(e) { setNewUser({...newUser, salary_per_hour: parseFloat(e.target.value) || 0}); }} style={styles.input} />
                        <button type="submit" style={styles.btn}>Create User</button>
                      </div>
                    </form>
                  </div>
                )}
                <div style={{...styles.card, padding: 0, overflow: 'hidden' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>Email</th>
                        <th style={styles.th}>Role</th>
                        <th style={styles.th}>Rate/Hr</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(function(user) {
                        return (
                          <tr key={user.id}>
                            <td style={styles.td}>{user.name}</td>
                            <td style={styles.td}>{user.email}</td>
                            <td style={styles.td}><span style={styles.badge('#E8F5E9', '#2E7D32')}>{user.role}</span></td>
                            <td style={styles.td}>Tk. {parseFloat(user.salary_per_hour).toFixed(2)}</td>
                            <td style={styles.td}><span style={styles.badge('#E8F5E9', '#2E7D32')}>{user.status}</span></td>
                            <td style={styles.td}>
                              <button onClick={function() { handleUpdateSalary(user.id, user.salary_per_hour); }} style={{...styles.btn, marginRight: 8, fontSize: 12, padding: '4px 10px' }}>Update Rate</button>
                              {user.role !== 'admin' && <button onClick={function() { handleDeleteUser(user.id); }} style={styles.btnDanger}>Deactivate</button>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <select value={selectedMonth} onChange={function(e) { setSelectedMonth(parseInt(e.target.value)); }} style={styles.input}>
                    <option value="1">January</option><option value="2">February</option><option value="3">March</option>
                    <option value="4">April</option><option value="5">May</option><option value="6">June</option>
                    <option value="7">July</option><option value="8">August</option><option value="9">September</option>
                    <option value="10">October</option><option value="11">November</option><option value="12">December</option>
                  </select>
                  <input type="number" value={selectedYear} onChange={function(e) { setSelectedYear(parseInt(e.target.value)); }} style={{...styles.input, width: 100}} />
                  <button onClick={fetchAttendance} style={styles.btn}>Load</button>
                </div>
                <div style={{...styles.card, padding: 0, overflow: 'hidden' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Employee</th>
                        <th style={styles.th}>Role</th>
                        <th style={styles.th}>Full Days</th>
                        <th style={styles.th}>Half Days</th>
                        <th style={styles.th}>Absences</th>
                        <th style={styles.th}>Total Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map(function(record, idx) {
                        return (
                          <tr key={idx}>
                            <td style={styles.td}>{record.name}</td>
                            <td style={styles.td}>{record.role}</td>
                            <td style={styles.td}>{record.full_days || 0}</td>
                            <td style={styles.td}>{record.half_days || 0}</td>
                            <td style={styles.td}>{record.absences || 0}</td>
                            <td style={styles.td}>{parseFloat(record.total_hours || 0).toFixed(1)} hrs</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'salaries' && (
              <div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <button onClick={fetchSalaries} style={styles.btn}>Generate/Refresh Salary</button>
                </div>
                <div style={{...styles.card, padding: 0, overflow: 'hidden' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Employee</th>
                        <th style={styles.th}>Total Hours</th>
                        <th style={styles.th}>Full Days</th>
                        <th style={styles.th}>Half Days</th>
                        <th style={styles.th}>Amount</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaries.map(function(salary, idx) {
                        return (
                          <tr key={idx}>
                            <td style={styles.td}>{salary.name}</td>
                            <td style={styles.td}>{parseFloat(salary.total_hours).toFixed(1)} hrs</td>
                            <td style={styles.td}>{salary.full_days}</td>
                            <td style={styles.td}>{salary.half_days}</td>
                            <td style={{...styles.td, fontWeight: 'bold', color: '#2E7D32'}}>Tk. {parseFloat(salary.amount).toFixed(2)}</td>
                            <td style={styles.td}>
                              <span style={styles.badge(salary.status === 'paid' ? '#E8F5E9' : '#FFF3E0', salary.status === 'paid' ? '#2E7D32' : '#E65100')}>
                                {salary.status || 'pending'}
                              </span>
                            </td>
                            <td style={styles.td}>
                              {salary.status !== 'paid' && (
                                <button onClick={function() { handlePaySalary(salary.user_id); }} style={styles.btn}>Pay Salary</button>
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