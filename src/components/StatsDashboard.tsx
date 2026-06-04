import React from 'react';
import { Code, Clock } from 'lucide-react';

export const StatsDashboard: React.FC = () => {
  return (
    <div id="stats" className="stats-section">
      <h2 className="section-title">Coding Analytics</h2>
      <p className="subtitle">
        Real-time statistics tracked directly from my development environments, reflecting my daily coding patterns and tech stack usage.
      </p>

      <div className="stats-grid">
        {/* Coding Activity Card */}
        <div className="glass-card stats-card">
          <h3>
            <Clock className="icon" size={20} color="#dc2626" />
            Coding Activity (Last 30 Days)
          </h3>
          <div className="stats-embed">
            <figure>
              <embed 
                src="https://wakatime.com/share/@thealchemist2016/a7aa532c-ced7-44b1-97c0-1802e61b3389.svg" 
                type="image/svg+xml"
              />
            </figure>
          </div>
        </div>

        {/* Language Breakdown Card */}
        <div className="glass-card stats-card">
          <h3>
            <Code className="icon" size={20} color="#dc2626" />
            Languages Used (Last 30 Days)
          </h3>
          <div className="stats-embed">
            <figure>
              <embed 
                src="https://wakatime.com/share/@thealchemist2016/504a9d76-4aed-47b3-863f-5db1511bd7d5.svg" 
                type="image/svg+xml"
              />
            </figure>
          </div>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <a 
          href="https://wakatime.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}
        >
          Powered by WakaTime
        </a>
      </div>
    </div>
  );
};
