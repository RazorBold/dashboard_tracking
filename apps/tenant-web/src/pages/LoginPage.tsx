import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosClient from '../utils/axiosClient';
import { useAuthStore } from '../stores/authStore';
import type { AuthResponse } from '../types/auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, setUser, setToken } = useAuthStore();
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await axiosClient.post<AuthResponse>('/auth/login', {
        email: data.email.trim(),
        password: data.password,
      });
      const { accessToken, user } = res.data.data;
      setToken(accessToken);
      setUser(user);
      toast.success(`Welcome, ${user.name}!`);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 to-indigo-800 items-center justify-center p-10">
        <div className="text-center text-white max-w-xs">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3">Tenant Portal</h2>
          <p className="text-blue-200 text-sm leading-relaxed">
            Manage your organization's devices, vehicles, and team members in one place.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">IoT Tracking</h1>
          <p className="text-slate-500 text-sm mb-8">Tenant Portal</p>

          <h2 className="text-xl font-semibold text-slate-800 mb-6">Sign In</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@company.com"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:bg-white'}`}
                />
              </div>
              {errors.email && (
                <p className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                  <AlertCircle size={11} /> {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-10 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${errors.password ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:bg-white'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                  <AlertCircle size={11} /> {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> Signing in…</> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
