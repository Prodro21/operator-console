import { useSessionStore } from '../stores/sessionStore'

export function SessionControls() {
  const { session, setSession } = useSessionStore()

  const handleStartSession = () => {
    // TODO: Call platform API to create/start session
    setSession({
      id: `session-${Date.now()}`,
      name: 'Live Session',
      type: 'game',
      status: 'live',
      createdAt: new Date().toISOString(),
    })
  }

  const handleEndSession = () => {
    // TODO: Call platform API to complete session
    if (session) {
      setSession({ ...session, status: 'completed' })
    }
  }

  return (
    <div className="session-controls">
      {session ? (
        <>
          <span className={`session-status ${session.status === 'live' ? 'live' : 'idle'}`}>
            {session.status === 'live' ? '● LIVE' : session.status.toUpperCase()}
          </span>
          <span>{session.name}</span>
          {session.status === 'live' && (
            <button className="session-btn" onClick={handleEndSession}>
              End Session
            </button>
          )}
        </>
      ) : (
        <button className="session-btn" onClick={handleStartSession}>
          Start Session
        </button>
      )}
    </div>
  )
}
