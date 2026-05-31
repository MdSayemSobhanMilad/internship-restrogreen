import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    // Get token from cookie
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});

    if (!cookies.token) {
      router.push('/login');
      return;
    }

    // Try to decode token to get role
    try {
      const base64Url = cookies.token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      const roleRoutes = {
        admin: '/admin/dashboard',
        manager: '/manager/dashboard',
        waiter: '/waiter/dashboard',
        chef: '/chef/dashboard',
      };

      router.push(roleRoutes[payload.role] || '/login');
    } catch {
      router.push('/login');
    }
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      height: '100vh', background: '#E8F5E9' 
    }}>
      <p style={{ color: '#2E7D32' }}>Redirecting...</p>
    </div>
  );
}