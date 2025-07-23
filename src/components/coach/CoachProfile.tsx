import React, { useState, useContext, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function CoachProfile() {
  const { user } = useAuth();
  const coachId = user?.uid;

  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicURL, setProfilePicURL] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch existing profile
  useEffect(() => {
    if (!coachId) return;
    fetch(`/api/coaches/${coachId}/profile`)
      .then(res => res.json())
      .then(data => {
        setBio(data.bio || '');
        setProfilePicURL(data.profilePicUrl || '');
      })
      .catch(console.error);
  }, [coachId]);

  // Handle picture selection
  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setProfilePicFile(file);
      setProfilePicURL(URL.createObjectURL(file));
    }
  };

  // Save profile
  const handleSaveProfile = async () => {
    if (!coachId) return;
    setLoading(true);
    const form = new FormData();
    form.append('bio', bio);
    if (profilePicFile) form.append('profilePic', profilePicFile);
    try {
      const res = await fetch(`/api/coaches/${coachId}/profile`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error();
      alert('Profile updated');
    } catch (err) {
      console.error(err);
      alert('Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img
            src={profilePicURL || '/placeholder-avatar.png'}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover border"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handlePictureChange}
            className="absolute inset-0 opacity-0 cursor-pointer rounded-full"
          />
        </div>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={3}
          className="w-full border rounded p-2"
          placeholder="Write your bio..."
        />
      </div>
      <button
        onClick={handleSaveProfile}
        disabled={loading}
        className="bg-bjj-blue text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );
}
