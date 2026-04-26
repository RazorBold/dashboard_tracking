import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAuthStore } from '../stores/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Gradient & Illustration (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center p-8">
        <div className="text-center text-white max-w-md">
          <div className="mb-8">
            {/* Simple SVG Illustration */}
            <svg
              className="w-32 h-32 mx-auto mb-8"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Map Pin */}
              <circle cx="50" cy="30" r="8" fill="currentColor" />
              <path d="M50 38 Q45 50 50 60 Q55 50 50 38 Z" fill="currentColor" />

              {/* Road/Path */}
              <path
                d="M20 70 Q50 50 80 70"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
              />

              {/* Vehicle */}
              <rect x="48" y="68" width="4" height="4" fill="currentColor" />
              <circle cx="46" cy="73" r="1.5" fill="currentColor" />
              <circle cx="54" cy="73" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4">Real-time IoT Tracking</h2>
          <p className="text-blue-100">
            Monitor your fleet, devices, and assets in real-time with advanced
            GPS tracking and analytics.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
