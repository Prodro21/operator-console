import { VideoWall } from './components/VideoWall'
import { TaggingControls } from './components/TaggingControls'
import { SessionControls } from './components/SessionControls'
import { useSessionStore } from './stores/sessionStore'

function App() {
  const session = useSessionStore((state) => state.session)

  return (
    <div className="app">
      <header className="header">
        <h1>Operator Console</h1>
        <SessionControls />
      </header>

      <main className="main">
        <VideoWall />
        {session && <TaggingControls />}
      </main>
    </div>
  )
}

export default App
