import { useState, useMemo, useCallback, useRef, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ThreeBackground = lazy(() => import('../components/ThreeBackground'))

const chatApps = [
  {
    id: 'slack',
    name: 'Slack',
    tagline: 'The work operating system for modern teams',
    description: 'Slack transforms how teams communicate by bringing people, data, and apps together in one place.',
    fullDescription: 'Slack has over 32 million daily active users worldwide. In June 2025, Slack bundled all AI features into paid plans (Business+ and Enterprise+), eliminating the separate $10/user AI add-on. The platform excels in flexibility, integrations, and ease of use, though its paid plans are more expensive than Microsoft Teams.',
    features: ['Unlimited channels', '2,600+ app integrations', 'AI-powered search', 'HD video calls (50 participants)', 'Slack Connect', 'Custom workflows', 'Advanced security', '1TB+ storage'],
    pros: ['Most intuitive interface', 'Largest integration ecosystem', 'AI in Business+ plan', 'Flexible channels', 'Strong APIs', 'Great for diverse stacks'],
    cons: ['Expensive ($7.25-15/user)', '3-user minimum', '90-day history on free', 'Notification overload', 'Limited free tier'],
    security: { encryption: 'AES-256, TLS', compliance: 'SOC 2, ISO 27001, HIPAA, GDPR', features: 'SSO/SAML, DLP, eDiscovery' },
    rating: 4.7,
    users: '32M',
    userCount: 32000000,
    price: 'Free: $0 | Pro: $7.25/mo | Business+: $15/mo',
    pricingDetail: { free: '$0', pro: '$7.25/mo', business: '$15/mo', enterprise: 'Custom' },
    platforms: ['Web', 'iOS', 'Android', 'Desktop'],
    color: '#4A154B',
    icon: '💬',
    bestFor: 'Startups, agencies, SaaS teams',
    verdict: 'Best for teams prioritizing flexibility, integrations, and a clean UI over Microsoft ecosystem.',
    category: 'enterprise'
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    tagline: 'Collaboration powered by Microsoft 365',
    description: 'Microsoft Teams integrates seamlessly with the Microsoft 365 ecosystem.',
    fullDescription: 'With 320 million monthly active users, Microsoft Teams dominates the enterprise market. Teams benefits from Microsoft\'s bundling strategy, offering chat + email + storage + video at competitive prices. However, AI features require Microsoft Copilot at $30/user/month extra.',
    features: ['Microsoft 365 integration', 'HD video calls (300)', 'Real-time collaboration', 'Task management', 'Breakout rooms', 'Enterprise security', 'Copilot AI ($30)', 'Teams Phone ($10)'],
    pros: ['Best value with M365', 'Superior video quality', 'Strong security', '1TB OneDrive', 'Office integration', '24/7 support'],
    cons: ['Copilot costs extra', 'Teams Premium $10', 'Feature overload', 'Complex admin', 'Not ideal non-Microsoft', 'Performance issues'],
    security: { encryption: 'TLS/MTLS, Azure AD', compliance: 'SOC 2, ISO 27001, HIPAA, GDPR, FedRAMP', features: 'Conditional Access, Intune, DLP' },
    rating: 4.6,
    users: '320M',
    userCount: 320000000,
    price: 'Free: $0 | Essentials: $4/mo | M365: $12.50/mo',
    pricingDetail: { free: '$0', essentials: '$4/mo', standard: '$12.50/mo', enterprise: 'Custom' },
    platforms: ['Web', 'iOS', 'Android', 'Desktop'],
    color: '#6264A7',
    icon: '👥',
    bestFor: 'Enterprises using Microsoft 365',
    verdict: 'Best for organizations deeply invested in Microsoft ecosystem.',
    category: 'enterprise'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    tagline: 'Simple, secure messaging for everyone',
    description: 'The world\'s most popular messaging app with 2.7+ billion users.',
    fullDescription: 'WhatsApp uses the Signal Protocol for end-to-end encryption, providing strong message security. However, it collects significant metadata and shares data with Meta. Group size is capped at 256, and file sharing is limited to 100MB.',
    features: ['E2E encryption (Signal)', 'Voice & video calls', 'Group chats (256)', 'File sharing (100MB)', 'WhatsApp Web', 'Status updates', 'WhatsApp Business', 'Message reactions'],
    pros: ['Largest user base', 'E2E by default', 'Simple interface', 'Free', 'Reliable', 'Works on low bandwidth'],
    cons: ['Meta ownership concerns', '256 group limit', '100MB file limit', 'No enterprise features', 'Metadata collection', 'Backups not encrypted'],
    security: { encryption: 'Signal Protocol', compliance: 'GDPR, CCPA', features: '2FA, Fingerprint lock' },
    rating: 4.8,
    users: '2.7B',
    userCount: 2700000000,
    price: 'Free',
    pricingDetail: { free: 'Free', business: 'Free' },
    platforms: ['Web', 'iOS', 'Android', 'Desktop'],
    color: '#25D366',
    icon: '📱',
    bestFor: 'Personal & small business',
    verdict: 'Best for everyday secure messaging with mainstream adoption.',
    category: 'personal'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    tagline: 'Fast, secure, feature-rich messaging',
    description: 'Cloud-based messaging with 900M+ users, known for massive groups.',
    fullDescription: 'Telegram supports groups up to 200,000 members and unlimited channel subscribers. However, default chats are NOT end-to-end encrypted (only Secret Chats are). File sharing supports up to 2GB.',
    features: ['Cloud messaging', 'Supergroups (200k)', 'Unlimited channels', 'Secret chats (E2E)', 'Bot API', 'File sharing (2GB)', 'Custom themes', 'Voice/video calls'],
    pros: ['Massive group capacity', 'Excellent desktop app', 'Fast performance', 'Rich bot ecosystem', '2GB files', 'Free, no ads'],
    cons: ['NOT E2E by default', 'Proprietary MTProto', 'Stores metadata', 'Limited business use', 'Blocked in some countries', 'Server access to chats'],
    security: { encryption: 'MTProto 2.0', compliance: 'Limited', features: 'Self-destruct, 2FA' },
    rating: 4.7,
    users: '900M',
    userCount: 900000000,
    price: 'Free',
    pricingDetail: { free: 'Free' },
    platforms: ['Web', 'iOS', 'Android', 'Desktop'],
    color: '#0088CC',
    icon: '✈️',
    bestFor: 'Large communities, channels',
    verdict: 'Use for groups/channels only - enable Secret Chats for privacy.',
    category: 'community'
  },
  {
    id: 'zoom',
    name: 'Zoom',
    tagline: 'The industry-leading video platform',
    description: 'The gold standard for video conferencing with 300M+ daily participants.',
    fullDescription: 'Zoom expanded from pure video conferencing into unified communications with Zoom Phone, Mail, and Team Chat. The free plan limits group meetings to 40 minutes. AI Companion is included in Pro ($13.33/mo).',
    features: ['HD video conferencing', 'Screen sharing', 'Breakout rooms', 'Recording', 'Virtual backgrounds', 'AI Companion', 'Zoom Phone', 'Webinars'],
    pros: ['Best video quality', 'Intuitive interface', 'AI in Pro', 'Strong scalability', 'Great for presentations', 'Robust controls'],
    cons: ['40-min limit (free)', 'Expensive ($13.33-18.33)', 'Lower security rating', 'No free support', 'Chat features lag', 'Costly add-ons'],
    security: { encryption: 'AES-256 GCM, TLS', compliance: 'SOC 2, ISO 27001, HIPAA, GDPR', features: 'Waiting room, password, E2E option' },
    rating: 4.6,
    users: '300M',
    userCount: 300000000,
    price: 'Free: $0 | Pro: $13.33/mo | Business: $18.33/mo',
    pricingDetail: { free: '$0 (40min)', pro: '$13.33/mo', business: '$18.33/mo', enterprise: 'Custom' },
    platforms: ['Web', 'iOS', 'Android', 'Desktop'],
    color: '#2D8CFF',
    icon: '📹',
    bestFor: 'Virtual meetings, webinars',
    verdict: 'Best for video-first organizations.',
    category: 'video'
  },
  {
    id: 'discord',
    name: 'Discord',
    tagline: 'Your place to talk, hang out, and have fun',
    description: 'Community platform with 500M+ users, from gaming to teams.',
    fullDescription: 'Discord\'s free plan is generous - unlimited voice/video/text, 100 servers, 25-person video calls. Nitro plans ($2.99-9.99/mo) add perks like 4K video and larger files. Voice quality is excellent but not designed for business.',
    features: ['Voice channels', 'Video calls (25)', 'Text channels', 'Screen sharing', 'Custom roles', 'Server creation (100)', 'Bot automation', 'Stage channels'],
    pros: ['Excellent free plan', 'Best voice quality', 'Great for communities', 'Customizable', 'Low-latency audio', 'Strong dev ecosystem'],
    cons: ['Not for business', 'Informal culture', 'No business integrations', 'Limited admin (free)', 'Feature overload', 'No file versioning'],
    security: { encryption: 'TLS, SRTP', compliance: 'Limited', features: '2FA, message encryption' },
    rating: 4.6,
    users: '500M',
    userCount: 500000000,
    price: 'Free: $0 | Nitro: $2.99-9.99/mo',
    pricingDetail: { free: '$0', basic: '$2.99/mo', nitro: '$9.99/mo' },
    platforms: ['Web', 'iOS', 'Android', 'Desktop'],
    color: '#5865F2',
    icon: '🎮',
    bestFor: 'Gaming, communities, informal teams',
    verdict: 'Choose Discord for communities, Zoom for formal meetings.',
    category: 'community'
  },
  {
    id: 'messenger',
    name: 'Facebook Messenger',
    tagline: 'Chat with friends across Facebook',
    description: 'One of the most-used messaging apps with 1B+ users.',
    fullDescription: 'Messenger is tightly integrated with Facebook, making it easy to reach 3B+ Facebook users. Limited business features compared to WhatsApp Business. Has inconsistent notifications and collects significant data.',
    features: ['Text & video calls', 'Group chats', 'Facebook integration', 'Message reactions', 'Voice messages', 'Payments (US)', 'Games', 'Messenger Kids'],
    pros: ['Free', 'Easy Facebook access', 'Cross-platform', 'Decent video', 'No phone needed', 'US payments'],
    cons: ['Requires Facebook', 'Privacy concerns', 'Inconsistent notifications', 'Limited business', 'Not enterprise-ready', 'Spammy requests'],
    security: { encryption: 'Signal Protocol (optional)', compliance: 'GDPR, CCPA', features: 'Secret conversations, 2FA' },
    rating: 4.4,
    users: '1B',
    userCount: 1000000000,
    price: 'Free',
    pricingDetail: { free: 'Free' },
    platforms: ['Web', 'iOS', 'Android'],
    color: '#0084FF',
    icon: '💙',
    bestFor: 'Casual users in Facebook ecosystem',
    verdict: 'Good for personal use. Choose Signal/WhatsApp for privacy.',
    category: 'personal'
  },
  {
    id: 'flock',
    name: 'Flock',
    tagline: 'Team communication made simple',
    description: 'Affordable team communication with project management.',
    fullDescription: 'Flock positions as simpler alternative to Slack with native project management tools. Limited integrations and enterprise features. Smaller user base with less frequent updates.',
    features: ['Group messaging', 'File sharing', 'Video calls', 'To-do lists', 'Channel organization', 'Public channels', 'Integrations', 'Admin controls'],
    pros: ['Affordable', 'Simple to use', 'Task management', 'Good for small teams', 'Free tier', 'File storage included'],
    cons: ['Fewer integrations', 'Limited enterprise', 'Smaller user base', 'Less updates', 'No advanced security', 'Clunky UI'],
    security: { encryption: 'TLS', compliance: 'Limited', features: '2FA, admin controls' },
    rating: 4.3,
    users: '1M',
    userCount: 1000000,
    price: 'Free: $0 | Pro: $4.50/user/mo',
    pricingDetail: { free: '$0', pro: '$4.50/mo' },
    platforms: ['Web', 'iOS', 'Android'],
    color: '#FF6B6B',
    icon: '🐑',
    bestFor: 'Small teams on tight budgets',
    verdict: 'Decent budget option but Slack/Teams offer more value.',
    category: 'enterprise'
  },
  {
    id: 'wechat',
    name: 'WeChat',
    tagline: 'The super-app for China',
    description: 'China\'s dominant super-app with 1.2B+ users.',
    fullDescription: 'WeChat is more than messaging - it\'s a lifestyle platform with WeChat Pay, mini-programs, and official accounts. Privacy concerns due to government surveillance. Essential for China business.',
    features: ['Text/voice/video', 'WeChat Pay', 'Mini-programs', 'Official accounts', 'Moments', 'Group chats (500)', 'Video calls', 'File sharing'],
    pros: ['All-in-one', 'Essential for China', 'No transaction fees', 'Huge feature set', 'Free, no ads', 'Strong Asia presence'],
    cons: ['Privacy concerns', 'Limited outside China', 'Can be overwhelming', 'Requires phone', 'Not enterprise-secure', 'Complex for new users'],
    security: { encryption: 'Server-side', compliance: 'Chinese regulations', features: 'WeChat Security' },
    rating: 4.5,
    users: '1.2B',
    userCount: 1200000000,
    price: 'Free',
    pricingDetail: { free: 'Free' },
    platforms: ['Web', 'iOS', 'Android'],
    color: '#07C160',
    icon: '🧧',
    bestFor: 'China business',
    verdict: 'Essential for China operations. Use alternatives for international.',
    category: 'personal'
  },
  {
    id: 'signal',
    name: 'Signal',
    tagline: 'Privacy is possible',
    description: 'The gold standard for privacy-focused messaging.',
    fullDescription: 'Signal uses the Signal Protocol with Perfect Forward Secrecy. Collects almost no metadata - only phone number and last connection. 100% open-source. Limited to ~1,000 group size and 100MB files.',
    features: ['E2E encryption (always)', 'Signal Protocol', 'Voice/video calls', 'Disappearing messages', 'Group chats (1k)', 'Screen lock', 'Note to self', 'Relay calls'],
    pros: ['Maximum privacy', 'Minimal metadata', 'Fully open-source', 'Recommended by experts', 'Free, non-profit', 'Non-profit organization'],
    cons: ['Smaller user base', '1,000 group limit', '100MB file limit', 'Desktop laggy', 'Fewer features', 'No business features'],
    security: { encryption: 'Signal Protocol (E2E)', compliance: 'GDPR, minimal', features: 'Sealed sender, Signal PIN, Screen lock' },
    rating: 4.8,
    users: '40M',
    userCount: 40000000,
    price: 'Free (non-profit)',
    pricingDetail: { free: 'Free (donations)' },
    platforms: ['Web', 'iOS', 'Android', 'Desktop'],
    color: '#3A76F0',
    icon: '🔒',
    bestFor: 'Privacy advocates, journalists',
    verdict: 'Install Signal for sensitive conversations. Keep WhatsApp for those who won\'t switch.',
    category: 'privacy'
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
}

const getRatingColor = (rating) => {
  if (rating >= 4.7) return 'text-emerald-400'
  if (rating >= 4.5) return 'text-indigo-400'
  if (rating >= 4.3) return 'text-amber-400'
  return 'text-zinc-400'
}

const getRatingBg = (rating) => {
  if (rating >= 4.7) return 'bg-emerald-500/20 border-emerald-500/30'
  if (rating >= 4.5) return 'bg-indigo-500/20 border-indigo-500/30'
  if (rating >= 4.3) return 'bg-amber-500/20 border-amber-500/30'
  return 'bg-zinc-500/20 border-zinc-500/30'
}

const getCategoryColor = (category) => {
  const colors = {
    enterprise: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    personal: 'bg-green-500/20 text-green-400 border-green-500/30',
    community: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    video: 'bg-red-500/20 text-red-400 border-red-500/30',
    privacy: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
  return colors[category] || colors.enterprise
}

export default function ChatAppsComparison() {
  const [selectedApp, setSelectedApp] = useState(null)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('rating')
  const [searchQuery, setSearchQuery] = useState('')
  const [compareMode, setCompareMode] = useState(false)
  const [compareApps, setCompareApps] = useState([])
  const [showComparePanel, setShowComparePanel] = useState(false)
  const searchRef = useRef(null)

  const filteredApps = useMemo(() => {
    let result = chatApps

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(app => 
        app.name.toLowerCase().includes(query) ||
        app.tagline.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.features.some(f => f.toLowerCase().includes(query))
      )
    }

    if (filter !== 'all') {
      result = result.filter(app => {
        if (filter === 'free') return app.price.includes('Free') && !app.price.includes('Starts')
        if (filter === 'paid') return app.price.includes('$')
        if (filter === 'enterprise') return app.category === 'enterprise'
        if (filter === 'privacy') return app.category === 'privacy'
        if (filter === 'video') return app.category === 'video'
        if (filter === 'personal') return app.category === 'personal'
        if (filter === 'community') return app.category === 'community'
        return true
      })
    }

    return result.sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating
      if (sortBy === 'users') return b.userCount - a.userCount
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return 0
    })
  }, [filter, sortBy, searchQuery])

  const handleCompareToggle = useCallback((app) => {
    setCompareApps(prev => {
      if (prev.find(a => a.id === app.id)) {
        return prev.filter(a => a.id !== app.id)
      }
      if (prev.length >= 3) return prev
      return [...prev, app]
    })
  }, [])

  const clearCompare = useCallback(() => {
    setCompareApps([])
    setCompareMode(false)
  }, [])

  const getEncryptionBadge = (app) => {
    const enc = app.security.encryption
    if (enc.includes('E2E') && !enc.includes('NOT')) return { label: 'E2E', class: 'bg-emerald-500/20 text-emerald-400' }
    if (enc.includes('Optional')) return { label: 'Optional', class: 'bg-amber-500/20 text-amber-400' }
    return { label: 'Server', class: 'bg-zinc-500/20 text-zinc-400' }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <ThreeBackground>
        <div className="relative z-10 px-4 py-8 md:py-12">
          <motion.div 
            initial={{ opacity: 0, y: -30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 rounded-full border border-indigo-500/30 mb-4">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-indigo-400">Updated March 2026</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              Top 10 Chat Apps 2026
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-4">
              Compare features, pricing, security & user reviews to find your perfect messaging platform
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <span className="px-3 py-1.5 bg-slate-800/50 rounded-full text-xs text-slate-400 border border-slate-700/50">10 Apps</span>
              <span className="px-3 py-1.5 bg-slate-800/50 rounded-full text-xs text-slate-400 border border-slate-700/50">5B+ Users</span>
              <span className="px-3 py-1.5 bg-slate-800/50 rounded-full text-xs text-slate-400 border border-slate-700/50">Security Rated</span>
            </div>
          </motion.div>

          <motion.div 
            className="max-w-xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative">
              <input
                ref={searchRef}
                type="text"
                placeholder="Search apps by name, features, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-3 px-4 pl-12 text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </motion.div>

          <motion.div className="flex flex-wrap justify-center gap-3 mb-6">
            {[
              { id: 'all', label: 'All', icon: '📱' },
              { id: 'free', label: 'Free', icon: '🆓' },
              { id: 'paid', label: 'Paid', icon: '💰' },
              { id: 'enterprise', label: 'Enterprise', icon: '🏢' },
              { id: 'privacy', label: 'Privacy', icon: '🔒' },
              { id: 'video', label: 'Video', icon: '📹' }
            ].map(f => (
              <button 
                key={f.id} 
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-sm font-medium ${
                  filter === f.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' 
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/30'
                }`}
              >
                <span>{f.icon}</span>
                <span>{f.label}</span>
              </button>
            ))}
            <button
              onClick={() => setShowComparePanel(true)}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-sm font-medium ${
                compareApps.length > 0 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25' 
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/30'
              }`}
            >
              <span>⚖️</span>
              <span>Compare ({compareApps.length})</span>
            </button>
          </motion.div>

          <motion.div className="flex justify-center gap-3 mb-8">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)} 
              className="bg-slate-800/50 border border-slate-700/30 rounded-xl px-4 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="rating">Sort by Rating</option>
              <option value="users">Sort by Users</option>
              <option value="name">Sort by Name</option>
            </select>
          </motion.div>

          {searchQuery && (
            <div className="text-center mb-4 text-slate-400">
              Found <span className="text-indigo-400 font-semibold">{filteredApps.length}</span> results for "{searchQuery}"
            </div>
          )}

          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible" 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl mx-auto mb-12"
          >
            {filteredApps.map((app) => (
              <motion.div 
                key={app.id} 
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -5 }}
                className="glass-card rounded-2xl p-5 cursor-pointer group relative overflow-hidden border border-slate-800/50 hover:border-slate-700/50 transition-all"
                onClick={() => setSelectedApp(app)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-full" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${app.color}20`, border: `1px solid ${app.color}30` }}
                      >
                        {app.icon}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">{app.name}</h3>
                        <p className="text-xs text-slate-500">{app.users} users</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getRatingBg(app.rating)} ${getRatingColor(app.rating)}`}>
                        ★ {app.rating}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCompareToggle(app)
                        }}
                        className={`text-xs px-2 py-1 rounded transition-all ${
                          compareApps.find(a => a.id === app.id)
                            ? 'bg-purple-500/30 text-purple-400'
                            : 'bg-slate-700/50 text-slate-400 hover:text-white'
                        }`}
                      >
                        {compareApps.find(a => a.id === app.id) ? '✓ Added' : '+ Compare'}
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">{app.tagline}</p>
                  
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className={`text-[10px] px-2 py-1 rounded-md border ${getCategoryColor(app.category)}`}>
                      {app.category}
                    </span>
                    {getEncryptionBadge(app) && (
                      <span className={`text-[10px] px-2 py-1 rounded-md border ${getEncryptionBadge(app).class}`}>
                        {getEncryptionBadge(app).label}
                      </span>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-400">{app.price.split('|')[0].trim()}</span>
                    <span className="text-xs text-slate-500 group-hover:text-indigo-400 transition-colors">View →</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }}
            className="max-w-6xl mx-auto glass-card rounded-3xl p-6 md:p-10 mb-12 border border-slate-800/50"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">📊 Comparison Table</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-3 text-slate-400 font-medium">App</th>
                    <th className="text-left py-3 px-3 text-slate-400 font-medium hidden md:table-cell">Users</th>
                    <th className="text-left py-3 px-3 text-slate-400 font-medium hidden lg:table-cell">Encryption</th>
                    <th className="text-left py-3 px-3 text-slate-400 font-medium">Price</th>
                    <th className="text-left py-3 px-3 text-slate-400 font-medium">Rating</th>
                    <th className="text-left py-3 px-3 text-slate-400 font-medium hidden sm:table-cell">Best For</th>
                  </tr>
                </thead>
                <tbody>
                  {[...chatApps].sort((a, b) => b.rating - a.rating).map(app => (
                    <tr 
                      key={app.id} 
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedApp(app)}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{app.icon}</span>
                          <span className="font-semibold text-white">{app.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-400 hidden md:table-cell">{app.users}</td>
                      <td className="py-3 px-3 hidden lg:table-cell">
                        <span className={`text-xs px-2 py-1 rounded ${getEncryptionBadge(app).class}`}>
                          {getEncryptionBadge(app).label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-emerald-400 font-medium">{app.price.split('|')[0].trim()}</td>
                      <td className="py-3 px-3">
                        <span className={`font-semibold ${getRatingColor(app.rating)}`}>★ {app.rating}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-xs hidden sm:table-cell">{app.bestFor.split(',')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4 }}
            className="max-w-4xl mx-auto mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">🎯 Choose by Use Case</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: '🏢', title: 'Enterprise', desc: 'Full collaboration with security', apps: ['Slack Business+', 'Microsoft Teams'], price: '$12.50-15/mo', color: 'border-purple-500/30' },
                { icon: '👤', title: 'Personal & Small Biz', desc: 'Simple, secure messaging', apps: ['WhatsApp', 'Signal'], price: 'Free', color: 'border-green-500/30' },
                { icon: '📹', title: 'Video Meetings', desc: 'Professional conferencing', apps: ['Zoom Pro', 'Google Meet'], price: '$5-13.33/mo', color: 'border-red-500/30' },
                { icon: '🔒', title: 'Privacy First', desc: 'Maximum security required', apps: ['Signal', 'Telegram (Secret)'], price: 'Free', color: 'border-gray-500/30' }
              ].map((item, idx) => (
                <div key={idx} className={`glass-card rounded-2xl p-5 border-l-4 ${item.color}`}>
                  <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                    <span>{item.icon}</span> {item.title}
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">{item.desc}</p>
                  <div className="space-y-1 mb-3">
                    {item.apps.map((app, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">{app}</span>
                        <span className={`text-xs font-medium ${item.price === 'Free' ? 'text-emerald-400' : 'text-slate-400'}`}>{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.5 }}
            className="max-w-4xl mx-auto mb-12"
          >
            <h2 className="text-xl font-bold text-center mb-6">💡 Key Insights 2026</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: '🤖', title: 'AI Integration', desc: 'Slack bundles AI in Business+, Teams charges $30/user for Copilot, Zoom includes in Pro' },
                { icon: '🔐', title: 'E2E Encryption', desc: 'Signal: Always. WhatsApp: Default. Telegram: Only Secret Chats' },
                { icon: '💵', title: 'True Cost', desc: 'Teams "free" with M365 but add-ons add up. Slack includes AI at $15' },
                { icon: '🎮', title: 'Discord vs Zoom', desc: 'Discord: communities, free, informal. Zoom: meetings, 40min limit, paid' }
              ].map((item, idx) => (
                <div key={idx} className="glass-card rounded-xl p-4 border border-slate-800/50">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm">{item.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="text-center mt-8 pb-8">
            <a 
              href="/" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-xl transition-all font-medium"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Chat App
            </a>
          </div>
        </div>
      </ThreeBackground>
      </Suspense>

      <AnimatePresence>
        {selectedApp && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedApp(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-3xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-6">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${selectedApp.color}20`, border: `1px solid ${selectedApp.color}30` }}
                >
                  {selectedApp.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-white">{selectedApp.name}</h2>
                  <p className="text-slate-400 text-sm">{selectedApp.tagline}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRatingBg(selectedApp.rating)} ${getRatingColor(selectedApp.rating)}`}>
                      ★ {selectedApp.rating}/5
                    </span>
                    <span className="text-xs text-slate-500">{selectedApp.users} users</span>
                    <span className={`text-xs px-2 py-1 rounded border ${getCategoryColor(selectedApp.category)}`}>
                      {selectedApp.category}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedApp(null)}
                  className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <p className="text-slate-300 mb-6 leading-relaxed">{selectedApp.fullDescription}</p>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">💰 Pricing</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(selectedApp.pricingDetail).map(([tier, price]) => (
                    <div key={tier} className="bg-slate-800/30 rounded-xl p-3 text-center border border-slate-700/30">
                      <div className="text-xs text-slate-500 capitalize mb-1">{tier}</div>
                      <div className="text-sm font-semibold text-emerald-400">{price}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">✅ Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedApp.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400 flex-shrink-0">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="glass-card rounded-xl p-4 bg-emerald-500/10 border border-emerald-500/20">
                  <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                    <span>✓</span> Pros
                  </h3>
                  <ul className="space-y-2">
                    {selectedApp.pros.map((pro, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="glass-card rounded-xl p-4 bg-red-500/10 border border-red-500/20">
                  <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                    <span>✗</span> Cons
                  </h3>
                  <ul className="space-y-2">
                    {selectedApp.cons.map((con, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="glass-card rounded-xl p-4 bg-slate-800/30 mb-6 border border-slate-700/30">
                <h3 className="text-sm font-semibold text-white mb-3">🔒 Security & Compliance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 block mb-1">Encryption</span>
                    <span className="text-slate-300 text-xs">{selectedApp.security.encryption}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Compliance</span>
                    <span className="text-slate-300 text-xs">{selectedApp.security.compliance}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Features</span>
                    <span className="text-slate-300 text-xs">{selectedApp.security.features}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-emerald-500/20 rounded-xl p-4 border border-slate-700/30">
                <h3 className="text-sm font-semibold text-white mb-2">🎯 Verdict</h3>
                <p className="text-slate-300 text-sm">{selectedApp.verdict}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showComparePanel && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }} 
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-700/50 z-50 p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Compare Apps</h3>
              <button onClick={() => setShowComparePanel(false)} className="text-slate-400 hover:text-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {compareApps.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Click "+ Compare" on apps to add them here</p>
            ) : (
              <div className="space-y-6">
                {compareApps.map((app) => (
                  <div key={app.id} className="glass-card rounded-xl p-4 border border-slate-700/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${app.color}20`, border: `1px solid ${app.color}30` }}
                      >
                        {app.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white">{app.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded ${getRatingBg(app.rating)} ${getRatingColor(app.rating)}`}>★ {app.rating}</span>
                      </div>
                      <button 
                        onClick={() => handleCompareToggle(app)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Price</span>
                        <span className="text-emerald-400">{app.price.split('|')[0].trim()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Users</span>
                        <span className="text-slate-300">{app.users}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Encryption</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getEncryptionBadge(app).class}`}>
                          {getEncryptionBadge(app).label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Category</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(app.category)}`}>
                          {app.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {compareApps.length >= 2 && (
                  <div className="glass-card rounded-xl p-4 border border-slate-700/30">
                    <h4 className="font-semibold text-white mb-3">Quick Comparison</h4>
                    <div className="space-y-3">
                      {['Rating', 'Price', 'Users'].map((field) => (
                        <div key={field} className="flex items-center justify-between">
                          <span className="text-slate-400 text-sm">{field}</span>
                          <div className="flex gap-2">
                            {compareApps.map(app => (
                              <span key={app.id} className="text-xs text-slate-300 bg-slate-800/50 px-2 py-1 rounded">
                                {field === 'Rating' ? `★ ${app.rating}` : field === 'Price' ? app.price.split('|')[0].trim() : app.users}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={clearCompare}
                  className="w-full py-3 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white transition-all"
                >
                  Clear All
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}