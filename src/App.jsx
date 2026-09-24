import Hero from './components/Hero'
import About from './components/About'
import Projects from './components/Projects'
import GithubActivity from './components/GithubActivity'
import Skills from './components/Skills'
import MessageBox from './components/MessageBox'
import VoiceNav from './components/VoiceNav'
import Terminal from './components/Terminal'
import BlogList from './components/BlogList'
import BlogPost from './components/BlogPost'
import useRouter from './useRouter'

function App() {
  const { path, navigate } = useRouter()

  let pageContent = null

  if (path === '/blog' || path === '/blog/') {
    pageContent = <BlogList navigate={navigate} />
  } else if (path.startsWith('/blog/')) {
    const slug = path.replace(/^\/blog\//, '').replace(/\/$/, '')
    pageContent = <BlogPost slug={slug} navigate={navigate} />
  } else {
    pageContent = (
      <main>
        <Hero />
        <About />
        <Projects />
        <GithubActivity />
        <Skills />
        <MessageBox />
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-space-bg text-space-text">
      {pageContent}

      {/* Persistent floating UI — available across all routes */}
      <VoiceNav />
      <Terminal />
    </div>
  )
}

export default App
