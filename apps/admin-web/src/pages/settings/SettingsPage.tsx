import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import {
  User, Lock, Bell, Globe, Loader2, Check, Eye, EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import axiosClient from '../../utils/axiosClient';
import { useAuthStore } from '../../stores/authStore';

// ─── Local-storage preference helpers ───────────────
const PREFS_KEY = 'user_preferences';

interface Preferences {
  notifications: { alerts: boolean; reports: boolean; system: boolean };
  language: 'en' | 'id';
  timezone: string;
}

function loadPrefs(): Preferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw) as Preferences;
  } catch { /* empty */ }
  return {
    notifications: { alerts: true, reports: true, system: false },
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

function savePrefs(p: Preferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(p));
}

// ─── Validation schemas ──────────────────────────────
const profileSchema = z.object({
  name: z.string().min(2, 'Minimum 2 characters').max(100),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'Minimum 8 characters'),
  confirmPassword: z.string().min(1, 'Required'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type PasswordForm = z.infer<typeof passwordSchema>;

type Tab = 'profile' | 'notifications' | 'preferences';

const TIMEZONES = [
  'UTC', 'Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura',
  'Asia/Singapore', 'Asia/Bangkok', 'Asia/Tokyo', 'Europe/London',
  'America/New_York', 'America/Los_Angeles',
];

// ─── Avatar initials ─────────────────────────────────
function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// ─── Profile Tab ─────────────────────────────────────
function ProfileTab() {
  const { user, updateUser } = useAuthStore();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '' },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const profileMutation = useMutation({
    mutationFn: (data: ProfileForm) =>
      axiosClient.patch('/auth/me', data).then((r) => r.data.data),
    onSuccess: (updated) => {
      updateUser({ name: updated.name });
      toast.success('Profile updated');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to update profile'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordForm) =>
      axiosClient.patch('/auth/me', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }).then((r) => r.data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      passwordForm.reset();
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to change password'),
  });

  return (
    <div className="settings-page__section-grid">
      {/* Avatar */}
      <div className="settings-card">
        <h3 className="settings-card__title">Profile Picture</h3>
        <div className="settings-card__avatar-row">
          <div className="settings-card__avatar">
            {getInitials(user?.name ?? 'U')}
          </div>
          <div>
            <p className="settings-card__avatar-name">{user?.name}</p>
            <p className="settings-card__avatar-email">{user?.email}</p>
            <span className="settings-card__role-badge">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Edit name */}
      <div className="settings-card">
        <h3 className="settings-card__title">Display Name</h3>
        <form
          onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))}
          className="settings-card__form"
        >
          <div className="settings-card__field">
            <label className="settings-card__label">Full Name</label>
            <input
              {...profileForm.register('name')}
              className="settings-card__input"
              placeholder="Your full name"
            />
            {profileForm.formState.errors.name && (
              <p className="settings-card__error">{profileForm.formState.errors.name.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={profileMutation.isPending}
            className="btn btn--primary settings-card__btn"
          >
            {profileMutation.isPending
              ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
              : <><Check size={14} /> Save Name</>}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="settings-card">
        <h3 className="settings-card__title">Change Password</h3>
        <form
          onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))}
          className="settings-card__form"
        >
          {[
            { field: 'currentPassword' as const, label: 'Current Password', show: showCurrent, toggle: setShowCurrent },
            { field: 'newPassword' as const, label: 'New Password', show: showNew, toggle: setShowNew },
            { field: 'confirmPassword' as const, label: 'Confirm New Password', show: showConfirm, toggle: setShowConfirm },
          ].map(({ field, label, show, toggle }) => (
            <div key={field} className="settings-card__field">
              <label className="settings-card__label">{label}</label>
              <div className="settings-card__input-wrap">
                <input
                  {...passwordForm.register(field)}
                  type={show ? 'text' : 'password'}
                  className="settings-card__input settings-card__input--pw"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => toggle(!show)} className="settings-card__pw-toggle">
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {passwordForm.formState.errors[field] && (
                <p className="settings-card__error">{passwordForm.formState.errors[field]?.message}</p>
              )}
            </div>
          ))}
          <button
            type="submit"
            disabled={passwordMutation.isPending}
            className="btn btn--primary settings-card__btn"
          >
            {passwordMutation.isPending
              ? <><Loader2 size={14} className="animate-spin" /> Changing…</>
              : <><Lock size={14} /> Change Password</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Notifications Tab ───────────────────────────────
function NotificationsTab() {
  const [prefs, setPrefs] = useState(loadPrefs);

  const toggle = (key: keyof Preferences['notifications']) => {
    const updated = {
      ...prefs,
      notifications: { ...prefs.notifications, [key]: !prefs.notifications[key] },
    };
    setPrefs(updated);
    savePrefs(updated);
    toast.success('Preference saved');
  };

  const rows: { key: keyof Preferences['notifications']; label: string; desc: string }[] = [
    { key: 'alerts', label: 'Device Alerts', desc: 'Overspeed, geofence violations, collision events' },
    { key: 'reports', label: 'Scheduled Reports', desc: 'Auto-report delivery notifications' },
    { key: 'system', label: 'System Notices', desc: 'Maintenance windows, platform updates' },
  ];

  return (
    <div className="settings-page__section-grid">
      <div className="settings-card settings-card--full">
        <h3 className="settings-card__title">Notification Preferences</h3>
        <div className="settings-card__toggle-list">
          {rows.map(({ key, label, desc }) => (
            <div key={key} className="settings-card__toggle-row">
              <div>
                <p className="settings-card__toggle-label">{label}</p>
                <p className="settings-card__toggle-desc">{desc}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`settings-card__toggle-btn ${prefs.notifications[key] ? 'settings-card__toggle-btn--on' : ''}`}
                role="switch"
                aria-checked={prefs.notifications[key]}
              >
                <span className="settings-card__toggle-thumb" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Preferences Tab ─────────────────────────────────
function PreferencesTab() {
  const [prefs, setPrefs] = useState(loadPrefs);

  const update = (patch: Partial<Preferences>) => {
    const updated = { ...prefs, ...patch };
    setPrefs(updated);
    savePrefs(updated);
    toast.success('Preference saved');
  };

  return (
    <div className="settings-page__section-grid">
      <div className="settings-card">
        <h3 className="settings-card__title">Language</h3>
        <div className="settings-card__field">
          <label className="settings-card__label">Interface Language</label>
          <select
            value={prefs.language}
            onChange={(e) => update({ language: e.target.value as Preferences['language'] })}
            className="settings-card__input"
          >
            <option value="en">English</option>
            <option value="id">Bahasa Indonesia</option>
          </select>
        </div>
      </div>

      <div className="settings-card">
        <h3 className="settings-card__title">Timezone</h3>
        <div className="settings-card__field">
          <label className="settings-card__label">Display Timezone</label>
          <select
            value={prefs.timezone}
            onChange={(e) => update({ timezone: e.target.value })}
            className="settings-card__input"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
          <p className="settings-card__hint">
            Current time: {new Date().toLocaleTimeString('en-US', { timeZone: prefs.timezone })}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Settings Page ──────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <User size={15} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
  { id: 'preferences', label: 'Preferences', icon: <Globe size={15} /> },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div className="settings-page">
      <div className="settings-page__header">
        <h1 className="settings-page__title">Settings</h1>
        <p className="settings-page__subtitle">Manage your profile and preferences</p>
      </div>

      <div className="settings-page__tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`settings-page__tab ${activeTab === tab.id ? 'settings-page__tab--active' : ''}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="settings-page__body">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'preferences' && <PreferencesTab />}
      </div>
    </div>
  );
}
