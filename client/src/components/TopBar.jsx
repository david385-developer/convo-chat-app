import React from 'react';
import './TopBar.css';

const TopBar = ({ onMenuClick }) => {
  return (
    <header className="topbar mobile-only glass-panel">
      <div className="topbar-left">
        <button className="menu-btn" onClick={onMenuClick}>☰</button>
        <div className="nav-logo">Convo<span>.</span></div>
      </div>
      
      <div className="topbar-right">
        <button className="top-action-btn">🔔</button>
        <div className="p-avatar-sm">JD</div>
      </div>
    </header>
  );
};

export default TopBar;
