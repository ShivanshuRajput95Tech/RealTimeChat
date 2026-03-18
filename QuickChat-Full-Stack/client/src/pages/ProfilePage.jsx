import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import assets from '../assets/assets';
import { useAuth } from '../../context/auth-context';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { authUser, updateProfile } = useAuth();

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
    <div className='min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.15),transparent_30%),linear-gradient(180deg,#020617,#0f172a_45%,#111827)] px-4 py-8'>
      <div className='mx-auto max-w-4xl'>
        <div className='rounded-[32px] border border-white/10 bg-slate-900/70 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl'>
          <div className='flex flex-col gap-6 border-b border-white/10 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300'>Profile settings</p>
              <h1 className='mt-2 text-3xl font-semibold text-white'>Manage your account</h1>
              <p className='mt-2 text-sm text-slate-400'>Update your public profile, avatar, and workspace details.</p>
            </div>
            <button
              type='button'
              onClick={() => navigate('/')}
              className='inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10'
            >
              Back to chat
            </button>
          </div>

          <div className='grid gap-8 px-6 py-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-8'>
            <aside className='rounded-[28px] border border-white/10 bg-slate-950/60 p-6'>
              <div className='flex flex-col items-center text-center'>
                <div className='relative'>
                  <img src={previewImg} alt='Profile' className='h-32 w-32 rounded-[28px] object-cover shadow-2xl ring-4 ring-white/10' />
                  <label htmlFor='avatar' className='absolute -bottom-3 right-0 inline-flex cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 p-3 text-white shadow-lg transition hover:scale-105'>
                    <input onChange={handleImgChange} type='file' id='avatar' accept='image/png,image/jpeg' hidden />
                    <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 20 20'>
                      <path d='M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z' />
                    </svg>
                  </label>
                </div>

                <h2 className='mt-6 text-2xl font-semibold text-white'>{name}</h2>
                <p className='mt-1 text-sm text-slate-400'>{authUser?.email}</p>
                <span className='mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300'>
                  <span className='h-2 w-2 rounded-full bg-emerald-400' />
                  Active account
                </span>
              </div>

              <div className='mt-6 grid gap-3'>
                <div className='rounded-2xl border border-white/8 bg-white/5 px-4 py-3'>
                  <p className='text-[11px] uppercase tracking-[0.18em] text-slate-500'>Joined</p>
                  <p className='mt-2 text-sm font-semibold text-white'>
                    {authUser?.createdAt ? new Date(authUser.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <div className='rounded-2xl border border-white/8 bg-white/5 px-4 py-3'>
                  <p className='text-[11px] uppercase tracking-[0.18em] text-slate-500'>Profile image</p>
                  <p className='mt-2 text-sm text-slate-300'>PNG or JPEG up to 5MB</p>
                </div>
              </div>
            </aside>

            <form onSubmit={handleSubmit} className='rounded-[28px] border border-white/10 bg-slate-950/55 p-6'>
              <div className='grid gap-5'>
                <div>
                  <label className='mb-2 block text-sm font-medium text-slate-200'>Full name</label>
                  <input
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                    type='text'
                    required
                    placeholder='Enter your full name'
                    className='w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40'
                  />
                </div>

                <div>
                  <label className='mb-2 block text-sm font-medium text-slate-200'>Bio</label>
                  <textarea
                    onChange={(e) => setBio(e.target.value)}
                    value={bio}
                    placeholder='Add a short summary about your role or interests'
                    required
                    rows={5}
                    className='w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 resize-none'
                  />
                </div>
              </div>

              <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
                <button
                  type='submit'
                  disabled={loading}
                  className='inline-flex flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-cyan-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {loading ? 'Saving changes...' : 'Save changes'}
                </button>
                <button
                  type='button'
                  onClick={() => navigate('/')}
                  className='inline-flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10'
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
