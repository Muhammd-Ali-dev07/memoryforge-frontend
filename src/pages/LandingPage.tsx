import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Zap, Shield, Database, MessageSquare, FileText } from 'lucide-react';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content fade-in">
          <div className="logo-container">
            <Brain className="logo-icon" size={64} />
            <h1 className="logo-text">MemoryForge</h1>
          </div>
          <p className="hero-subtitle">
            Next-Generation AI Assistant with Document Intelligence
          </p>
          <p className="hero-description">
            Powered by GPT-3.5 and advanced RAG technology. Upload documents,
            chat with AI, and get intelligent responses based on your knowledge base.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Sign In
            </Link>
          </div>
        </div>

        {/* Animated Background */}
        <div className="hero-background">
          <div className="grid-overlay"></div>
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Powerful Features</h2>
          <div className="features-grid">
            <div className="feature-card fade-in">
              <Zap className="feature-icon" size={40} />
              <h3>Lightning Fast</h3>
              <p>Custom B-tree storage engine for instant retrieval and blazing performance</p>
            </div>

            <div className="feature-card fade-in">
              <Brain className="feature-icon" size={40} />
              <h3>AI-Powered</h3>
              <p>GPT-3.5-turbo integration for intelligent, context-aware conversations</p>
            </div>

            <div className="feature-card fade-in">
              <FileText className="feature-icon" size={40} />
              <h3>Document RAG</h3>
              <p>Upload documents and get AI answers based on your own knowledge base</p>
            </div>

            <div className="feature-card fade-in">
              <MessageSquare className="feature-icon" size={40} />
              <h3>Chat History</h3>
              <p>Persistent conversations with full message history and context retention</p>
            </div>

            <div className="feature-card fade-in">
              <Shield className="feature-icon" size={40} />
              <h3>Secure</h3>
              <p>Enterprise-grade authentication with session management and rate limiting</p>
            </div>

            <div className="feature-card fade-in">
              <Database className="feature-icon" size={40} />
              <h3>Scalable</h3>
              <p>Production-ready architecture supporting thousands of concurrent users</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="tech-stack">
        <div className="container">
          <h2 className="section-title">Built with Cutting-Edge Technology</h2>
          <div className="tech-grid">
            <div className="tech-item">
              <div className="tech-badge">C++17</div>
              <p>High-Performance Backend</p>
            </div>
            <div className="tech-item">
              <div className="tech-badge">GPT-3.5</div>
              <p>OpenAI Integration</p>
            </div>
            <div className="tech-item">
              <div className="tech-badge">B-Tree</div>
              <p>Custom Database</p>
            </div>
            <div className="tech-item">
              <div className="tech-badge">React</div>
              <p>Modern Frontend</p>
            </div>
            <div className="tech-item">
              <div className="tech-badge">RAG</div>
              <p>Document Intelligence</p>
            </div>
            <div className="tech-item">
              <div className="tech-badge">SSL/TLS</div>
              <p>Secure Communication</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Experience the Future of AI?</h2>
            <p>Join thousands of users leveraging intelligent document-based conversations</p>
            <Link to="/register" className="btn btn-primary btn-large">
              Start Free Today
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 MemoryForge. Built with passion and precision.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;