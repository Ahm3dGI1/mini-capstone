import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile, deleteAccount } from '../api/api';
import { FiUser, FiMail, FiLock, FiTrash2, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { name, email };
      if (password) data.password = password;
      const res = await updateProfile(data);
      setUser(res.data.user);
      setPassword('');
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    if (!window.confirm('This will permanently delete all your data. Continue?')) return;

    try {
      await deleteAccount();
      logout();
      toast.success('Account deleted');
      navigate('/');
    } catch (err) {
      toast.error('Failed to delete account');
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-surface-900 mb-6">Profile Settings</h1>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-surface-200 p-6 space-y-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-surface-700 mb-1.5">
            <FiUser className="text-surface-400" /> Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-surface-200 rounded-lg bg-surface-50 focus:bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-400 text-sm transition"
            required
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-surface-700 mb-1.5">
            <FiMail className="text-surface-400" /> Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-surface-200 rounded-lg bg-surface-50 focus:bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-400 text-sm transition"
            required
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-surface-700 mb-1.5">
            <FiLock className="text-surface-400" /> New Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-surface-200 rounded-lg bg-surface-50 focus:bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-400 text-sm transition"
            placeholder="Leave blank to keep current"
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary-700 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
        >
          <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* Danger Zone */}
      <div className="mt-8 bg-red-50 rounded-xl border border-red-200 p-6">
        <h3 className="text-base font-semibold text-red-800 mb-2">Danger Zone</h3>
        <p className="text-sm text-red-600 mb-4">Permanently delete your account and all associated data.</p>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition"
        >
          <FiTrash2 /> Delete Account
        </button>
      </div>
    </div>
  );
}
