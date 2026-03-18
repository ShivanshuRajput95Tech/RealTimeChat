import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import assets from '../assets/assets';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);

  const [selectedImg, setSelectedImg] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [name, setName] = useState(authUser.fullName);
  const [bio, setBio] = useState(authUser.bio);

  const handleImgChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setSelectedImg(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedImg) {
        await updateProfile({ fullName: name, bio });
        navigate('/');
        return;
      }

      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(selectedImg);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });

      await updateProfile({ profilePic: base64Image, fullName: name, bio });
      navigate('/');
    } catch {
      // Toast already handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const previewImg = selectedImg ? URL.createObjectURL(selectedImg) : (authUser?.profilePic || assets.avatar_icon);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-purple-900/20 to-slate-950 flex items-center justify-center p-4'>
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob'/>
        <div className='absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000'/>
        <div className='absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000'/>
      </div>

      <div className='relative w-full max-w-2xl'>
        <div className='backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl overflow-hidden'>
          <div className='h-32 bg-gradient-to-r from-violet-600/40 via-purple-600/40 to-pink-600/40'/>

          <div className='px-6 sm:px-10 pb-10'>
            <div className='flex flex-col sm:flex-row items-center gap-6 mb-8 -mt-16 relative'>
              <div className='relative group'>
                <div className='absolute inset-0 bg-gradient-to-r from-violet-600 to-pink-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition'/>
                <img
                  src={previewImg}
                  alt='Profile'
                  className='relative w-32 h-32 rounded-full object-cover border-4 border-white/20 shadow-2xl'
                />
                <label htmlFor='avatar' className='absolute bottom-0 right-0 bg-gradient-to-r from-violet-500 to-pink-500 p-2 rounded-full cursor-pointer hover:scale-110 transition transform shadow-lg'>
                  <input onChange={handleImgChange} type='file' id='avatar' accept='image/png,image/jpeg' hidden/>
                  <svg className='w-5 h-5 text-white' fill='currentColor' viewBox='0 0 20 20'>
                    <path d='M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z'/>
                  </svg>
                </label>
              </div>

              <div className='flex-1 text-center sm:text-left'>
                <h1 className='text-3xl font-bold text-white mb-2'>{name}</h1>
                <p className='text-sm text-gray-300 mb-1'>{authUser?.email}</p>
                <div className='flex items-center justify-center sm:justify-start gap-2 mt-3'>
                  <span className='inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/50 text-green-200 text-xs font-semibold'>
                    <span className='w-2 h-2 bg-green-400 rounded-full'/>
                    Active
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className='space-y-6'>
              <div>
                <label className='block text-sm font-semibold text-gray-200 mb-2'>Full Name</label>
                <input
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                  type='text'
                  required
                  placeholder='Enter your full name'
                  className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition'
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-200 mb-2'>Bio</label>
                <textarea
                  onChange={(e) => setBio(e.target.value)}
                  value={bio}
                  placeholder='Tell us about yourself...'
                  required
                  rows={4}
                  className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition resize-none'
                />
              </div>

              <div className='grid grid-cols-2 gap-4 pt-4 border-t border-white/10'>
                <div className='bg-white/5 rounded-lg p-3'>
                  <p className='text-xs text-gray-400'>Joined</p>
                  <p className='text-sm font-semibold text-white'>
                    {authUser?.createdAt ? new Date(authUser.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <div className='bg-white/5 rounded-lg p-3'>
                  <p className='text-xs text-gray-400'>Account Status</p>
                  <p className='text-sm font-semibold text-green-400'>Active ✓</p>
                </div>
              </div>

              <div className='flex gap-3 pt-4'>
                <button
                  type='submit'
                  disabled={loading}
                  className='flex-1 py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold rounded-lg hover:from-violet-700 hover:to-pink-700 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg'
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type='button'
                  onClick={() => navigate('/')}
                  className='flex-1 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition'
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
