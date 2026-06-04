import React from 'react';
import { X, ExternalLink, Smartphone, Monitor } from 'lucide-react';

interface ProjectViewerProps {
  title: string;
  description: string;
  tags: string[];
  liveUrl: string;
  githubUrl?: string;
  isMobile: boolean;
  onClose: () => void;
}

// Inline Github icon component to replace missing brand icon in package
const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 24 24" 
    width="14" 
    height="14" 
    stroke="currentColor" 
    strokeWidth="2" 
    fill="none" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

export const ProjectViewer: React.FC<ProjectViewerProps> = ({
  title,
  description,
  tags,
  liveUrl,
  githubUrl,
  isMobile,
  onClose,
}) => {
  const [usePhoneFrame, setUsePhoneFrame] = React.useState<boolean>(isMobile);

  return (
    <div className="viewer-modal">
      <div className="viewer-header">
        <div className="viewer-meta">
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{title}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={description}>
              {description}
            </p>
          </div>
          <div style={{ display: 'none' }} className="tech-tags">
            {tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="tag">{tag}</span>
            ))}
          </div>
        </div>

        <div className="viewer-actions">
          {/* Toggle chassis frame for responsive apps */}
          <button 
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setUsePhoneFrame(!usePhoneFrame)}
            title={usePhoneFrame ? "Switch to Desktop view" : "Switch to Mobile Phone view"}
          >
            {usePhoneFrame ? <Monitor size={14} /> : <Smartphone size={14} />}
            {usePhoneFrame ? "Desktop View" : "Mobile Mockup"}
          </button>

          {githubUrl && (
            <a 
              href={githubUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <GithubIcon />
              Code
            </a>
          )}

          <a 
            href={liveUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-primary"
            style={{ padding: '6px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ExternalLink size={14} />
            Full Screen
          </a>

          <button className="viewer-btn-close" onClick={onClose} aria-label="Close Project Viewer">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="viewer-iframe-container">
        {usePhoneFrame ? (
          <div className="phone-mockup-wrapper">
            <div className="phone-mockup animate-scale-up">
              <iframe 
                src={liveUrl} 
                className="phone-screen" 
                title={`${title} mobile view`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          </div>
        ) : (
          <iframe 
            src={liveUrl} 
            className="viewer-iframe" 
            title={`${title} full view`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        )}
      </div>
    </div>
  );
};
