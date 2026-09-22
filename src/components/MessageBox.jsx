import { useState } from 'react'

const STATUS = {
  IDLE: 'idle',
  SENDING: 'sending',
  SENT: 'sent',
  ERROR: 'error',
}

export default function MessageBox() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState(STATUS.IDLE)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim()) return

    setStatus(STATUS.SENDING)
    try {
      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message }),
      })
      if (!res.ok) throw new Error('Request failed')
      setStatus(STATUS.SENT)
      setName('')
      setMessage('')
    } catch (err) {
      setStatus(STATUS.ERROR)
    }
  }

  return (
    <section id="say-hello" className="px-6 md:px-16 py-24 border-t border-space-surface-2">
      <div className="max-w-lg">
        <h2 className="font-display text-3xl md:text-4xl mb-3">Say hello</h2>
        <p className="font-body text-space-muted mb-8 leading-relaxed">
          This goes straight to my Telegram — no email, no waiting on a form
          submission somewhere. I'll usually reply the same day.
        </p>

        {status === STATUS.SENT ? (
          <p className="font-body text-space-accent text-lg" role="status">
            Sent. Talk soon.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-space-surface border border-space-surface-2 rounded-lg px-4 py-3 font-body text-space-text placeholder:text-space-muted focus:border-space-accent outline-none"
            />
            <textarea
              required
              placeholder="What's on your mind?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="bg-space-surface border border-space-surface-2 rounded-lg px-4 py-3 font-body text-space-text placeholder:text-space-muted focus:border-space-accent outline-none resize-none"
            />
            <button
              type="submit"
              disabled={status === STATUS.SENDING}
              className="self-start px-6 py-3 rounded-full bg-space-accent text-space-bg font-body font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {status === STATUS.SENDING ? 'Sending…' : 'Send it'}
            </button>
            {status === STATUS.ERROR && (
              <p className="font-body text-red-400 text-sm" role="alert">
                Didn't go through — try again in a moment.
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  )
}
