import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileMenuOpen]);

  const features = [
    { title: 'Real-time Messaging', desc: 'Experience lightning-fast communication with instant delivery and updates.', icon: '⚡' },
    { title: 'Private Conversations', desc: 'Secure one-on-one chats with end-to-end focus on your privacy.', icon: '🔒' },
    { title: 'File Sharing', desc: 'Share documents, images, and media effortlessly within any conversation.', icon: '📁' },
    { title: 'Typing Indicators', desc: 'Know exactly when your teammates are responding in real-time.', icon: '✍️' },
    { title: 'Read Receipts', desc: 'Track when your messages are delivered and read with precision.', icon: '✔️' },
    { title: '@Mentions', desc: 'Grab attention instantly by mentioning teammates in group discussions.', icon: '🔔' }
  ];

  return (
    <div className={`landing-page ${isMobileMenuOpen ? 'menu-open' : ''}`}>
      {/* Navbar */}
      <nav className={`landing-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-container">
          <Link to="/" className="landing-logo">
            Convo<span>.</span>
          </Link>

          {/* Mobile Overlay Backdrop */}
          {isMobileMenuOpen && (
            <div className="nav-overlay mobile-only" onClick={() => setIsMobileMenuOpen(false)}></div>
          )}
          
          <div className={`nav-links ${isMobileMenuOpen ? 'nav-links--open' : ''}`}>
            {/* Logo inside mobile menu */}
            <div className="mobile-menu-header mobile-only">
              <Link to="/" className="landing-logo" onClick={() => setIsMobileMenuOpen(false)}>
                Convo<span>.</span>
              </Link>
            </div>

            <a href="#features" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
            <a href="#preview" onClick={() => setIsMobileMenuOpen(false)}>Preview</a>
            <a href="#stats" onClick={() => setIsMobileMenuOpen(false)}>Stats</a>
            
            <div className="nav-mobile-actions mobile-only">
              <Link to="/login" className="login-link" onClick={() => setIsMobileMenuOpen(false)}>Log in</Link>
              <Link to="/register" className="btn-primary" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
            </div>
          </div>

          <div className="nav-actions desktop-only">
            <Link to="/login" className="login-link">Log in</Link>
            <Link to="/register" className="btn-primary">Get Started</Link>
          </div>

          <button className="nav-hamburger mobile-only" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="mesh-gradient"></div>
        <div className="hero-content animate-fadeUp">
          <h1 className="hero-title">
            Conversations that <br />
            <span className="text-gradient">feel alive.</span>
          </h1>
          <p className="hero-subtitle">
            Real-time chat built for teams who move fast. Connect, collaborate, <br />
            and communicate without boundaries.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn-primary btn-large">Start for Free</Link>
            <a href="#preview" className="btn-secondary">View Demo</a>
          </div>
        </div>

        {/* Floating decorations */}
        <div className="floating-bubble bubble-1"></div>
        <div className="floating-bubble bubble-2"></div>
        <div className="floating-bubble bubble-3"></div>
      </header>

      {/* Features Grid */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Everything you need</h2>
          <p className="section-subtitle">Powerful features designed for modern teams.</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card glass animate-fadeUp" style={{ animationDelay: `${index * 0.1}s` }}>
              <span className="feature-icon">{feature.icon}</span>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live Preview */}
      <section id="preview" className="preview-section">
        <div className="preview-container glass">
          <div className="preview-header">
            <div className="preview-dots"><span></span><span></span><span></span></div>
            <div className="preview-url">convo.app/dashboard/general</div>
          </div>
          <div className="preview-content">
            <div className="preview-chat">
              <div className="preview-msg preview-msg--other">
                <div className="preview-avatar">A</div>
                <div className="preview-bubble">Hey team, check out the new design! 🚀</div>
              </div>
              <div className="preview-msg preview-msg--own">
                <div className="preview-bubble">Looks incredible! Love the glassmorphism.</div>
              </div>
              <div className="preview-msg preview-msg--other">
                <div className="preview-avatar">B</div>
                <div className="preview-bubble">Agreed. The performance is way better too.</div>
              </div>
              <div className="preview-typing">
                <span></span><span></span><span></span> Charlie is typing...
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="stats-section">
        <div className="stats-grid-landing">
          <div className="stat-item">
            <span className="stat-number">10K+</span>
            <span className="stat-label">Active Users</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">500K+</span>
            <span className="stat-label">Messages Sent</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">99.9%</span>
            <span className="stat-label">Uptime</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-card">
          <h2 className="cta-title">Ready to start?</h2>
          <p className="cta-desc">Join thousands of teams already using Convo.</p>
          <Link to="/register" className="btn-primary btn-white">Get Started Now</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="landing-logo">Convo<span>.</span></Link>
            <p>Conversations that feel alive.</p>
          </div>
          <div className="footer-links">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#preview">Preview</a>
            <Link to="/register">Sign Up</Link>
          </div>
          <div className="footer-links">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Blog</a>
            <a href="#">Careers</a>
          </div>
          <div className="footer-links">
            <h4>Social</h4>
            <a href="#">Twitter</a>
            <a href="#">Discord</a>
            <a href="#">GitHub</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Convo. Built with care for teams everywhere.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
