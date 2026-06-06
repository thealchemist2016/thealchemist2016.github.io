import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Mail, User, ArrowRight, ShieldAlert, 
  Database, RefreshCw, Key, KeyRound 
} from 'lucide-react';
import './AppsStyles.css';

export const AuthPortalApp: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordHash, setPasswordHash] = useState<string>('');
  const [jwtToken, setJwtToken] = useState<string>('');
  const [stage, setStage] = useState<'form' | 'mfa' | 'success'>('form');
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(''));
  const [generatedOtp, setGeneratedOtp] = useState<string>('');

  // Password strength checker
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: '#6b7280' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1: return { score: 25, label: 'Weak', color: '#ef4444' };
      case 2: return { score: 50, label: 'Fair', color: '#f59e0b' };
      case 3: return { score: 75, label: 'Strong', color: '#10b981' };
      case 4: return { score: 100, label: 'Excellent', color: '#22c55e' };
      default: return { score: 10, label: 'Too Short', color: '#ef4444' };
    }
  };

  const strength = getPasswordStrength(password);

  // Compute Cryptographic Hash using browser Web Crypto API
  const computeSHA256 = async (text: string) => {
    if (!text) return '';
    try {
      const msgBuffer = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (e) {
      console.error(e);
      return '';
    }
  };

  // Handle forms submit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || (!isLogin && !email)) return;

    // Cryptographically hash the password before sending to simulated DB
    const hash = await computeSHA256(password);
    setPasswordHash(hash);

    // Create a mock JWT token
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: 'usr_81924',
      name: username,
      email: email || `${username}@domain.local`,
      role: 'developer',
      exp: Math.floor(Date.now() / 1000) + 3600
    }));
    const signature = btoa('mock_cryptographic_signing_key_payload');
    const token = `${header}.${payload}.${signature}`;
    setJwtToken(token);

    // Trigger MFA OTP step
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setStage('mfa');
  };

  const handleOtpInput = (val: string, index: number) => {
    if (isNaN(Number(val))) return;

    const newOtp = [...otpCode];
    newOtp[index] = val;
    setOtpCode(newOtp);

    // Auto focus next
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otpCode.join('');
    if (entered === generatedOtp || entered === '123456') { // Allow 123456 as bypass
      setStage('success');
      sessionStorage.setItem('jwt_token', jwtToken);
    } else {
      alert('Invalid Multi-Factor code! Try again or use code: ' + generatedOtp);
    }
  };

  const resetPortal = () => {
    setStage('form');
    setUsername('');
    setEmail('');
    setPassword('');
    setPasswordHash('');
    setJwtToken('');
    setOtpCode(Array(6).fill(''));
  };

  const getJwtPayload = () => {
    if (!jwtToken) return '';
    try {
      const parts = jwtToken.split('.');
      return JSON.stringify(JSON.parse(atob(parts[1])), null, 2);
    } catch (e) {
      return '{}';
    }
  };

  return (
    <div className="app-wrapper" style={{ minHeight: '100%', background: 'linear-gradient(135deg, #0b0c16 0%, #06060c 100%)' }}>
      <div className="app-header-bar">
        <h2>
          <ShieldCheck size={18} color="var(--accent)" />
          Authentication Cryptography Portal
        </h2>
        <span className="tag" style={{ fontSize: '0.65rem' }}>WebCrypto & SHA-256</span>
      </div>

      <div className="app-scroll-content">
        <div className="auth-container">
          {stage === 'form' && (
            <div className="auth-card">
              <div className="auth-card-glow"></div>
              
              <div className="auth-header">
                <h3>{isLogin ? 'Sign In' : 'Create Account'}</h3>
                <p>{isLogin ? 'Access your developer profile credentials' : 'Register a new cryptographic key identity'}</p>
              </div>

              <form onSubmit={handleSubmitForm} style={{ zIndex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="records-input-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={12} /> Username
                  </label>
                  <input 
                    type="text" 
                    className="records-input" 
                    placeholder="mike_byrd" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                {!isLogin && (
                  <div className="records-input-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={12} /> Email Address
                    </label>
                    <input 
                      type="email" 
                      className="records-input" 
                      placeholder="mbyrd405@outlook.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="records-input-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={12} /> Password
                  </label>
                  <input 
                    type="password" 
                    className="records-input" 
                    placeholder="••••••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {password && (
                    <div>
                      <div className="strength-meter-bar">
                        <div 
                          className="strength-meter-fill" 
                          style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
                        />
                      </div>
                      <span style={{ fontSize: '0.65rem', color: strength.color, fontWeight: 700, marginTop: '2px', display: 'block' }}>
                        Password Strength: {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="sim-btn" 
                  style={{ width: '100%', marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '6px' }}
                >
                  {isLogin ? 'Sign In' : 'Register'}
                  <ArrowRight size={14} />
                </button>
              </form>

              <div style={{ zIndex: 1, textAlign: 'center', fontSize: '0.75rem' }}>
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                </button>
              </div>
            </div>
          )}

          {stage === 'mfa' && (
            <div className="auth-card" style={{ textAlign: 'center' }}>
              <div className="auth-header">
                <h3>Multi-Factor Authentication</h3>
                <p>Enter the 2FA code sent to your simulated authenticator device</p>
              </div>

              <form onSubmit={handleVerifyOtp} style={{ zIndex: 1 }}>
                <div className="mfa-otp-box">
                  {otpCode.map((val, idx) => (
                    <input 
                      key={idx}
                      id={`otp-${idx}`}
                      type="text" 
                      maxLength={1}
                      className="otp-input"
                      value={val}
                      onChange={(e) => handleOtpInput(e.target.value, idx)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !val && idx > 0) {
                          const prevInput = document.getElementById(`otp-${idx - 1}`);
                          prevInput?.focus();
                        }
                      }}
                      required
                    />
                  ))}
                </div>

                <div 
                  className="glass-card" 
                  style={{ padding: '12px', background: 'rgba(var(--accent-rgb), 0.05)', border: '1px solid rgba(var(--accent-rgb), 0.15)', fontSize: '0.75rem', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}
                >
                  <span style={{ fontWeight: 700, display: 'block' }}>Simulated Authenticator Code:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', letterSpacing: '2px', color: 'var(--accent)' }}>
                    {generatedOtp}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="sim-btn" style={{ flex: 1 }}>Verify Code</button>
                  <button type="button" className="sim-btn sim-btn-secondary" onClick={resetPortal}>Back</button>
                </div>
              </form>
            </div>
          )}

          {stage === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '750px', zIndex: 1 }}>
              <div className="glass-card" style={{ padding: '24px', textAlign: 'center', background: 'rgba(34, 197, 94, 0.05)', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
                <ShieldCheck size={48} color="#22c55e" style={{ margin: '0 auto 12px' }} />
                <h3>Authentication Success!</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Welcome back, <strong>{username}</strong>. Session keys successfully mounted in local browser context.</p>
                <button className="sim-btn" style={{ marginTop: '16px', display: 'inline-flex' }} onClick={resetPortal}>
                  <RefreshCw size={12} style={{ marginRight: '6px' }} /> Reset Session
                </button>
              </div>

              {/* Cryptography Insights Panel */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
                {/* JWT decoder */}
                <div className="glass-card" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '0.85rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Key size={14} color="var(--accent)" />
                    Session JSON Web Token (JWT)
                  </h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    This cryptographically encoded token certifies authentication claims. It is split into 3 segments separated by periods: Header, Payload, and Signature.
                  </p>

                  <div className="jwt-debug-view" style={{ overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    <span className="jwt-seg-header">{jwtToken.split('.')[0]}</span>
                    <span>.</span>
                    <span className="jwt-seg-payload">{jwtToken.split('.')[1]}</span>
                    <span>.</span>
                    <span className="jwt-seg-sig">{jwtToken.split('.')[2]}</span>
                  </div>

                  <h5 style={{ fontSize: '0.75rem', marginTop: '16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Database size={12} /> Decoded Payload Claims
                  </h5>
                  <pre className="jwt-debug-view" style={{ background: '#05060b', padding: '8px' }}>
                    {getJwtPayload()}
                  </pre>
                </div>

                {/* Password Hashing */}
                <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <KeyRound size={14} color="var(--accent)" />
                    SHA-256 Password Hash
                  </h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Passwords should never be stored in plain text. Under the hood, we used the browser\'s **Web Crypto API** to compute this unique 256-bit hexadecimal digest signature of your password:
                  </p>

                  <div 
                    style={{ 
                      padding: '10px', 
                      background: '#05060b', 
                      border: '1px solid var(--glass-border)', 
                      borderRadius: '6px', 
                      fontFamily: 'var(--font-mono)', 
                      fontSize: '0.65rem',
                      wordBreak: 'break-all'
                    }}
                  >
                    {passwordHash}
                  </div>

                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '10px', fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px' }}>
                    <ShieldAlert size={12} color="var(--accent)" style={{ flexShrink: 0 }} />
                    <span>SHA-256 hashing is one-way. A matching hash validates credentials without the server ever knowing your actual text password.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
