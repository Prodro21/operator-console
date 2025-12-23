import { useEffect, useState } from 'react'
import { VideoWall } from './components/VideoWall'
import { TaggingControls } from './components/TaggingControls'
import { SessionControls } from './components/SessionControls'
import { CaptureAgentConfig } from './components/CaptureAgentConfig'
import { RecentClips } from './components/RecentClips'
import { ClipBrowser } from './components/ClipBrowser'
import { ClipPlayer } from './components/ClipPlayer'
import { useSessionStore, connectWebSocket, disconnectWebSocket } from './stores/sessionStore'
import type { Clip } from './types'

function App() {
  const session = useSessionStore((state) => state.session)
  const [activeTab, setActiveTab] = useState<'live' | 'clips'>('live')
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null)

  // Connect to WebSocket on mount
  useEffect(() => {
    connectWebSocket()
    return () => disconnectWebSocket()
  }, [])

  return (
    <div className="app">
      <header className="header">
        <h1>Operator Console</h1>
        <div className="main-tabs">
          <button
            className={`main-tab ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => setActiveTab('live')}
          >
            Live
          </button>
          <button
            className={`main-tab ${activeTab === 'clips' ? 'active' : ''}`}
            onClick={() => setActiveTab('clips')}
          >
            Clips
          </button>
        </div>
        <SessionControls />
      </header>

      <main className="main">
        {activeTab === 'live' ? (
          <>
            <div className="video-section">
              <VideoWall />
            </div>
            <div className="controls-section">
              <CaptureAgentConfig />
              {session && session.status === 'live' && <TaggingControls />}
              <RecentClips />
            </div>
          </>
        ) : (
          <div className="clips-section">
            <ClipBrowser onPlayClip={setSelectedClip} />
          </div>
        )}
      </main>

      {selectedClip && (
        <ClipPlayer clip={selectedClip} onClose={() => setSelectedClip(null)} />
      )}
    </div>
  )
}

export default App
