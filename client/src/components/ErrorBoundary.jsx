import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Global Error Boundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-card glass">
            <div className="error-icon">⚠️</div>
            <h1 className="error-title">Oops! Something went wrong.</h1>
            <p className="error-message">
              The application encountered an unexpected error. Don't worry, your data is safe.
            </p>
            <div className="error-actions">
              <button 
                className="btn btn-primary" 
                onClick={() => window.location.href = '/dashboard'}
              >
                Go to Dashboard
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => window.location.reload()}
              >
                Reload App
              </button>
            </div>
            {process.env.NODE_ENV !== 'production' && (
              <pre className="error-stack">
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
