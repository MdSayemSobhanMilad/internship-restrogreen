import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async function(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const roleRoutes = {
        admin: '/admin/dashboard',
        manager: '/manager/dashboard',
        waiter: '/waiter/dashboard',
        chef: '/chef/dashboard',
      };

      router.push(roleRoutes[data.user.role] || '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>RestroGreen - Login</title>
      </Head>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 30%, #FFF8E1 70%, #FFE0B2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          maxWidth: '440px',
          width: '100%'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ 
              width: 80, 
              height: 80, 
              background: 'white', 
              borderRadius: '50%', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: 16,
              overflow: 'hidden',
              border: '3px solid #C8E6C9'
            }}>
              <img 
                src="/logo.png" 
                alt="RestroGreen Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={function(e) {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span style="font-size:32px;font-weight:700;color:#2E7D32">RG</span>';
                }}
              />
            </div>
            <h2 style={{ color: '#2E7D32', marginBottom: 4, marginTop: 0 }}>RestroGreen</h2>
            <p style={{ color: '#7A7A7A', margin: 0 }}>Restaurant Management System</p>
          </div>

          {error && (
            <div style={{
              background: '#FFEBEE',
              color: '#C62828',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              border: '1px solid #FFCDD2'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontWeight: 500, 
                color: '#4A4A4A' 
              }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={function(e) { setEmail(e.target.value); }}
                required
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  border: '1.5px solid #E0E0E0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: '#FAFAFA',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={function(e) {
                  e.target.style.borderColor = '#A5D6A7';
                  e.target.style.backgroundColor = 'white';
                }}
                onBlur={function(e) {
                  e.target.style.borderColor = '#E0E0E0';
                  e.target.style.backgroundColor = '#FAFAFA';
                }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontWeight: 500, 
                color: '#4A4A4A' 
              }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={function(e) { setPassword(e.target.value); }}
                required
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  border: '1.5px solid #E0E0E0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: '#FAFAFA',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={function(e) {
                  e.target.style.borderColor = '#A5D6A7';
                  e.target.style.backgroundColor = 'white';
                }}
                onBlur={function(e) {
                  e.target.style.borderColor = '#E0E0E0';
                  e.target.style.backgroundColor = '#FAFAFA';
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: '#C8E6C9',
                border: '1px solid #A5D6A7',
                color: '#2E7D32',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
              onMouseOver={function(e) {
                if (!loading) e.target.style.background = '#A5D6A7';
              }}
              onMouseOut={function(e) {
                if (!loading) e.target.style.background = '#C8E6C9';
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <small style={{ color: '#999' }}>
              Demo: admin@restrogreen.com / admin123
            </small>
          </div>
        </div>
      </div>
    </>
  );
}