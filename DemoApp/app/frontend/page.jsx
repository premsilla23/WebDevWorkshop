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