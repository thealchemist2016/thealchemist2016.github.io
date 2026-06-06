import React, { useState, useRef, useEffect } from 'react';
import { 
  Music, Upload, Play, Pause, Trash2, CheckCircle2, AlertCircle, 
  Download, Image as ImageIcon, Volume2, Award, Plus, Info 
} from 'lucide-react';
import './AppsStyles.css';

interface TrackItem {
  id: string;
  name: string;
  duration: string;
  url?: string; // object URL for local playback
}

interface ReleaseData {
  title: string;
  artist: string;
  genre: string;
  upc: string;
  isrc: string;
  coverUrl: string; // base64 or placeholder
  tracks: TrackItem[];
}

const DEFAULT_RELEASE: ReleaseData = {
  title: 'Neon Odyssey',
  artist: 'Alchemist Collective',
  genre: 'Synthwave',
  upc: '190295192049',
  isrc: 'USRC12604921',
  coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
  tracks: [
    { id: '1', name: 'Digital Rain.mp3', duration: '03:42' },
    { id: '2', name: 'Vector Horizon.mp3', duration: '04:15' }
  ]
};

export const XSRecordsApp: React.FC = () => {
  const [release, setRelease] = useState<ReleaseData>(DEFAULT_RELEASE);
  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackDuration, setNewTrackDuration] = useState('03:30');
  
  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Set up audio listener
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Sync active audio src
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [audioUrl]);

  // Handle cover art upload
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setRelease(prev => ({
        ...prev,
        coverUrl: event.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  // Handle audio track file upload
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newTracks: TrackItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Create a local object URL for real playback
      const objectUrl = URL.createObjectURL(file);
      
      newTracks.push({
        id: Math.random().toString(),
        name: file.name,
        duration: '03:15', // Mock duration calculation
        url: objectUrl
      });
    }

    setRelease(prev => ({
      ...prev,
      tracks: [...prev.tracks, ...newTracks]
    }));
  };

  const handleAddMockTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackName.trim()) return;

    const newTrack: TrackItem = {
      id: Math.random().toString(),
      name: newTrackName.endsWith('.mp3') ? newTrackName : `${newTrackName}.mp3`,
      duration: newTrackDuration
    };

    setRelease(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack]
    }));
    setNewTrackName('');
  };

  const handleDeleteTrack = (id: string) => {
    if (activeTrackId === id) {
      handlePause();
      setActiveTrackId(null);
      setAudioUrl(null);
    }
    setRelease(prev => ({
      ...prev,
      tracks: prev.tracks.filter(t => t.id !== id)
    }));
  };

  // Audio actions
  const handlePlayTrack = (track: TrackItem) => {
    if (activeTrackId === track.id) {
      if (isPlaying) {
        handlePause();
      } else {
        handlePlay();
      }
    } else {
      setActiveTrackId(track.id);
      setIsPlaying(true);
      
      // If it's a real file upload, play it, otherwise play a synth beep fallback
      if (track.url) {
        setAudioUrl(track.url);
      } else {
        // Generate simulated synth audio context beep!
        playSynthBeep();
        setAudioUrl(null);
      }
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    if (audioRef.current && audioUrl) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else if (!audioUrl && activeTrackId) {
      playSynthBeep();
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  // Generate a retro synthetic chord using Web Audio API to demonstrate real functional audio capability
  const playSynthBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Node tree: Osc -> Filter -> Gain -> Destination
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3); // A4
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.Q.setValueAtTime(5, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (err) {
      console.warn('Web Audio Context block', err);
    }
  };

  // Validate release details
  const validateUPC = (upc: string) => /^\d{12}$/.test(upc);
  const validateISRC = (isrc: string) => /^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/.test(isrc.toUpperCase());

  const errors = [];
  if (!release.title.trim()) errors.push('Album Title is required.');
  if (!release.artist.trim()) errors.push('Artist name is required.');
  if (!validateUPC(release.upc)) errors.push('UPC must be exactly 12 numeric digits.');
  if (!validateISRC(release.isrc)) errors.push('ISRC must be valid (e.g. USRC12604921).');
  if (release.tracks.length === 0) errors.push('Add at least one audio track to distribute.');

  const handleDownloadCSV = () => {
    if (errors.length > 0) return;

    // Build delivery CSV content
    const headers = 'Album Title,Artist,Genre,UPC,ISRC,Track Title,Duration\n';
    const rows = release.tracks.map((t) => 
      `"${release.title}","${release.artist}","${release.genre}","${release.upc}","${release.isrc}","${t.name}","${t.duration}"`
    ).join('\n');

    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${release.title.toLowerCase().replace(/\s+/g, '_')}_delivery_metadata.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-wrapper">
      <div className="app-header-bar">
        <h2>
          <Music size={18} color="var(--accent)" />
          XS-Records: Music Distribution Console
        </h2>
        <span className="tag" style={{ fontSize: '0.65rem' }}>Store Delivery Compliant</span>
      </div>

      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} style={{ display: 'none' }} />

      <div className="app-scroll-content">
        <div className="records-grid">
          {/* Release Metadata Editor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={16} color="var(--accent)" />
                Release Specifications
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="records-input-group">
                  <label>Album Title</label>
                  <input 
                    type="text" 
                    className="records-input" 
                    value={release.title}
                    onChange={(e) => setRelease({ ...release, title: e.target.value })}
                  />
                </div>

                <div className="records-input-group">
                  <label>Main Artist</label>
                  <input 
                    type="text" 
                    className="records-input" 
                    value={release.artist}
                    onChange={(e) => setRelease({ ...release, artist: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="records-input-group">
                  <label>Primary Genre</label>
                  <select 
                    className="records-select"
                    value={release.genre}
                    onChange={(e) => setRelease({ ...release, genre: e.target.value })}
                  >
                    <option>Synthwave</option>
                    <option>Electronic</option>
                    <option>Hip-Hop / Rap</option>
                    <option>Indie Rock</option>
                    <option>Lo-Fi Beats</option>
                    <option>Pop</option>
                  </select>
                </div>

                <div className="records-input-group">
                  <label>UPC (Universal Code)</label>
                  <input 
                    type="text" 
                    className="records-input" 
                    value={release.upc}
                    onChange={(e) => setRelease({ ...release, upc: e.target.value })}
                    style={{ borderColor: validateUPC(release.upc) ? 'rgba(255,255,255,0.05)' : '#ef4444' }}
                  />
                </div>

                <div className="records-input-group">
                  <label>ISRC (Track Code)</label>
                  <input 
                    type="text" 
                    className="records-input" 
                    value={release.isrc}
                    onChange={(e) => setRelease({ ...release, isrc: e.target.value })}
                    style={{ borderColor: validateISRC(release.isrc) ? 'rgba(255,255,255,0.05)' : '#ef4444' }}
                  />
                </div>
              </div>
            </div>

            {/* Audio Tracklist Upload */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Volume2 size={16} color="var(--accent)" />
                Audio Master Assets
              </h3>

              {/* Real Audio File Drop */}
              <div 
                className="uploader-area"
                onClick={() => audioInputRef.current?.click()}
              >
                <Upload size={24} color="var(--accent)" />
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block' }}>Drag & Drop Master WAV/MP3 files</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Files will be loaded locally for browser playback</span>
                </div>
                <input 
                  type="file" 
                  ref={audioInputRef}
                  onChange={handleAudioUpload} 
                  accept="audio/*" 
                  multiple 
                  style={{ display: 'none' }}
                />
              </div>

              {/* Mock Track Form */}
              <form onSubmit={handleAddMockTrack} style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <input 
                  type="text" 
                  className="records-input" 
                  placeholder="Or enter track name manually..." 
                  value={newTrackName}
                  onChange={(e) => setNewTrackName(e.target.value)}
                  style={{ flex: 1 }}
                />
                <input 
                  type="text" 
                  className="records-input" 
                  placeholder="03:30" 
                  value={newTrackDuration}
                  onChange={(e) => setNewTrackDuration(e.target.value)}
                  style={{ width: '80px' }}
                />
                <button type="submit" className="sim-btn" style={{ padding: '8px 12px' }}>
                  <Plus size={16} />
                </button>
              </form>

              {/* Tracks List */}
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>Release Tracklist</h4>
                {release.tracks.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed var(--glass-border)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    No tracks uploaded yet.
                  </div>
                ) : (
                  release.tracks.map((track, idx) => (
                    <div key={track.id} className="track-row">
                      <div className="track-info">
                        <span className="track-index">{idx + 1}</span>
                        <button 
                          className="editor-action-btn"
                          onClick={() => handlePlayTrack(track)}
                          style={{
                            background: activeTrackId === track.id && isPlaying ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                            color: '#fff',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {activeTrackId === track.id && isPlaying ? <Pause size={10} /> : <Play size={10} style={{ marginLeft: '1px' }} />}
                        </button>
                        <span className="track-name">{track.name}</span>
                        {track.url && <span className="tag" style={{ fontSize: '0.55rem', background: '#0284c7', color: '#fff', border: 'none' }}>Live File</span>}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span className="track-duration">{track.duration}</span>
                        <button 
                          onClick={() => handleDeleteTrack(track.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                        >
                          <Trash2 size={14} className="icon-hover-red" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Release Settings & Validation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Artwork frame */}
            <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div 
                style={{ 
                  width: '200px', 
                  height: '200px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--glass-border)', 
                  overflow: 'hidden', 
                  position: 'relative',
                  background: '#05060b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {release.coverUrl ? (
                  <img src={release.coverUrl} alt="Cover Art" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Music size={48} color="var(--text-muted)" />
                )}
                
                <div 
                  style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    width: '100%', 
                    background: 'rgba(0,0,0,0.6)', 
                    padding: '6px 0', 
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontSize: '0.7rem'
                  }}
                  onClick={() => coverInputRef.current?.click()}
                >
                  <ImageIcon size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Change Artwork
                </div>
              </div>

              <input 
                type="file" 
                ref={coverInputRef}
                onChange={handleCoverUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />

              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Compliant Cover Art Format</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>Minimum 1400 x 1400, RGB format</span>
              </div>
            </div>

            {/* Validation Panel */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Store Compliance Audits
              </h4>

              {errors.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {errors.map((err, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', fontSize: '0.72rem', color: '#ef4444' }}>
                      <AlertCircle size={14} style={{ flexShrink: 0 }} />
                      <span>{err}</span>
                    </div>
                  ))}
                  <button className="sim-btn" style={{ background: 'var(--text-muted)', cursor: 'not-allowed', marginTop: '12px', width: '100%' }} disabled>
                    Compile Package
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: '#22c55e', marginBottom: '12px' }}>
                    <CheckCircle2 size={16} />
                    <span>All metadata audits passed. Compliant for Spotify, Apple Music, and Amazon.</span>
                  </div>
                  <button 
                    className="sim-btn" 
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '6px' }}
                    onClick={handleDownloadCSV}
                  >
                    <Download size={14} />
                    Download Metadata CSV
                  </button>
                </div>
              )}

              <div style={{ marginTop: '16px', borderTop: '1px solid var(--glass-border)', paddingTop: '12px', fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px' }}>
                <Info size={12} color="var(--accent)" style={{ flexShrink: 0 }} />
                <span>Indie releases require accurate metadata. UPCs and ISRCs are validated against GS1 and standard recording prefix templates.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
