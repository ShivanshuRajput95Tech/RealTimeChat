import { useState, useEffect, useCallback, useRef, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { debounce, isNearBottom } from '../lib/utils'

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook to handle scroll position
export function useScrollPosition(containerRef) {
  const [isAtBottom, setIsAtBottom] = useState(true)

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setIsAtBottom(isNearBottom(containerRef.current))
    }
  }, [containerRef])

  const scrollToLatest = useCallback((behavior = 'smooth') => {
    if (containerRef.current) {
      const lastChild = containerRef.current.lastElementChild
      if (lastChild) {
        lastChild.scrollIntoView({ behavior })
      }
    }
  }, [containerRef])

  return { isAtBottom, setIsAtBottom, handleScroll, scrollToLatest }
}

// Hook for keyboard shortcuts
export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handler = (e) => {
      for (const shortcut of shortcuts) {
        const { key, ctrl, meta, shift, handler: fn, preventDefault = true } = shortcut
        const ctrlOrMeta = ctrl || meta
        const isMatch =
          e.key.toLowerCase() === key.toLowerCase() &&
          ((!ctrlOrMeta && !e.ctrlKey && !e.metaKey) || (ctrlOrMeta && (e.ctrlKey || e.metaKey))) &&
          (!shift || e.shiftKey)

        if (isMatch) {
          if (preventDefault) e.preventDefault()
          fn(e)
          return
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcuts])
}

// Hook for local storage with state sync
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch {
      // Storage not available
    }
  }, [key, storedValue])

  return [storedValue, setValue]
}

// Hook for media query
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

// Hook for mobile detection
export function useIsMobile() {
  return useMediaQuery('(max-width: 768px)')
}

// Hook for previous value
export function usePrevious(value) {
  const ref = useRef()
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref.current
}

// Hook for debounce value
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Hook for toggle state
export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue)
  const toggle = useCallback(() => setValue((v) => !v), [])
  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])
  return [value, toggle, setTrue, setFalse]
}

// Hook for click outside
export function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return
      handler(e)
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}

// Hook for intersection observer
export function useIntersectionObserver(options = {}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting)
    }, { threshold: 0.5, ...options })

    observer.observe(element)
    return () => observer.disconnect()
  }, [options.threshold])

  return [ref, isVisible]
}

// Hook for window size
export function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = debounce(() => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }, 100)

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}

// Hook for form validation
export function useFormValidation(initialValues, validationRules) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const validate = useCallback((fieldName, value) => {
    const rules = validationRules[fieldName]
    if (!rules) return ''

    for (const rule of rules) {
      const error = rule(value, values)
      if (error) return error
    }
    return ''
  }, [validationRules, values])

  const handleChange = useCallback((fieldName, value) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }))
    if (touched[fieldName]) {
      const error = validate(fieldName, value)
      setErrors((prev) => ({ ...prev, [fieldName]: error }))
    }
  }, [touched, validate])

  const handleBlur = useCallback((fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }))
    const error = validate(fieldName, values[fieldName])
    setErrors((prev) => ({ ...prev, [fieldName]: error }))
  }, [validate, values])

  const isValid = Object.values(errors).every((e) => !e) &&
    Object.keys(validationRules).every((k) => touched[k])

  return { values, errors, touched, handleChange, handleBlur, isValid, setValues }
}

export default {
  useAuth,
  useScrollPosition,
  useKeyboardShortcuts,
  useLocalStorage,
  useMediaQuery,
  useIsMobile,
  usePrevious,
  useDebounce,
  useToggle,
  useClickOutside,
  useIntersectionObserver,
  useWindowSize,
  useFormValidation,
}