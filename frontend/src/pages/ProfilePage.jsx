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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>

      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <FiUser className="text-gray-400" /> Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300 text-sm"
            required
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <FiMail className="text-gray-400" /> Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300 text-sm"
            required
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <FiLock className="text-gray-400" /> New Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300 text-sm"
            placeholder="Leave blank to keep current"
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* Danger Zone */}
      <div className="mt-8 bg-red-50 rounded-2xl border border-red-100 p-6">
        <h3 className="text-base font-semibold text-red-800 mb-2">Danger Zone</h3>
        <p className="text-sm text-red-600 mb-4">Permanently delete your account and all associated data.</p>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition"
        >
          <FiTrash2 /> Delete Account
        </button>
      </div>
    </div>
  );
}
