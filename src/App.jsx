import Hero from './components/Hero'
import Projects from './components/Projects'
import Skills from './components/Skills'
import MessageBox from './components/MessageBox'
import VoiceNav from './components/VoiceNav'
import Terminal from './components/Terminal'

function App() {
  return (
    <div className="min-h-screen bg-space-bg text-space-text">
      <Hero />
      <Projects />
      <Skills />
      <MessageBox />
      <VoiceNav />
      <Terminal />
    </div>
  )
}

export default App
