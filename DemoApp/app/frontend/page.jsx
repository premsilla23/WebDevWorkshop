import Link from "next/link";

export default function FrontendBasics() {
  return (
    <main 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        margin: 0, 
        padding: 0, 
        overflow: 'hidden',
        zIndex: 9999,
        backgroundColor: '#43a047'
      }}
    >
      <Link 
        href="/" 
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 10000,
          backgroundColor: '#101725',
          color: '#c5f23a',
          textDecoration: 'none',
          padding: '6px 14px',
          borderRadius: '6px',
          fontSize: '13px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          border: '1px solid rgba(197, 242, 58, 0.3)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ← Main Menu
      </Link>
      <iframe 
        src="/monkeygame.html" 
        style={{ 
          width: '100%', 
          height: '100%', 
          border: 'none', 
          display: 'block' 
        }}
        title="Flexbox Monkey Game"
      />
    </main>
  );
}
