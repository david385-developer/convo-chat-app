import React, { useState, useEffect } from 'react';
import { useChat } from '../context';
import './Dashboard.css';

const Dashboard = () => {
  const { rooms, onlineUsers, unreadCounts } = useChat();

  const totalUnread = Object.values(unreadCounts).reduce((acc, curr) => acc + curr, 0);
  const onlineCount = Object.keys(onlineUsers).length;

  const stats = [
    { 
      label: 'Unread', 
      value: totalUnread, 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ), 
      color: 'primary' 
    },
    { 
      label: 'Friends', 
      value: onlineCount, 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ), 
      color: 'secondary' 
    },
    { 
      label: 'Rooms', 
      value: rooms.length, 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ), 
      color: 'warning' 
    },
  ];

  return (
    <div className="dashboard-welcome">
      <div className="welcome-content animate-fadeUp">
        <div className="welcome-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <h1 className="welcome-title">Welcome to Convo</h1>
        <p className="welcome-subtitle">Select a conversation to start chatting or create a new room.</p>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className={`stat-card stat-card--${stat.color}`}>
              <span className="stat-icon">{stat.icon}</span>
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
