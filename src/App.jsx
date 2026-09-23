import Hero from './components/Hero'
import About from './components/About'
import Projects from './components/Projects'
import Skills from './components/Skills'
import MessageBox from './components/MessageBox'
import VoiceNav from './components/VoiceNav'
import Terminal from './components/Terminal'
import BlogList from './components/BlogList'
import useRouter from './useRouter'

function App() {
  const { path, navigate } = useRouter()

  if (path.startsWith('/blog')) {
    return <BlogList navigate={navigate} />
  }

  return (
    <div className="min-h-screen bg-space-bg text-space-text">
      <Hero />
      <About />
      <Projects />
      <Skills />
      <MessageBox />
      <VoiceNav />
      <Terminal />
    </div>
  )
}

export default App
