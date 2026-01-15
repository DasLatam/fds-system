import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: '50px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>FDS - Firma Digital Simple</h1>
      <p>Sistema de gestión digital de contratos de alquiler temporario.</p>
      <Link href="/auth" style={{ 
        display: 'inline-block', 
        padding: '10px 20px', 
        background: '#4F46E5', 
        color: 'white', 
        textDecoration: 'none',
        borderRadius: '5px',
        marginTop: '20px'
      }}>
        Ingresar
      </Link>
    </div>
  );
}
