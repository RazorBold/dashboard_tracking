import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAuthStore } from '../stores/authStore';

const R = 160;
const CX = 200;
const CY = 200;

// Latitude lines: y position and ellipse rx
const LAT_LINES = [-65, -45, -25, 0, 25, 45, 65].map((deg) => {
  const rad = (deg * Math.PI) / 180;
  const y   = CY - R * Math.sin(rad);
  const rx  = R * Math.cos(rad);
  return { y, rx, ry: Math.max(rx * 0.08, 1) };
});

// Location markers [x%, y%] relative to globe center
const MARKERS = [
  { x: CX - 40, y: CY - 30, delay: 0,    color: '#34d399' }, // Jakarta area
  { x: CX + 60, y: CY - 60, delay: 0.6,  color: '#60a5fa' }, // East
  { x: CX - 90, y: CY + 20, delay: 1.2,  color: '#f59e0b' }, // West
  { x: CX + 20, y: CY + 50, delay: 1.8,  color: '#a78bfa' }, // South-east
  { x: CX - 10, y: CY - 80, delay: 2.4,  color: '#34d399' }, // North
];

// Arc connections between markers
const ARCS = [
  { x1: CX-40, y1: CY-30, x2: CX+60, y2: CY-60, cpx: CX+15, cpy: CY-100 },
  { x1: CX-40, y1: CY-30, x2: CX-90, y2: CY+20, cpx: CX-90, cpy: CY-50  },
  { x1: CX+60, y1: CY-60, x2: CX+20, y2: CY+50, cpx: CX+90, cpy: CY     },
];

