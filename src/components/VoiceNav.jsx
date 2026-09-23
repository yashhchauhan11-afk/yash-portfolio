import { useEffect, useRef, useState } from 'react'

// Local keyword matching — serves as the resilient offline fallback layer
function matchLocalIntent(rawText) {
  const text = (rawText || '').toLowerCase().trim()

  if (
    text.includes('project') ||
    text.includes('work') ||
    text.includes('portfolio') ||
    text.includes('built') ||
    text.includes('shipped')
  ) {
    return { destination: 'projects', reply: 'Going to projects.' }
  }

  if (
    text.includes('skill') ||
    text.includes('stack') ||
    text.includes('tech') ||
    text.includes('technologies')
  ) {
    return { destination: 'skills', reply: 'Showing technical skills.' }
  }

  if (
    text.includes('about') ||
    text.includes('background') ||
    text.includes('who are you') ||
    text.includes('who is') ||
    text.includes('bio') ||
    text.includes('education')
  ) {
    return { destination: 'about', reply: 'Navigating to about me.' }
  }

  if (
    text.includes('blog') ||
    text.includes('article') ||
    text.includes('writing') ||
    text.includes('post')
  ) {
    return { destination: 'blog', reply: 'Opening blog.' }
  }

  if (
    text.includes('contact') ||
    text.includes('hello') ||
    text.includes('message') ||
    text.includes('hire') ||
    text.includes('reach')
  ) {
    return { destination: 'contact', reply: 'Opening message box.' }
  }

  return { destination: 'none', reply: "didn't catch that" }
}

export default function VoiceNav() {
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardMessage, setCardMessage] = useState(null)
  const recognitionRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  function showCard(reply, duration = 5000) {
    setCardMessage(reply)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setCardMessage(null)
    }, duration)
  }

const ALLOWED_DESTINATIONS = ['projects', 'skills', 'about', 'blog', 'contact', 'none']

  function executeDestination(destination) {
    if (!destination || destination === 'none' || !ALLOWED_DESTINATIONS.includes(destination)) return

    if (destination === 'blog') {
      if (window.location.pathname !== '/blog') {
        window.history.pushState({}, '', '/blog')
        window.dispatchEvent(new PopStateEvent('popstate'))
        window.scrollTo(0, 0)
      }
      return
    }

    const sectionIds = {
      projects: 'projects',
      skills: 'skills',
      about: 'about',
      contact: 'say-hello',
    }

    const targetId = sectionIds[destination]
    if (!targetId) return

    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
      setTimeout(() => {
        const el = document.getElementById(targetId)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        } else {
          requestAnimationFrame(() => {
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' })
          })
        }
      }, 150)
    } else {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  async function handleTranscript(rawTranscript) {
    const transcript = (rawTranscript || '').trim()
    if (!transcript) {
      showCard("didn't catch that")
      return
    }

    setIsProcessing(true)

    // Attempt Gemini-powered assistant backend with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`)
      }

      const data = await response.json()
      if (
        !data ||
        typeof data.destination !== 'string' ||
        typeof data.reply !== 'string' ||
        !ALLOWED_DESTINATIONS.includes(data.destination)
      ) {
        throw new Error(`Invalid response or destination from assistant: ${data?.destination}`)
      }

      setIsProcessing(false)
      showCard(data.reply)
      executeDestination(data.destination)
    } catch (err) {
      clearTimeout(timeoutId)
      console.warn('VoiceNav: /api/assistant unavailable or failed, falling back to local intent:', err)
      setIsProcessing(false)

      // Fallback silently to broadened local keyword matching
      const fallback = matchLocalIntent(transcript)
      showCard(fallback.reply)
      executeDestination(fallback.destination)
    }
  }

  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    try {
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
        showCard('Listening...')
      }

      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript || ''
        handleTranscript(transcript)
      }

      recognition.onerror = (event) => {
        if (
          event.error === 'not-allowed' ||
          event.error === 'permission-denied'
        ) {
          showCard('mic access needed')
        } else if (event.error === 'no-speech') {
          showCard("didn't catch that")
        } else {
          showCard("didn't catch that")
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } catch (err) {
      console.error('Failed to start speech recognition:', err)
      setIsListening(false)
      showCard("didn't catch that")
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <>
      {cardMessage && (
        <div
          role="status"
          className="fixed bottom-20 left-6 z-40 max-w-xs p-3 rounded-xl bg-space-surface border border-space-accent shadow-2xl font-mono text-xs text-space-text"
        >
          <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-space-surface-2 text-[10px] text-space-muted">
            <span>assistant@portfolio: ~</span>
            <button
              type="button"
              onClick={() => setCardMessage(null)}
              className="text-space-muted hover:text-space-accent cursor-pointer"
              aria-label="Dismiss reply"
            >
              ✕
            </button>
          </div>
          <p className="text-space-accent leading-relaxed">
            {isProcessing ? 'Thinking…' : cardMessage}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={toggleListening}
        aria-label="Voice navigation"
        title="Voice navigation (click to speak a command)"
        className={`fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full bg-space-surface border font-mono flex items-center justify-center transition-all cursor-pointer ${
          isListening
            ? 'border-space-accent text-space-accent shadow-[0_0_15px_rgba(110,231,192,0.4)]'
            : isProcessing
            ? 'border-space-warm text-space-warm animate-pulse'
            : 'border-space-surface-2 text-space-muted hover:text-space-accent hover:border-space-accent'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      </button>
    </>
  )
}
