import React, { Suspense } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';

// Import komponen 3D
import MorphingCore from './components/3d/MorphingCore.jsx';

// Data Dummy History
const MOCK_HISTORY = [
  { id: 1, type: 'CONSULTATION', hash: '0x3a...8f21', verdict: 'STRONG BUY', score: 98, time: '2 mins ago' },
  { id: 2, type: 'CONSULTATION', hash: '0x8b...1a99', verdict: 'NEUTRAL', score: 45, time: '1 hour ago' },
  { id: 3, type: 'CONSULTATION', hash: '0x1c...4d55', verdict: 'DANGER', score: 12, time: '5 hours ago' },
];

const HomePage = () => (
  <motion.div 
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={{ width: '100%', height: '100vh', position: 'relative', pointerEvents: 'none' }}
  >
    <div style={{ position: 'absolute', bottom: '50px', width: '100%', textAlign: 'center', zIndex: 10 }}>
      <h2 style={{ fontSize: '1.2rem', color: '#00ffaa', letterSpacing: '5px', margin: 0, textShadow: '0 0 10px #00ffaa' }}>
        SYSTEM ONLINE
      </h2>
    </div>
  </motion.div>
);

const HistoryPage = () => {
  const account = useCurrentAccount();
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      style={{ paddingTop: '100px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)', zIndex: 20, position: 'relative' }}
    >
      <h2 style={{ fontSize: '3rem', color: 'white', letterSpacing: '3px' }}>
        ORACLE <span style={{ color: '#eebb00' }}>LOGS</span>
      </h2>
      <div style={{ width: '80%', marginTop: '30px', border: '1px solid #333', borderRadius: '8px', padding: '20px' }}>
        {MOCK_HISTORY.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #222', color: '#ccc' }}>
            <span>{item.time}</span>
            <span style={{ color: '#00ffaa' }}>{item.verdict}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

function App() {
  const location = useLocation();

  return (
    <div className="main-container">
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 0 }}>
        {/* SETUP KAMERA: Fog diperjauh ke 60 agar teks di kejauhan tidak hilang */}
        <Canvas camera={{ position: [0, 1.5, 6], fov: 60 }}>
          <fog attach="fog" args={['#050505', 10, 60]} />
          <Suspense fallback={null}>
            <MorphingCore />
          </Suspense>
        </Canvas>
      </div>

      <nav style={{ position: 'fixed', top: 0, left: 0, width: '100%', padding: '20px 40px', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)' }}>
        <h1 style={{ fontSize: '2rem', margin: 0, color: 'white', letterSpacing: '5px' }}>NOUS</h1>
        <div style={{ display: 'flex', gap: '30px' }}>
          <Link to="/" style={{ color: location.pathname === '/' ? '#00ffaa' : '#666', textDecoration: 'none', fontWeight: 'bold' }}>CORE</Link>
          <Link to="/history" style={{ color: location.pathname === '/history' ? '#eebb00' : '#666', textDecoration: 'none', fontWeight: 'bold' }}>HISTORY</Link>
        </div>
        <ConnectButton />
      </nav>

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default App;