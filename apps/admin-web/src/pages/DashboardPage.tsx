import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">IoT Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{user?.name || 'User'}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome!</h2>
          <p className="text-gray-600 mb-6">
            This is a placeholder dashboard. The full dashboard with monitoring,
            reports, and fleet management will be implemented in the next phases.
          </p>

          {/* Feature Roadmap Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[
              {
                title: 'Monitor',
                description: 'Real-time tracking of devices and vehicles',
                status: 'Coming Soon',
              },
              {
                title: 'Report',
                description: 'Generate reports and analytics',
                status: 'Coming Soon',
              },
              {
                title: 'Fleet',
                description: 'Manage fleet, drivers, and vehicles',
                status: 'Coming Soon',
              },
              {
                title: 'Devices',
                description: 'Device management and configuration',
                status: 'Coming Soon',
              },
              {
                title: 'Geofencing',
                description: 'Set boundaries and alerts',
                status: 'Coming Soon',
              },
              {
                title: 'Video',
                description: 'Live video from DVR',
                status: 'Coming Soon',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition"
              >
                <h3 className="font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
                <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  {feature.status}
                </span>
              </div>
            ))}
          </div>

          {/* User Info */}
          <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-3">Your Profile</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <p className="font-medium">{user?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <p className="font-medium">{user?.email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-600">Role:</span>
                <p className="font-medium capitalize">{user?.role || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
