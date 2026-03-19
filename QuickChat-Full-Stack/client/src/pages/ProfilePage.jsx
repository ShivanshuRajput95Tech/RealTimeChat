import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import assets from '../assets/assets';
import { useAuth, useTheme } from '../../context';

const ProfilePage = () => {
  const { authUser, updateProfile } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [selectedImg, setSelectedImg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(authUser.fullName);
  const [bio, setBio] = useState(authUser.bio);
  const [desktopAlerts, setDesktopAlerts] = useState(true);
  const [messagePreview, setMessagePreview] = useState(true);

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
  const joinDate = authUser?.createdAt ? new Date(authUser.createdAt).toLocaleDateString() : 'Unknown';

  const activity = useMemo(() => ([
    `${authUser?.fullName?.split(' ')[0] || 'You'} can be discovered by teammates through profile search.`,
    bio?.trim() ? 'Your bio helps new contacts understand your role immediately.' : 'Add a short bio to make your profile easier to recognise.',
    selectedImg ? 'A new avatar is ready to be saved with this update.' : 'Upload a fresh photo for better recognition in the chat list.',
  ]), [authUser?.fullName, bio, selectedImg]);

  return (
    <div className='app-shell min-h-screen px-4 py-6 sm:px-6 sm:py-8'>
      <div className='mx-auto max-w-7xl'>
        <div className='mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='section-kicker'>Account settings</p>
            <h1 className='mt-2 text-3xl font-semibold'>Manage your profile and preferences</h1>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Update the identity people see in chats and review a few workspace preferences in one place.
            </p>
          </div>
          <div className='flex flex-wrap gap-3'>
            <button
              type='button'
              onClick={toggleTheme}
              className={`surface-border inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium ${isDark ? 'bg-slate-950/65 text-slate-100' : 'bg-white/80 text-slate-700'}`}
            >
              <span>{isDark ? '☀️' : '🌙'}</span>
              <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
            </button>
            <button
              type='button'
              onClick={() => navigate('/')}
              className={`surface-border inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold ${isDark ? 'bg-white/5 text-slate-200 hover:bg-white/10' : 'bg-white/80 text-slate-700 hover:bg-white'}`}
            >
              Back to chat
            </button>
          </div>
        </div>

        <div className={`frost-panel surface-border rounded-[40px] ${isDark ? 'bg-slate-950/68 text-white' : 'bg-white/85 text-slate-900'}`}>
          <div className='grid gap-6 px-5 py-5 lg:grid-cols-[340px_minmax(0,1fr)] lg:px-6 lg:py-6'>
            <aside className={`surface-border rounded-[32px] p-6 ${isDark ? 'bg-slate-950/70' : 'bg-slate-50/85'}`}>
              <div className='flex flex-col items-center text-center'>
                <div className='relative'>
                  <img src={previewImg} alt='Profile' className='h-32 w-32 rounded-[28px] object-cover shadow-2xl ring-4 ring-white/10' />
                  <label htmlFor='avatar' className='absolute -bottom-3 right-0 inline-flex cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-500 p-3 text-white shadow-lg transition hover:scale-105'>
                    <input onChange={handleImgChange} type='file' id='avatar' accept='image/png,image/jpeg' hidden />
                    <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 20 20'>
                      <path d='M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z' />
                    </svg>
                  </label>
                </div>

                <h2 className='mt-6 text-2xl font-semibold'>{name}</h2>
                <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{authUser?.email}</p>
                <span className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isDark ? 'bg-emerald-500/12 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
                  <span className='h-2 w-2 rounded-full bg-emerald-400' />
                  Active account
                </span>
              </div>

              <div className='mt-6 grid gap-3'>
                {[
                  { label: 'Member since', value: joinDate },
                  { label: 'Profile image', value: 'PNG or JPEG, up to 5MB' },
                  { label: 'Workspace access', value: 'Protected sign-in enabled' },
                ].map((item) => (
                  <div key={item.label} className={`surface-border rounded-[24px] px-4 py-4 ${isDark ? 'bg-white/5' : 'bg-white/80'}`}>
                    <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</p>
                    <p className='mt-2 text-sm font-semibold'>{item.value}</p>
                  </div>
                ))}
              </div>
            </aside>

            <div className='grid gap-6'>
              <form onSubmit={handleSubmit} className={`surface-border rounded-[32px] p-6 ${isDark ? 'bg-slate-950/58' : 'bg-slate-50/70'}`}>
                <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]'>
                  <div>
                    <p className='section-kicker'>Public profile</p>
                    <h2 className='mt-3 text-2xl font-semibold'>What people see when they open a chat with you</h2>
                    <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Keep your profile clear and current so teammates can recognise you instantly in search, chat, and the contact details panel.
                    </p>

                    <div className='mt-6 grid gap-5'>
                      <div>
                        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Full name</label>
                        <input
                          onChange={(e) => setName(e.target.value)}
                          value={name}
                          type='text'
                          required
                          placeholder='Enter your full name'
                          className={`surface-border w-full rounded-2xl px-4 py-3 text-sm outline-none ${isDark ? 'bg-slate-900/82 text-white placeholder-slate-500' : 'bg-white text-slate-900 placeholder-slate-400'}`}
                        />
                      </div>

                      <div>
                        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Bio</label>
                        <textarea
                          onChange={(e) => setBio(e.target.value)}
                          value={bio}
                          placeholder='Add a short summary about your role, focus, or availability.'
                          required
                          rows={5}
                          className={`surface-border w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none ${isDark ? 'bg-slate-900/82 text-white placeholder-slate-500' : 'bg-white text-slate-900 placeholder-slate-400'}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={`surface-border rounded-[28px] p-5 ${isDark ? 'bg-white/5' : 'bg-white/90'}`}>
                    <p className='section-kicker'>Guidance</p>
                    <div className='mt-4 space-y-4'>
                      {[
                        'Use the name your teammates already know.',
                        'Keep your bio short enough to fit neatly in chat headers.',
                        'A square avatar works best for the contact sidebar and user cards.',
                      ].map((item) => (
                        <div key={item} className={`rounded-2xl px-4 py-3 text-sm leading-6 ${isDark ? 'bg-slate-950/70 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
                  <button
                    type='submit'
                    disabled={loading}
                    className='inline-flex flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-400 hover:to-sky-400 disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    {loading ? 'Saving changes...' : 'Save changes'}
                  </button>
                  <button
                    type='button'
                    onClick={() => navigate('/')}
                    className={`inline-flex flex-1 items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold ${isDark ? 'bg-white/5 text-slate-200 hover:bg-white/10' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                  >
                    Cancel
                  </button>
                </div>
              </form>

              <div className='grid gap-6 xl:grid-cols-2'>
                <section className={`surface-border rounded-[32px] p-6 ${isDark ? 'bg-slate-950/58' : 'bg-slate-50/70'}`}>
                  <p className='section-kicker'>Preferences</p>
                  <h2 className='mt-3 text-2xl font-semibold'>Keep your workspace comfortable</h2>
                  <div className='mt-6 space-y-4'>
                    {[
                      {
                        label: 'Theme mode',
                        description: isDark ? 'Dark mode is active across the workspace.' : 'Light mode is active across the workspace.',
                        control: (
                          <button
                            type='button'
                            onClick={toggleTheme}
                            className={`rounded-2xl px-4 py-2 text-sm font-semibold ${isDark ? 'bg-white/8 text-slate-100' : 'bg-white text-slate-700'}`}
                          >
                            {isDark ? 'Switch to light' : 'Switch to dark'}
                          </button>
                        ),
                      },
                      {
                        label: 'Desktop alerts',
                        description: 'Show a lightweight alert when new messages arrive while you are away from the tab.',
                        control: (
                          <button
                            type='button'
                            onClick={() => setDesktopAlerts((prev) => !prev)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${desktopAlerts ? 'bg-emerald-500/12 text-emerald-300' : isDark ? 'bg-white/8 text-slate-400' : 'bg-slate-200 text-slate-600'}`}
                          >
                            {desktopAlerts ? 'Enabled' : 'Disabled'}
                          </button>
                        ),
                      },
                      {
                        label: 'Message previews',
                        description: 'Show a short preview in notifications and contact cards for quicker triage.',
                        control: (
                          <button
                            type='button'
                            onClick={() => setMessagePreview((prev) => !prev)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${messagePreview ? 'bg-sky-500/12 text-sky-300' : isDark ? 'bg-white/8 text-slate-400' : 'bg-slate-200 text-slate-600'}`}
                          >
                            {messagePreview ? 'Enabled' : 'Disabled'}
                          </button>
                        ),
                      },
                    ].map((item) => (
                      <div key={item.label} className={`surface-border rounded-[24px] px-4 py-4 ${isDark ? 'bg-white/5' : 'bg-white/90'}`}>
                        <div className='flex items-start justify-between gap-4'>
                          <div>
                            <h3 className='text-sm font-semibold'>{item.label}</h3>
                            <p className={`mt-1 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.description}</p>
                          </div>
                          {item.control}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={`surface-border rounded-[32px] p-6 ${isDark ? 'bg-slate-950/58' : 'bg-slate-50/70'}`}>
                  <p className='section-kicker'>Activity notes</p>
                  <h2 className='mt-3 text-2xl font-semibold'>Suggestions to improve discoverability</h2>
                  <div className='mt-6 space-y-4'>
                    {activity.map((item, index) => (
                      <div key={item} className={`surface-border flex gap-4 rounded-[24px] px-4 py-4 ${isDark ? 'bg-white/5' : 'bg-white/90'}`}>
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${isDark ? 'bg-slate-900 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
                          {index + 1}
                        </div>
                        <p className={`text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
