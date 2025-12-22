import { useEffect, useCallback } from 'react'
import { useSessionStore } from '../stores/sessionStore'

const PLAY_TYPES = ['Run', 'Pass', 'Punt', 'Kickoff', 'Field Goal', 'PAT']
const RESULTS = ['TD', '1st Down', 'Incomplete', 'Interception', 'Fumble', 'Sack']

export function TaggingControls() {
  const {
    markState,
    currentTag,
    startMark,
    endMark,
    setPlayType,
    setResult,
  } = useSessionStore()

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }

    switch (e.key.toLowerCase()) {
      case 'm':
        if (!markState.isMarking) {
          startMark()
        }
        break
      case ' ':
        e.preventDefault()
        if (markState.isMarking) {
          endMark()
        }
        break
      case 'q':
        // Quick clip - last 15 seconds
        console.log('Quick clip triggered')
        break
      case '1':
        setPlayType('Run')
        break
      case '2':
        setPlayType('Pass')
        break
      case '3':
        setPlayType('Punt')
        break
      case '4':
        setPlayType('Kickoff')
        break
      case 't':
        setResult('TD')
        break
      case 'f':
        setResult('1st Down')
        break
      case 'i':
        setResult('Incomplete')
        break
    }
  }, [markState.isMarking, startMark, endMark, setPlayType, setResult])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Timer display
  const getElapsedTime = () => {
    if (!markState.markInTime) return '0.0s'
    const elapsed = (Date.now() - markState.markInTime) / 1000
    return `${elapsed.toFixed(1)}s`
  }

  return (
    <div className="tagging-controls">
      <div className="mark-buttons">
        <button
          className="mark-btn mark-in"
          onClick={startMark}
          disabled={markState.isMarking}
        >
          {markState.isMarking ? `MARKING... ${getElapsedTime()}` : 'MARK IN'}
        </button>

        <button
          className="mark-btn mark-out"
          onClick={() => endMark()}
          disabled={!markState.isMarking}
        >
          MARK OUT
        </button>

        <button className="mark-btn quick-clip">
          QUICK CLIP (15s)
        </button>
      </div>

      <div className="play-type-buttons">
        {PLAY_TYPES.map((type, i) => (
          <button
            key={type}
            className={`play-type-btn ${currentTag.playType === type ? 'active' : ''}`}
            onClick={() => setPlayType(type)}
          >
            [{i + 1}] {type}
          </button>
        ))}
      </div>

      <div className="play-type-buttons" style={{ marginTop: '0.5rem' }}>
        {RESULTS.map((result) => (
          <button
            key={result}
            className={`play-type-btn ${currentTag.result === result ? 'active' : ''}`}
            onClick={() => setResult(result)}
          >
            {result}
          </button>
        ))}
      </div>

      <div className="keyboard-hints">
        <span><kbd>M</kbd> Mark In</span>
        <span><kbd>Space</kbd> Mark Out</span>
        <span><kbd>Q</kbd> Quick Clip</span>
        <span><kbd>1-4</kbd> Play Type</span>
        <span><kbd>T</kbd> TD</span>
        <span><kbd>F</kbd> 1st Down</span>
      </div>
    </div>
  )
}
