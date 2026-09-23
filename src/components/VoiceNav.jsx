import { useEffect, useRef, useState } from 'react'

export default function VoiceNav() {
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [feedback, setFeedback] = useState('')
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

  function showFeedback(msg) {
    setFeedback(msg)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setFeedback('')
    }, 2500)
  }

  function handleVoiceCommand(rawTranscript) {
    const text = rawTranscript.toLowerCase().trim()

    if (text.includes('project')) {
      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
      showFeedback('Going to projects')
    } else if (text.includes('skill')) {
      document.getElementById('skills')?.scrollIntoView({ behavior: 'smooth' })
      showFeedback('Going to skills')
    } else if (
      text.includes('contact') ||
      text.includes('hello') ||
      text.includes('message')
    ) {
      document.getElementById('say-hello')?.scrollIntoView({ behavior: 'smooth' })
      showFeedback('Going to message box')
    } else {
      showFeedback("didn't catch that")
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
        showFeedback('Listening...')
      }

      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript || ''
        handleVoiceCommand(transcript)
      }

      recognition.onerror = (event) => {
        if (
          event.error === 'not-allowed' ||
          event.error === 'permission-denied'
        ) {
          showFeedback('mic access needed')
        } else if (event.error === 'no-speech') {
          showFeedback("didn't catch that")
        } else {
          showFeedback("didn't catch that")
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } catch (err) {
      setIsListening(false)
      showFeedback("didn't catch that")
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <>
      {feedback && (
        <div
          role="status"
          className="fixed bottom-20 left-6 z-40 px-3 py-1.5 rounded-lg bg-space-surface border border-space-surface-2 font-mono text-xs text-space-accent shadow-lg"
        >
          {feedback}
        </div>
      )}

      <button
        type="button"
        onClick={toggleListening}
        aria-label="Voice navigation"
        title="Voice navigation (click to speak a command)"
        className={`fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full bg-space-surface border font-mono flex items-center justify-center transition-all ${
          isListening
            ? 'border-space-accent text-space-accent shadow-[0_0_15px_rgba(110,231,192,0.35)]'
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
