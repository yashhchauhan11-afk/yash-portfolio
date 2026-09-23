import { useEffect, useRef, useState } from 'react'
import { PROJECTS_OUTPUT } from './Projects'
import { SKILLS_OUTPUT } from './Skills'

const BANNER = ['yash-terminal v1.0.0', "type 'help' to see what this does", '']

function getHelp() {
  return [
    'available commands:',
    '  whoami        who is running this thing',
    '  skills        what i actually know',
    '  projects      things i\'ve shipped',
    '  blog          read articles and essays',
    '  contact       jump to the message box',
    '  sudo hire-me  ambitious. let\'s see.',
    '  clear         wipe this screen',
    '  exit          close terminal',
  ]
}

export default function Terminal() {
  const [open, setOpen] = useState(false)
  const [lines, setLines] = useState([])
  const [input, setInput] = useState('')
  const inputRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (open && lines.length === 0) {
      setLines(BANNER.map((text) => ({ type: 'output', text })))
    }
  }, [open, lines.length])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' })
  }, [lines])

  useEffect(() => {
    function handleKeyDown(e) {
      const tag = document.activeElement?.tagName
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA'

      if (!open && e.key === '`' && !isTyping) {
        e.preventDefault()
        setOpen(true)
      } else if (open && e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  function print(newLines) {
    setLines((prev) => [
      ...prev,
      ...newLines.map((text) => ({ type: 'output', text })),
    ])
  }

  function runCommand(raw) {
    const cmd = raw.trim()
    setLines((prev) => [...prev, { type: 'input', text: cmd }])

    if (!cmd) return

    const normalized = cmd.toLowerCase()

    if (normalized === 'help') {
      print(getHelp())
    } else if (normalized === 'whoami') {
      print([
        'yash_chauhan',
        'cse/iot engineer @ gec patan, gtu',
        "currently: probably automating something that didn't need automating",
      ])
    } else if (normalized === 'skills') {
      print(SKILLS_OUTPUT)
    } else if (normalized === 'projects') {
      print(PROJECTS_OUTPUT)
    } else if (normalized === 'blog') {
      print(['navigating to blog...'])
      setOpen(false)
      if (window.location.pathname !== '/blog') {
        window.history.pushState({}, '', '/blog')
        window.dispatchEvent(new PopStateEvent('popstate'))
        window.scrollTo(0, 0)
      }
    } else if (normalized === 'contact') {
      print(['scrolling down...'])
      setOpen(false)
      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/')
        window.dispatchEvent(new PopStateEvent('popstate'))
        setTimeout(() => {
          document.getElementById('say-hello')?.scrollIntoView({ behavior: 'smooth' })
        }, 150)
      } else {
        document.getElementById('say-hello')?.scrollIntoView({ behavior: 'smooth' })
      }
    } else if (normalized === 'sudo hire-me') {
      print([
        '[sudo] password for visitor: ********',
        'permission granted.',
        'scroll down and say hello — this part actually works.',
      ])
    } else if (normalized === 'clear') {
      setLines([])
      return
    } else if (normalized === 'exit') {
      setOpen(false)
    } else {
      print([`command not found: ${cmd}`, "type 'help' for a list."])
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    runCommand(input)
    setInput('')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Try the terminal (or press `)"
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-space-surface border border-space-surface-2 text-space-accent font-mono flex items-center justify-center hover:border-space-accent transition-colors"
      >
        &gt;_
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 px-4 pb-4 md:pb-0">
          <div className="w-full max-w-xl bg-space-surface border border-space-surface-2 rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 border-b border-space-surface-2">
              <span className="font-mono text-xs text-space-muted">yash@portfolio: ~</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close terminal"
                className="text-space-muted hover:text-space-text"
              >
                ✕
              </button>
            </div>

            <div className="h-72 overflow-y-auto px-4 py-3 font-mono text-sm">
              {lines.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.type === 'input'
                      ? 'text-space-accent'
                      : 'text-space-text whitespace-pre-wrap'
                  }
                >
                  {line.type === 'input' ? `> ${line.text}` : line.text}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSubmit} className="flex items-center border-t border-space-surface-2 px-4 py-2">
              <span className="font-mono text-space-accent mr-2">&gt;</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoComplete="off"
                spellCheck="false"
                className="flex-1 bg-transparent font-mono text-space-text outline-none"
              />
            </form>
          </div>
        </div>
      )}
    </>
  )
}
