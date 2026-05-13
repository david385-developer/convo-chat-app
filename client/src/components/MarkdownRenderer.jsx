import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MarkdownRenderer.css';

const MarkdownRenderer = ({ content }) => {
  // Regex to detect @mentions and wrap them in a span
  const processMentions = (text) => {
    return text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
  };

  // We use a custom components object to style markdown elements
  const components = {
    code({ node, inline, className, children, ...props }) {
      return (
        <code className={inline ? 'inline-code' : 'block-code'} {...props}>
          {children}
        </code>
      );
    },
    a({ node, children, ...props }) {
      return (
        <a {...props} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
    table({ node, children, ...props }) {
      return (
        <div className="table-container">
          <table {...props}>{children}</table>
        </div>
      );
    },
    img({ node, ...props }) {
      return <img className="md-image" {...props} alt={props.alt || ''} />;
    }
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]} 
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
