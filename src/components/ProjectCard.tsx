import React from 'react';
import { ExternalLink, Play } from 'lucide-react';

interface ProjectCardProps {
  title: string;
  description: string;
  tags: string[];
  githubUrl?: string;
  liveUrl?: string;
  thumbnail: string;
  isApp: boolean;
  onView: () => void;
}

// Inline Github icon component to replace missing brand icon in package
const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 24 24" 
    width="18" 
    height="18" 
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

export const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  description,
  tags,
  githubUrl,
  liveUrl,
  thumbnail,
  isApp,
  onView,
}) => {
  return (
    <div className="glass-card glass-card-hover project-card">
      <div className="project-thumbnail">
        <img src={thumbnail} alt={`${title} screenshot`} loading="lazy" />
        <div className="project-overlay">
          <button className="btn btn-primary" onClick={onView}>
            {isApp ? (
              <>
                <Play size={16} style={{ marginRight: '8px' }} />
                Launch Application
              </>
            ) : (
              <>
                <ExternalLink size={16} style={{ marginRight: '8px' }} />
                View Showcase
              </>
            )}
          </button>
        </div>
      </div>

      <div className="project-info">
        <h3>{title}</h3>
        <p className="project-desc">{description}</p>
        
        <div className="project-tags">
          {tags.map((tag, idx) => (
            <span key={idx} className="tag">{tag}</span>
          ))}
        </div>

        <div className="project-links">
          {isApp ? (
            <button 
              onClick={onView} 
              className="project-link-btn" 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
            >
              <Play size={16} style={{ marginRight: '4px', display: 'inline' }} />
              Run in Portfolio
            </button>
          ) : (
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Interactive Demo N/A</span>
          )}

          <div style={{ display: 'flex', gap: '16px' }}>
            {githubUrl && (
              <a 
                href={githubUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="project-link-btn"
                title="View Source on GitHub"
              >
                <GithubIcon />
              </a>
            )}
            {liveUrl && (
              <a 
                href={liveUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="project-link-btn"
                title="View Live Site"
              >
                <ExternalLink size={18} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