function Globe() {
  return (
    <svg viewBox="0 0 400 400" className="lp-globe-svg" aria-hidden>
      <defs>
        {/* Sphere fill gradient — light source top-left */}
        <radialGradient id="g-sphere" cx="36%" cy="32%" r="68%">
          <stop offset="0%"   stopColor="#2563eb" stopOpacity="1" />
          <stop offset="45%"  stopColor="#1d4ed8" stopOpacity="1" />
          <stop offset="100%" stopColor="#060f2e" stopOpacity="1" />
        </radialGradient>

        {/* Atmosphere halo */}
        <radialGradient id="g-atmos" cx="50%" cy="50%" r="50%">
          <stop offset="72%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(96,165,250,0.35)" />
        </radialGradient>

        {/* Specular highlight */}
        <radialGradient id="g-shine" cx="35%" cy="28%" r="45%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.18)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        {/* Edge darkening */}
        <radialGradient id="g-edge" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
        </radialGradient>

        {/* Clip to sphere */}
        <clipPath id="sphere-clip">
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>

        {/* Glow filter for markers */}
        <filter id="f-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Soft blur for atmosphere */}
        <filter id="f-atmos" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="14" />
        </filter>

        {/* Arc dash animation */}
        <style>{`
          .lp-lng-group { animation: globe-spin 18s linear infinite; transform-origin: ${CX}px ${CY}px; }
          .lp-arc       { stroke-dasharray: 200; stroke-dashoffset: 200; animation: draw-arc 3s ease forwards; }
          .lp-arc-1 { animation-delay: 0.3s; }
          .lp-arc-2 { animation-delay: 0.9s; }
          .lp-arc-3 { animation-delay: 1.5s; }
          @keyframes globe-spin    { to { transform: rotate(360deg); } }
          @keyframes draw-arc      { to { stroke-dashoffset: 0; } }
          @keyframes lp-ping       { 0%,100% { transform: scale(1); opacity:.7; } 50% { transform: scale(2.4); opacity:0; } }
          @keyframes lp-float      { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
          @keyframes lp-sparkle    { 0%,100% { opacity:.15; } 50% { opacity:.55; } }
        `}</style>
      </defs>

      {/* ── Outer atmosphere glow ── */}
      <circle cx={CX} cy={CY} r={180} fill="rgba(59,130,246,0.12)" filter="url(#f-atmos)" />
      <circle cx={CX} cy={CY} r={168} fill="none" stroke="rgba(96,165,250,0.2)" strokeWidth="2" />

      {/* ── Sphere base ── */}
      <circle cx={CX} cy={CY} r={R} fill="url(#g-sphere)" />

      {/* ── Grid lines (clipped to sphere) ── */}
      <g clipPath="url(#sphere-clip)">
        {/* Latitude lines — static */}
        <g fill="none" stroke="rgba(147,197,253,0.22)" strokeWidth="0.8">
          {LAT_LINES.map(({ y, rx, ry }, i) => (
            <ellipse key={i} cx={CX} cy={y} rx={rx} ry={ry} />
          ))}
        </g>

        {/* Longitude lines — slowly rotating */}
        <g className="lp-lng-group" fill="none" stroke="rgba(147,197,253,0.18)" strokeWidth="0.8">
          {[0, 30, 60, 90, 120, 150].map((angle, i) => (
            <ellipse key={i} cx={CX} cy={CY} rx={18} ry={R}
              transform={`rotate(${angle} ${CX} ${CY})`} />
          ))}
        </g>
      </g>

      {/* ── Specular highlight (top-left) ── */}
      <circle cx={CX} cy={CY} r={R} fill="url(#g-shine)" clipPath="url(#sphere-clip)" />

      {/* ── Edge darkening ── */}
      <circle cx={CX} cy={CY} r={R} fill="url(#g-edge)" />

      {/* ── Atmosphere overlay ── */}
      <circle cx={CX} cy={CY} r={R} fill="url(#g-atmos)" />

      {/* ── Arc connections ── */}
      {ARCS.map(({ x1, y1, x2, y2, cpx, cpy }, i) => (
        <path
          key={i}
          className={`lp-arc lp-arc-${i + 1}`}
          d={`M${x1},${y1} Q${cpx},${cpy} ${x2},${y2}`}
          fill="none"
          stroke="rgba(96,165,250,0.55)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      ))}

      {/* ── Location markers ── */}
      {MARKERS.map((m, i) => (
        <g key={i} filter="url(#f-glow)">
          {/* Ping ring */}
          <circle cx={m.x} cy={m.y} r="12" fill="none"
            stroke={m.color} strokeWidth="1"
            style={{ animation: `lp-ping 2.4s ease-out ${m.delay}s infinite` }}
          />
          {/* Dot */}
          <circle cx={m.x} cy={m.y} r="4" fill={m.color} />
          <circle cx={m.x} cy={m.y} r="2" fill="white" opacity="0.8" />
        </g>
      ))}

      {/* ── Sparkle stars around globe ── */}
      {[
        {cx:50,  cy:80},  {cx:340, cy:60},  {cx:30,  cy:300},
        {cx:360, cy:320}, {cx:120, cy:30},  {cx:280, cy:370},
        {cx:380, cy:180}, {cx:20,  cy:190},
      ].map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r="1.5" fill="white"
          style={{ animation: `lp-sparkle ${2 + i * 0.4}s ease-in-out ${i * 0.3}s infinite` }}
        />
      ))}
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) navigate('/monitor/objects', { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div className="lp-root">

      {/* ── Left Panel ── */}
      <div className="lp-left">
        {/* Star field background */}
        <div className="lp-stars" aria-hidden />

        <div className="lp-left-inner" style={{ animation: 'lp-float 6s ease-in-out infinite' }}>
          {/* Brand */}
          <div className="lp-brand">
            <div className="lp-brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
            </div>
            <span className="lp-brand-name">IoT Tracking</span>
          </div>

          {/* Globe */}
          <Globe />

          {/* Copy */}
          <h2 className="lp-headline">Real-time Fleet Tracking</h2>
          <p className="lp-sub">
            Monitor vehicles, assets &amp; IoT devices<br />from a single unified platform.
          </p>

          {/* Stats */}
          <div className="lp-stats">
            {[
              { val: '25K+',  label: 'Devices'   },
              { val: '99.9%', label: 'Uptime'     },
              { val: 'Live',  label: 'Real-time'  },
            ].map((s, i) => (
              <div key={i} className="lp-stat">
                <span className="lp-stat-val">{s.val}</span>
                <span className="lp-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="lp-right">
        <div className="lp-form-card">
          <LoginForm />
        </div>
      </div>

      <style>{`
        /* ── Root ── */
        .lp-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', system-ui, sans-serif;
          background: #060f2e;
        }

        /* ── Left ── */
        .lp-left {
          display: none;
          position: relative;
          overflow: hidden;
          background: radial-gradient(ellipse at 40% 40%, #0d1f5c 0%, #060f2e 70%);
        }
        @media (min-width: 1024px) {
          .lp-left {
            display: flex;
            flex: 1;
            align-items: center;
            justify-content: center;
          }
        }

        /* Star field */
        .lp-stars {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(1px 1px at 10%  15%, rgba(255,255,255,.55) 0%, transparent 0%),
            radial-gradient(1px 1px at 25%  60%, rgba(255,255,255,.4)  0%, transparent 0%),
            radial-gradient(1px 1px at 40%  25%, rgba(255,255,255,.5)  0%, transparent 0%),
            radial-gradient(1px 1px at 60%  75%, rgba(255,255,255,.45) 0%, transparent 0%),
            radial-gradient(1px 1px at 75%  10%, rgba(255,255,255,.5)  0%, transparent 0%),
            radial-gradient(1px 1px at 85%  55%, rgba(255,255,255,.35) 0%, transparent 0%),
            radial-gradient(1px 1px at 90%  30%, rgba(255,255,255,.5)  0%, transparent 0%),
            radial-gradient(1px 1px at 15%  85%, rgba(255,255,255,.4)  0%, transparent 0%),
            radial-gradient(1px 1px at 55%  45%, rgba(255,255,255,.3)  0%, transparent 0%),
            radial-gradient(1.5px 1.5px at 70% 20%, rgba(255,255,255,.6) 0%, transparent 0%),
            radial-gradient(1.5px 1.5px at 30% 70%, rgba(255,255,255,.55) 0%, transparent 0%),
            radial-gradient(1.5px 1.5px at 50% 90%, rgba(255,255,255,.5) 0%, transparent 0%);
          pointer-events: none;
        }

        .lp-left-inner {
          position: relative;
          z-index: 1;
          padding: 48px;
          max-width: 480px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        /* Brand */
        .lp-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 32px;
          align-self: flex-start;
        }
        .lp-brand-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: white;
          box-shadow: 0 0 20px rgba(59,130,246,0.5);
          flex-shrink: 0;
        }
        .lp-brand-icon svg { width: 18px; height: 18px; }
        .lp-brand-name {
          font-size: 17px; font-weight: 700;
          color: white; letter-spacing: -0.3px;
        }

        /* Globe */
        .lp-globe-svg {
          width: 100%;
          max-width: 340px;
          filter: drop-shadow(0 0 40px rgba(59,130,246,0.35));
          margin-bottom: 24px;
        }

        /* Copy */
        .lp-headline {
          font-size: 26px; font-weight: 800;
          color: white; margin: 0 0 10px;
          letter-spacing: -0.5px; line-height: 1.2;
        }
        .lp-sub {
          font-size: 14px; color: #94a3b8;
          line-height: 1.65; margin: 0 0 32px;
        }

        /* Stats */
        .lp-stats {
          display: flex;
          gap: 0;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 16px 24px;
          width: 100%;
          justify-content: space-around;
        }
        .lp-stat {
          display: flex; flex-direction: column; align-items: center; gap: 3px;
        }
        .lp-stat-val {
          font-size: 20px; font-weight: 800;
          color: #60a5fa; letter-spacing: -0.5px;
        }
        .lp-stat-label { font-size: 11px; color: #64748b; font-weight: 500; }

        /* ── Right ── */
        .lp-right {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
        }
        @media (min-width: 1024px) {
          .lp-right { width: 480px; min-width: 480px; flex-shrink: 0; }
        }

        .lp-form-card {
          width: 100%;
          max-width: 400px;
          background: white;
          border-radius: 20px;
          padding: 40px 36px;
          box-shadow:
            0 4px 6px -1px rgba(0,0,0,0.07),
            0 20px 60px -10px rgba(0,0,0,0.12);
        }
      `}</style>
    </div>
  );
}
