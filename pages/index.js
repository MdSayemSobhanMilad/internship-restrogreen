import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
    }}>
      <p style={{ color: '#2E7D32', fontSize: '18px' }}>Loading...</p>
    </div>
  );
}