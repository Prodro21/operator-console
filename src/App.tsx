import { VideoWall } from './components/VideoWall'
import { TaggingControls } from './components/TaggingControls'
import { SessionControls } from './components/SessionControls'
import { CaptureAgentConfig } from './components/CaptureAgentConfig'
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
        <div className="video-section">
          <VideoWall />
        </div>
        <div className="controls-section">
          <CaptureAgentConfig />
          {session && session.status === 'live' && <TaggingControls />}
        </div>
      </main>
    </div>
  )
}

export default App
