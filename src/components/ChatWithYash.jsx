import { useEffect, useRef, useState } from 'react'

const INITIAL_MESSAGE = {
  role: 'assistant',
  text: "Hey! I'm Yash's AI assistant. Ask me anything about his projects, tech stack, embedded systems work, or background.",
}

const SECTION_IDS = {
  projects: 'projects',
  skills: 'skills',
  about: 'about',
  contact: 'say-hello',
}

export default function ChatWithYash() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, loading])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  function handleDestinationClick(destination) {
    if (!destination || destination === 'none') return

    if (destination === 'blog') {
      if (window.location.pathname !== '/blog') {
        window.history.pushState({}, '', '/blog')
        window.dispatchEvent(new PopStateEvent('popstate'))
        window.scrollTo(0, 0)
      }
      return
    }

    const targetId = SECTION_IDS[destination]
    if (!targetId) return

    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
      setTimeout(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' })
      }, 150)
    } else {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMessage = { role: 'user', text: trimmed }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    // Prepare multi-turn history (last 6 messages before current query)
    const historyPayload = messages.slice(-6).map((m) => ({
      role: m.role,
      text: m.text,
    }))

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          mode: 'chat',
          history: historyPayload,
        }),
      })

      if (!res.ok) {
        throw new Error(`API error ${res.status}`)
      }

      const data = await res.json()
      if (!data || typeof data.reply !== 'string') {
        throw new Error('Invalid response structure')
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply,
          destination: data.destination && data.destination !== 'none' ? data.destination : null,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Something went wrong, try again.',
          isError: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Toggle Button (Stacked above Terminal bottom-right) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close chat' : 'Chat with Yash'}
        title="Chat with Yash (AI Assistant)"
        className={`fixed bottom-24 right-6 z-40 w-12 h-12 rounded-full bg-space-surface border font-mono flex items-center justify-center transition-all cursor-pointer shadow-lg ${
          isOpen
            ? 'border-space-accent text-space-accent shadow-[0_0_15px_rgba(110,231,192,0.3)]'
            : 'border-space-surface-2 text-space-text hover:border-space-accent hover:text-space-accent'
        }`}
      >
        {isOpen ? (
          <span className="text-lg font-bold leading-none">✕</span>
        ) : (
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
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Floating Chat Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Chat with Yash"
          className="fixed bottom-40 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-sm h-[480px] max-h-[70vh] flex flex-col rounded-2xl bg-space-surface border border-space-surface-2 shadow-2xl overflow-hidden backdrop-blur-md"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-space-surface-2 bg-space-surface/90 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-space-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-space-accent" />
              </span>
              <div>
                <h3 className="font-display text-sm font-medium text-space-text leading-none">
                  Chat with Yash
                </h3>
                <span className="font-mono text-[10px] text-space-muted">
                  AI Digital Assistant
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat window"
              className="text-space-muted hover:text-space-text text-sm p-1 rounded transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user'
              return (
                <div
                  key={i}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      isUser
                        ? 'rounded-br-sm bg-space-accent/15 text-space-text border border-space-accent/30 font-body'
                        : msg.isError
                        ? 'rounded-bl-sm bg-space-warm/15 text-space-warm border border-space-warm/40 font-body'
                        : 'rounded-bl-sm bg-space-surface-2 text-space-text border border-space-surface-2/80 font-body'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Jump Chip if message suggested a destination */}
                  {msg.destination && (
                    <button
                      type="button"
                      onClick={() => handleDestinationClick(msg.destination)}
                      className="mt-1.5 font-mono text-xs px-2.5 py-1 rounded-full bg-space-surface-2 text-space-accent border border-space-accent/30 hover:bg-space-accent hover:text-space-bg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Jump to {msg.destination}</span>
                      <span aria-hidden="true">↗</span>
                    </button>
                  )}
                </div>
              )
            })}

            {/* In-flight typing indicator */}
            {loading && (
              <div className="flex items-start">
                <div className="rounded-2xl rounded-bl-sm px-4 py-2.5 bg-space-surface-2 border border-space-surface-2/80 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-space-accent animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-space-accent animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-space-accent animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="p-3 border-t border-space-surface-2 bg-space-surface/90 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder={loading ? 'Thinking…' : 'Ask about work, stack, or bio…'}
              className="flex-1 bg-space-surface-2/70 border border-space-surface-2 rounded-xl px-3.5 py-2 text-sm text-space-text placeholder-space-muted outline-none focus:border-space-accent transition-colors disabled:opacity-50 font-body"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="p-2.5 rounded-xl bg-space-accent text-space-bg hover:opacity-90 disabled:opacity-30 disabled:hover:opacity-30 transition-all cursor-pointer flex items-center justify-center shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
                aria-hidden="true"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  )
}
