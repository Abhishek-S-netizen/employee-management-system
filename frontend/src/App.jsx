import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TeamDirectory from './pages/TeamDirectory';
import PublicIDCard from './pages/PublicIDCard';
import './index.css';

function App() {
  return (
    <div className="layout-container" style={{ display: 'flex', minHeight: '100vh' }}>
      <main style={{ flex: 1, backgroundColor: 'var(--bg-page)', padding: '0' }}>
        <Routes>
          <Route path="/" element={
            <div className="main-content-area">
              <TeamDirectory />
            </div>
          } />
          <Route path="/verify/:code" element={<PublicIDCard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
