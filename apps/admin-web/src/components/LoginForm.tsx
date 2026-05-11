import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginSchema, type LoginFormData } from '../utils/validation';
import { useAuthStore } from '../stores/authStore';
import axiosClient from '../utils/axiosClient';
import type { AuthResponse } from '../types/auth';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setUser, setToken, setError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      const response = await axiosClient.post<AuthResponse>('/auth/login', {
        email: data.email.trim(),
        password: data.password,
      });
      const { accessToken, user } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(accessToken);
      setUser(user);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/monitor/objects', { replace: true });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <>
      {/* Logo & heading */}
      <div className="lf-header">
        <div className="lf-logo">
          <MapPin size={18} strokeWidth={2.5} />
        </div>
        <div>
          <div className="lf-logo-text">IoT Tracking</div>
          <div className="lf-logo-sub">Fleet Management Platform</div>
        </div>
      </div>

      <h2 className="lf-title">Welcome back</h2>
      <p className="lf-subtitle">Sign in to your admin account</p>

      <form onSubmit={handleSubmit(onSubmit)} className="lf-form">

        {/* Email */}
        <div className="lf-field">
          <label className="lf-label">Email address</label>
          <div className="lf-input-wrap">
            <Mail size={16} className="lf-input-icon" />
            <input
              {...register('email')}
              type="email"
              placeholder="you@company.com"
              className={`lf-input${errors.email ? ' lf-input--err' : ''}`}
            />
          </div>
          {errors.email && (
            <span className="lf-error"><AlertCircle size={13}/>{errors.email.message}</span>
          )}
        </div>

        {/* Password */}
        <div className="lf-field">
          <div className="lf-label-row">
            <label className="lf-label">Password</label>
            <a href="#" className="lf-forgot">Forgot password?</a>
          </div>
          <div className="lf-input-wrap">
            <Lock size={16} className="lf-input-icon" />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={`lf-input lf-input--pw${errors.password ? ' lf-input--err' : ''}`}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="lf-eye">
              {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
          {errors.password && (
            <span className="lf-error"><AlertCircle size={13}/>{errors.password.message}</span>
          )}
        </div>

        {/* Remember me */}
        <label className="lf-remember">
          <input {...register('rememberMe')} type="checkbox" className="lf-checkbox"/>
          <span>Keep me signed in</span>
        </label>

        {/* Submit */}
        <button type="submit" disabled={isSubmitting} className="lf-btn">
          {isSubmitting ? (
            <><Loader2 size={17} className="lf-spin"/>Signing in…</>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Demo hint */}
      <div className="lf-demo">
        <span className="lf-demo-dot"/>
        <span>Demo: <strong>admin@demo.com</strong> / <strong>admin123</strong></span>
      </div>

      <style>{`
        .lf-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
        }
        .lf-logo {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #1d4ed8, #3b82f6);
          border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(59,130,246,0.35);
        }
        .lf-logo-text { font-size: 15px; font-weight: 700; color: #0f172a; }
        .lf-logo-sub  { font-size: 11px; color: #94a3b8; font-weight: 500; margin-top: 1px; }

        .lf-title {
          font-size: 26px; font-weight: 800;
          color: #0f172a; margin: 0 0 6px;
          letter-spacing: -0.5px;
        }
        .lf-subtitle {
          font-size: 14px; color: #64748b;
          margin: 0 0 28px;
        }

        .lf-form { display: flex; flex-direction: column; gap: 18px; }

        .lf-field { display: flex; flex-direction: column; gap: 6px; }

        .lf-label {
          font-size: 13px; font-weight: 600;
          color: #334155; letter-spacing: 0.1px;
        }
        .lf-label-row {
          display: flex; align-items: center; justify-content: space-between;
        }
        .lf-forgot {
          font-size: 12px; color: #2563eb; font-weight: 500;
          text-decoration: none;
          transition: color 150ms;
        }
        .lf-forgot:hover { color: #1d4ed8; }

        .lf-input-wrap { position: relative; }
        .lf-input-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: #94a3b8; pointer-events: none;
        }
        .lf-input {
          width: 100%;
          padding: 11px 14px 11px 40px;
          font-size: 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          color: #0f172a;
          outline: none;
          transition: border-color 150ms, background 150ms, box-shadow 150ms;
          box-sizing: border-box;
        }
        .lf-input::placeholder { color: #cbd5e1; }
        .lf-input:focus {
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
        }
        .lf-input--pw { padding-right: 44px; }
        .lf-input--err { border-color: #fca5a5; background: #fef2f2; }
        .lf-input--err:focus { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }

        .lf-eye {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; padding: 4px;
          color: #94a3b8; cursor: pointer;
          display: flex; align-items: center;
          transition: color 150ms;
        }
        .lf-eye:hover { color: #475569; }

        .lf-error {
          display: flex; align-items: center; gap: 5px;
          font-size: 12px; color: #ef4444; font-weight: 500;
        }

        .lf-remember {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: #475569;
          cursor: pointer; user-select: none;
        }
        .lf-checkbox {
          width: 15px; height: 15px;
          border-radius: 4px;
          accent-color: #2563eb;
          cursor: pointer;
        }

        .lf-btn {
          width: 100%;
          padding: 12px;
          font-size: 14px; font-weight: 700;
          color: white;
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%);
          border: none; border-radius: 11px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: opacity 150ms, transform 150ms, box-shadow 150ms;
          box-shadow: 0 4px 14px rgba(37,99,235,0.4);
          margin-top: 4px;
          letter-spacing: 0.2px;
        }
        .lf-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37,99,235,0.45);
        }
        .lf-btn:active:not(:disabled) { transform: translateY(0); }
        .lf-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .lf-spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .lf-demo {
          display: flex; align-items: center; gap: 8px;
          margin-top: 24px;
          padding: 11px 14px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 10px;
          font-size: 12px; color: #0369a1;
        }
        .lf-demo-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #0ea5e9;
          flex-shrink: 0;
          box-shadow: 0 0 0 3px rgba(14,165,233,0.2);
        }
      `}</style>
    </>
  );
}
