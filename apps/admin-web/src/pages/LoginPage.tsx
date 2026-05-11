import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAuthStore } from '../stores/authStore';

// ── Animated background dots ─────────────────────────────
const DOT_POSITIONS = [
  { cx: 60,  cy: 40  }, { cx: 180, cy: 80  }, { cx: 320, cy: 30  },
  { cx: 420, cy: 100 }, { cx: 80,  cy: 160 }, { cx: 260, cy: 140 },
  { cx: 380, cy: 200 }, { cx: 140, cy: 260 }, { cx: 300, cy: 300 },
  { cx: 460, cy: 260 }, { cx: 40,  cy: 340 }, { cx: 200, cy: 380 },
  { cx: 350, cy: 360 }, { cx: 100, cy: 440 }, { cx: 440, cy: 420 },
  { cx: 240, cy: 460 }, { cx: 60,  cy: 500 }, { cx: 400, cy: 500 },
];

const CONNECTIONS = [
  [0,1],[1,2],[2,3],[1,5],[5,6],[4,5],[5,8],[8,9],[7,8],
  [8,11],[11,12],[10,11],[11,14],[13,14],[14,16],[12,15],[15,16],
];

export function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) navigate('/monitor/objects', { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div className="login-root">
      {/* ── Left Panel ── */}
      <div className="login-left">
        {/* Animated network map background */}
        <svg className="login-bg-svg" viewBox="0 0 500 540" preserveAspectRatio="xMidYMid slice">
          {CONNECTIONS.map(([a, b], i) => (
            <line
              key={i}
              x1={DOT_POSITIONS[a].cx} y1={DOT_POSITIONS[a].cy}
              x2={DOT_POSITIONS[b].cx} y2={DOT_POSITIONS[b].cy}
              stroke="rgba(99,179,237,0.18)" strokeWidth="1"
            />
          ))}
          {DOT_POSITIONS.map((d, i) => (
            <circle key={i} cx={d.cx} cy={d.cy} r={i % 4 === 0 ? 4 : 2.5}
              fill={i % 4 === 0 ? 'rgba(99,179,237,0.55)' : 'rgba(99,179,237,0.3)'}
            />
          ))}
          {/* Active "vehicle" pings */}
          {[1, 5, 8, 12].map((i) => (
            <circle key={`ping-${i}`} cx={DOT_POSITIONS[i].cx} cy={DOT_POSITIONS[i].cy}
              r="8" fill="none" stroke="rgba(96,165,250,0.6)" strokeWidth="1.5"
              style={{ animation: `ping 2.5s ease-out ${i * 0.5}s infinite` }}
            />
          ))}
        </svg>

        {/* Content */}
        <div className="login-left-content">
          {/* Brand */}
          <div className="login-brand">
            <div className="login-brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
            </div>
            <span className="login-brand-name">IoT Tracking</span>
          </div>

          {/* Hero illustration */}
          <div className="login-hero">
            <svg viewBox="0 0 260 200" fill="none" className="login-hero-svg">
              {/* Road */}
              <path d="M10 160 Q130 100 250 160" stroke="rgba(255,255,255,0.15)" strokeWidth="28" strokeLinecap="round"/>
              <path d="M10 160 Q130 100 250 160" stroke="rgba(255,255,255,0.08)" strokeWidth="30" strokeLinecap="round"/>
              {/* Road dashes */}
              <path d="M80 133 Q100 124 120 118" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="8 8"/>
              {/* Vehicle 1 */}
              <g transform="translate(95,112) rotate(-12)">
                <rect x="-14" y="-8" width="28" height="16" rx="4" fill="#3b82f6"/>
                <rect x="-10" y="-12" width="20" height="10" rx="3" fill="#60a5fa"/>
                <circle cx="-8" cy="9" r="4" fill="#1e293b"/>
                <circle cx="8"  cy="9" r="4" fill="#1e293b"/>
                <circle cx="-8" cy="9" r="2" fill="#475569"/>
                <circle cx="8"  cy="9" r="2" fill="#475569"/>
                <rect x="4" y="-7" width="5" height="4" rx="1" fill="#bfdbfe" opacity="0.9"/>
              </g>
              {/* Vehicle 2 */}
              <g transform="translate(155,118) rotate(-8)">
                <rect x="-12" y="-7" width="24" height="14" rx="3" fill="#10b981"/>
                <rect x="-8"  y="-11" width="16" height="9"  rx="2" fill="#34d399"/>
                <circle cx="-6" cy="8" r="3.5" fill="#1e293b"/>
                <circle cx="6"  cy="8" r="3.5" fill="#1e293b"/>
                <circle cx="-6" cy="8" r="1.5" fill="#475569"/>
                <circle cx="6"  cy="8" r="1.5" fill="#475569"/>
              </g>
              {/* Map pins */}
              <g transform="translate(60,60)">
                <circle cx="0" cy="0" r="10" fill="#f59e0b" opacity="0.9"/>
                <path d="M0 10 L0 20" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="0" cy="0" r="4" fill="white"/>
              </g>
              <g transform="translate(195,50)">
                <circle cx="0" cy="0" r="8" fill="#ef4444" opacity="0.9"/>
                <path d="M0 8 L0 18" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="0" cy="0" r="3" fill="white"/>
              </g>
              {/* Route line */}
              <path d="M60 60 Q110 40 195 50" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeDasharray="5 5"/>
              {/* Signal rings */}
              <circle cx="60" cy="60" r="18" fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.4"
                style={{animation:'ping 2s ease-out 0s infinite'}}/>
              <circle cx="195" cy="50" r="14" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.4"
                style={{animation:'ping 2s ease-out 0.7s infinite'}}/>
            </svg>
          </div>

          {/* Headline */}
          <h2 className="login-headline">Real-time Fleet Tracking</h2>
          <p className="login-subheadline">
            Monitor vehicles, assets &amp; IoT devices<br/>from a single unified dashboard.
          </p>

          {/* Stats */}
          <div className="login-stats">
            <div className="login-stat">
              <span className="login-stat-value">25K+</span>
              <span className="login-stat-label">Devices</span>
            </div>
            <div className="login-stat-divider"/>
            <div className="login-stat">
              <span className="login-stat-value">99.9%</span>
              <span className="login-stat-label">Uptime</span>
            </div>
            <div className="login-stat-divider"/>
            <div className="login-stat">
              <span className="login-stat-value">Live</span>
              <span className="login-stat-label">Real-time</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="login-right">
        <div className="login-form-card">
          <LoginForm />
        </div>
      </div>

      <style>{`
        @keyframes ping {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        .login-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', system-ui, sans-serif;
          background: #0f172a;
        }

        /* ── Left ── */
        .login-left {
          display: none;
          position: relative;
          overflow: hidden;
          background: linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #0f2044 100%);
        }
        @media (min-width: 1024px) {
          .login-left { display: flex; flex: 1; align-items: center; justify-content: center; }
        }

        .login-bg-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0.7;
        }

        .login-left-content {
          position: relative;
          z-index: 1;
          padding: 48px;
          max-width: 460px;
          width: 100%;
        }

        .login-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 48px;
        }
        .login-brand-icon {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: white;
          box-shadow: 0 4px 14px rgba(59,130,246,0.5);
        }
        .login-brand-icon svg { width: 20px; height: 20px; }
        .login-brand-name {
          font-size: 18px; font-weight: 700;
          color: white; letter-spacing: -0.3px;
        }

        .login-hero { margin-bottom: 32px; }
        .login-hero-svg { width: 100%; max-width: 320px; filter: drop-shadow(0 8px 32px rgba(59,130,246,0.25)); }

        .login-headline {
          font-size: 28px; font-weight: 800;
          color: white; margin: 0 0 12px;
          letter-spacing: -0.5px; line-height: 1.2;
        }
        .login-subheadline {
          font-size: 15px; color: #94a3b8;
          line-height: 1.6; margin: 0 0 36px;
        }

        .login-stats {
          display: flex; align-items: center; gap: 24px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 18px 24px;
        }
        .login-stat { display: flex; flex-direction: column; gap: 2px; }
        .login-stat-value { font-size: 20px; font-weight: 700; color: #60a5fa; }
        .login-stat-label { font-size: 12px; color: #64748b; font-weight: 500; }
        .login-stat-divider { width: 1px; height: 32px; background: rgba(255,255,255,0.1); }

        /* ── Right ── */
        .login-right {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
        }
        @media (min-width: 1024px) {
          .login-right { width: 480px; min-width: 480px; flex-shrink: 0; }
        }

        .login-form-card {
          width: 100%;
          max-width: 400px;
          background: white;
          border-radius: 20px;
          padding: 40px 36px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07), 0 20px 60px -10px rgba(0,0,0,0.12);
        }
      `}</style>
    </div>
  );
}
