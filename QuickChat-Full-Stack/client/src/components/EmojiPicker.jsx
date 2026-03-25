import React, { useRef, useEffect, useCallback, useState } from 'react'

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'],
  'Gestures': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'],
  'Objects': ['🔥', '⭐', '🌟', '✨', '⚡', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '🏧', '🚧', '♿', '🚼', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🚨', '🚓', '🚔', '🚍', '🚘', '🚖', '⚡', '🔮', '🧿', '💈', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '💎', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🧱', '🪜', '🧰', '🧲', '💊', '💉', '🩸', '🩹', '🩺', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪥', '🪒', '🧽', '🪣', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🧸', '🪆', '🖼️', '🪞', '🪟', '🛍️', '🛒', '🎁', '🎈', '🎏', '🎀', '🪄', '🪅', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷️', '🪧', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '🗒️', '🗓️', '📆', '📅', '🗑️', '📇', '🗃️', '🗳️', '🗄️', '📋', '📁', '📂', '🗂️', '🗞️', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🧷', '🔗', '📎', '🖇️', '📐', '📏', '🧮', '📌', '📍', '✂️', '🖊️', '🖋️', '✒️', '🖌️', '🖍️', '📝', '✏️', '🔍', '🔎', '🔬', '🔭', '📡', '💡', '🔦', '🏮', '📔', '🪔', '🔋', '🔌', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '🧮', '🎥', '🎞️', '📽️', '🎞️', '📺', '📷', '📸', '📹', '📼', '🔊', '🔉', '🔈', '🔇', '🔔', '🔕', '📣', '📢', '👁‍🗨', '🔍', '💬', '🗨️', '💭', '🗯️', '💌', '📧', '📨', '📩', '📤', '📥', '📦', '📫', '📪', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '📆', '📅', '🗒️', '🗓️', '📇', '📉', '📊', '📋', '📌', '📍', '📏', '📐', '✂️', '🖊️', '🖋️', '✒️', '🖌️', '🖍️', '📝', '✏️', '🔍', '🔎', '💡', '🔦', '🏮', '🪔', '🔋', '🔌'],
  'Symbols': ['🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🎪', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🎹', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🕹️', '🎰', '🧩', '♠️', '♥️', '♦️', '♣️', '🃏', '🀄', '🎴', '🀄', '🏴', '🏳️', '🏴‍☠️', '🏁', '🚩', '🎌', '🏳️', '🏴', '🏴‍☠️', '🇺🇳', '🇺🇸', '🇪🇺', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🏴󠁧󠁢󠁷󠁣󠁿'],
  'Nature': ['🌵', '🎄', '🌲', '🌳', '🌴', '🪵', '🌱', '🌿', '☘️', '🍀', '🎍', '🪴', '🎋', '🍃', '🍂', '🍁', '🍄', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '🌎', '🌍', '🌏', '🪐', '💫', '⭐', '🌟', '✨', '💥', '☄️', '💥', '🔥', '🌪️', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️', '🌫️', '🌮', '🌯', '🌮', '🌯', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🫖', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽️', '🥣', '🥡', '🥢', '🧆'],
  'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐈', '🐈‍⬛', '🪶', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔', '🐾', '🦃', '🐦', '🦅', '🦉', '🦇', '🐺', '🦊', '🦝', '🦝', '🦨'],
}

const CATEGORY_ICONS = {
  'Smileys': '😀',
  'Gestures': '👋',
  'Hearts': '❤️',
  'Objects': '🔧',
  'Symbols': '🏆',
  'Nature': '🌿',
  'Animals': '🐱',
}

const EmojiPicker = React.memo(({ onSelect, onClose }) => {
  const ref = useRef(null)
  const [activeCategory, setActiveCategory] = useState('Smileys')
  const [recentEmojis, setRecentEmojis] = useState(() => {
    const stored = localStorage.getItem('recentEmojis')
    return stored ? JSON.parse(stored) : []
  })
  const categories = Object.keys(EMOJI_CATEGORIES)

  const handleClickOutside = useCallback((e) => {
    if (ref.current && !ref.current.contains(e.target)) onClose?.()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  const handleSelect = useCallback((emoji) => {
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji)
      const updated = [emoji, ...filtered].slice(0, 16)
      localStorage.setItem('recentEmojis', JSON.stringify(updated))
      return updated
    })
    onSelect(emoji)
    onClose?.()
  }, [onSelect, onClose])

  const displayedCategories = ['Smileys', 'Gestures', 'Hearts', 'Nature', 'Objects']

  return (
    <div 
      ref={ref} 
      className="glass-strong rounded-2xl shadow-2xl w-[340px] max-h-[380px] overflow-hidden border border-white/5 scale-in"
      role="dialog"
      aria-label="Emoji picker"
    >
      <div className="emoji-category" role="tablist" aria-label="Emoji categories">
        {displayedCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`emoji-category-btn ${activeCategory === cat ? 'active' : ''}`}
            title={cat}
            role="tab"
            aria-selected={activeCategory === cat}
            aria-controls={`emoji-panel-${cat}`}
          >
            {CATEGORY_ICONS[cat]}
          </button>
        ))}
      </div>
      
      <div 
        id={`emoji-panel-${activeCategory}`}
        role="tabpanel"
        className="p-3 overflow-y-auto max-h-[280px] scrollbar-thin"
        aria-label={`${activeCategory} emojis`}
      >
        {recentEmojis.length > 0 && activeCategory === 'Smileys' && (
          <>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-2 px-1">Recently used</p>
            <div className="grid grid-cols-8 gap-0.5 mb-3">
              {recentEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSelect(emoji)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg hover:bg-surface-600/50 cursor-pointer transition-all duration-150 hover:scale-110 hover:bg-primary/10"
                  aria-label={`Use ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="h-px bg-white/5 mb-3" />
          </>
        )}

        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-2 px-1">{activeCategory}</p>
        <div className="grid grid-cols-8 gap-0.5">
          {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              onClick={() => handleSelect(emoji)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-lg hover:bg-surface-600/50 cursor-pointer transition-all duration-150 hover:scale-110 hover:bg-primary/10"
              aria-label={`Use ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})

export default EmojiPicker
