import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './LinkPreview.css';

const LinkPreview = ({ url }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchPreview = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/preview?url=${encodeURIComponent(url)}`);
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Preview error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPreview();
    return () => { isMounted = false; };
  }, [url]);

  if (loading) {
    return (
      <div className="link-preview-card glass loading">
        <div className="link-preview-shimmer"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="link-preview-card glass animate-fadeUp">
      {data.image && (
        <div className="link-preview-image">
          <img src={data.image} alt="" onError={(e) => e.target.style.display = 'none'} />
        </div>
      )}
      <div className="link-preview-content">
        <div className="link-preview-site">{data.siteName}</div>
        <div className="link-preview-title">{data.title}</div>
        {data.description && <div className="link-preview-desc">{data.description}</div>}
      </div>
      <div className="link-preview-arrow">↗</div>
    </a>
  );
};

export default LinkPreview;
