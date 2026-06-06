import React, { useState } from 'react';
import { X, ExternalLink, Smartphone, Monitor, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProjectViewerProps {
  title: string;
  description: string;
  liveUrl?: string;
  githubUrl?: string;
  isMobile: boolean;
  screenshots?: string[];
  onClose: () => void;
}

// Inline Github icon component
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
  liveUrl,
  githubUrl,
  isMobile,
  screenshots,
  onClose,
}) => {
  const [usePhoneFrame, setUsePhoneFrame] = useState<boolean>(isMobile);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const hasSlides = screenshots && screenshots.length > 0;
  const [viewMode, setViewMode] = useState<'app' | 'screenshots'>(liveUrl ? 'app' : 'screenshots');

  const nextSlide = () => {
    if (hasSlides) {
      setCurrentSlide((prev) => (prev + 1) % screenshots.length);
    }
  };

  const prevSlide = () => {
    if (hasSlides) {
      setCurrentSlide((prev) => (prev - 1 + screenshots.length) % screenshots.length);
    }
  };

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
        </div>

        <div className="viewer-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Toggle between App and Screenshots if both are available */}
          {liveUrl && hasSlides && (
            <div className="toggle-group" style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px', border: '1px solid var(--glass-border)' }}>
              <button
                className="toggle-btn"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.8rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: viewMode === 'app' ? 'var(--accent)' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'background-color var(--transition-fast)'
                }}
                onClick={() => setViewMode('app')}
              >
                Live App
              </button>
              <button
                className="toggle-btn"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.8rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: viewMode === 'screenshots' ? 'var(--accent)' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'background-color var(--transition-fast)'
                }}
                onClick={() => setViewMode('screenshots')}
              >
                Screenshots
              </button>
            </div>
          )}

          {/* Toggle chassis frame for responsive apps (only if not viewing screenshot deck) */}
          {viewMode === 'app' && liveUrl && (
            <button 
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setUsePhoneFrame(!usePhoneFrame)}
              title={usePhoneFrame ? "Switch to Desktop view" : "Switch to Mobile Phone view"}
            >
              {usePhoneFrame ? <Monitor size={14} /> : <Smartphone size={14} />}
              {usePhoneFrame ? "Desktop View" : "Mobile Mockup"}
            </button>
          )}

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

          {viewMode === 'app' && liveUrl && (
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
          )}

          <button className="viewer-btn-close" onClick={onClose} aria-label="Close Project Viewer">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="viewer-iframe-container" style={{ display: 'flex', flexDirection: 'column' }}>
        {viewMode === 'screenshots' && hasSlides ? (
          /* Screenshot Carousel Mode */
          <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '24px' }}>
            <div style={{ position: 'relative', maxWidth: '85%', maxHeight: '75%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
              <img 
                src={screenshots[currentSlide]} 
                alt={`${title} slide ${currentSlide + 1}`} 
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} 
              />
              
              {screenshots.length > 1 && (
                <>
                  <button 
                    onClick={prevSlide}
                    style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(10,11,16,0.8)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', transition: 'all var(--transition-fast)' }}
                    title="Previous Slide"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={nextSlide}
                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(10,11,16,0.8)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', transition: 'all var(--transition-fast)' }}
                    title="Next Slide"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Slide Indicators */}
            {screenshots.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                {screenshots.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: idx === currentSlide ? 'var(--accent)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'background-color var(--transition-fast)'
                    }}
                    title={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '10px' }}>
              Slide {currentSlide + 1} of {screenshots.length}
            </p>
          </div>
        ) : (
          /* Live Iframe Mode */
          usePhoneFrame ? (
            <div className="phone-mockup-wrapper">
              <div className="phone-mockup animate-scale-up">
                <iframe 
                  src={liveUrl} 
                  className="phone-screen" 
                  title={`${title} mobile view`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            </div>
          ) : (
            <iframe 
              src={liveUrl} 
              className="viewer-iframe" 
              title={`${title} full view`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          )
        )}
      </div>
    </div>
  );
};
