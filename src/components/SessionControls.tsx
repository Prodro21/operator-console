import { useState } from 'react'
import { useSessionStore } from '../stores/sessionStore'

export function SessionControls() {
  const { session, createSession, startSession, completeSession, lastError, clearError } = useSessionStore()
  const [isCreating, setIsCreating] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [sessionType, setSessionType] = useState<'game' | 'practice' | 'scrimmage'>('game')

  const handleCreateSession = async () => {
    if (!sessionName.trim()) return
    setIsCreating(false)
    await createSession(sessionName, sessionType)
    setSessionName('')
  }

  const handleStartSession = async () => {
    await startSession()
  }

  const handleEndSession = async () => {
    await completeSession()
  }

  // Show error if present
  if (lastError) {
    return (
      <div className="session-controls">
        <span className="session-error">{lastError}</span>
        <button className="session-btn" onClick={clearError}>Dismiss</button>
      </div>
    )
  }

  // No session - show create form
  if (!session) {
    if (isCreating) {
      return (
        <div className="session-controls">
          <input
            type="text"
            placeholder="Session name..."
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            className="session-input"
            autoFocus
          />
          <select
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value as 'game' | 'practice' | 'scrimmage')}
            className="session-select"
          >
            <option value="game">Game</option>
            <option value="practice">Practice</option>
            <option value="scrimmage">Scrimmage</option>
          </select>
          <button className="session-btn" onClick={handleCreateSession}>
            Create
          </button>
          <button className="session-btn secondary" onClick={() => setIsCreating(false)}>
            Cancel
          </button>
        </div>
      )
    }

    return (
      <div className="session-controls">
        <button className="session-btn" onClick={() => setIsCreating(true)}>
          New Session
        </button>
      </div>
    )
  }

  // Session exists
  return (
    <div className="session-controls">
      <span className={`session-status ${session.status === 'live' ? 'live' : 'idle'}`}>
        {session.status === 'live' ? '● LIVE' : session.status.toUpperCase()}
      </span>
      <span>{session.name}</span>

      {session.status === 'scheduled' && (
        <button className="session-btn" onClick={handleStartSession}>
          Start Session
        </button>
      )}

      {session.status === 'live' && (
        <button className="session-btn" onClick={handleEndSession}>
          End Session
        </button>
      )}
    </div>
  )
}
