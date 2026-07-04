import React, { useEffect, useState, useRef } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { apiService } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const DEFAULT_AVATAR = '/default-avatar.png';

const Profile = () => {
  const { logout, isLoggedIn, user, fetchAndSetProfile } = useUserAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(DEFAULT_AVATAR);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && user.name) {
      setAvatarPreview(user.avatar_url || DEFAULT_AVATAR);
    }
  }, [user]);

  const handleEditToggle = () => {
    if (user) {
      const phoneRegex = /^\+91[6-9]\d{9}$/;
      const isPhoneInvalid = !user.phone || !phoneRegex.test(user.phone);
      setFormData({
        name: user.name || '',
        phone: isPhoneInvalid ? '' : user.phone.replace('+91', ''),
        address: user.address || '',
      });
      setAvatarFile(null);
      setAvatarPreview(user.avatar_url || DEFAULT_AVATAR);
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setToast(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, phone: digits }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address) {
      setToast({ type: 'error', message: 'Name and address cannot be empty.' });
      return;
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      setToast({ type: 'error', message: 'Phone number must be 10 digits.' });
      return;
    }
    setSaving(true);
    const submission = new FormData();
    submission.append('name', formData.name);
    submission.append('address', formData.address);
    submission.append('phone', formData.phone ? `+91${formData.phone}` : '');
    if (avatarFile) {
      submission.append('avatar', avatarFile);
      }
    try {
      const response = await apiService.post('/backend/user/profile.php', submission);
      if (response.success) {
        await fetchAndSetProfile();
        setIsEditing(false);
        setToast({ type: 'success', message: 'Profile updated successfully!' });
        // Update avatar preview if changed
        if (avatarFile && response.avatar_url) {
          setAvatarPreview(response.avatar_url);
        }
      } else {
        setToast({ type: 'error', message: response.error || 'Failed to update profile. Please try again.' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">My Profile</h1>
        <p>Please log in to view your profile.</p>
        <Button className="mt-4" onClick={() => navigate('/login')}>Login</Button>
      </div>
    );
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Could not load profile data.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">My Profile</h1>
      <Card className="max-w-lg mx-auto p-6 md:p-8">
        {toast && (
          <div className={`mb-4 text-center p-2 rounded-md ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{toast.message}</div>
        )}
        {!isEditing ? (
          <div className="text-center">
            <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden border-2 border-pink-200">
              <img src={avatarPreview} alt="User Avatar" className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = DEFAULT_AVATAR}/>
            </div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-gray-500">{user.email}</p>
            <div className="text-left mt-6 space-y-2">
              <p className="text-gray-600 break-words"><span className="font-semibold text-gray-800">Phone:</span> {user.phone || 'N/A'}</p>
              <p className="text-gray-600 break-words"><span className="font-semibold text-gray-800">Address:</span> {user.address || 'N/A'}</p>
            </div>
            <div className="flex justify-center gap-2 mt-6">
              <Button onClick={handleEditToggle} className="bg-pink-500 hover:bg-pink-600 text-white">Edit Profile</Button>
              <Button onClick={handleLogout} variant="outline">Logout</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 mb-2">
                <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover rounded-full border-2 border-pink-200"/>
                <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-md cursor-pointer hover:bg-gray-100">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z"></path></svg>
                </label>
                <input id="avatar-upload" ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </div>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"/>
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone (10 digits)</label>
              <div className="mt-1 flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">+91</span>
                <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"/>
              </div>
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
              <textarea name="address" id="address" value={formData.address} onChange={handleInputChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"></textarea>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-pink-500 hover:bg-pink-600 text-white">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default Profile; 