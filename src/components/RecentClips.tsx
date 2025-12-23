import { useSessionStore } from '../stores/sessionStore'
import type { Clip } from '../types'

export function RecentClips() {
  const recentClips = useSessionStore((state) => state.recentClips)
  const clearClips = useSessionStore((state) => state.clearClips)

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusBadge = (status: Clip['status']) => {
    const styles: Record<string, string> = {
      pending: 'status-pending',
      processing: 'status-processing',
      ready: 'status-ready',
      failed: 'status-failed',
    }
    return <span className={`status-badge ${styles[status] || ''}`}>{status}</span>
  }

  if (recentClips.length === 0) {
    return (
      <div className="recent-clips">
        <h3>Recent Clips</h3>
        <p className="no-clips">No clips yet. Start marking plays to generate clips.</p>
      </div>
    )
  }

  return (
    <div className="recent-clips">
      <div className="clips-header">
        <h3>Recent Clips ({recentClips.length})</h3>
        <button onClick={clearClips} className="clear-btn">
          Clear
        </button>
      </div>
      <ul className="clips-list">
        {recentClips.map((clip) => (
          <li key={clip.id} className="clip-item">
            <div className="clip-info">
              <span className="clip-title">{clip.title || clip.play_id || 'Untitled'}</span>
              <span className="clip-meta">
                {formatDuration(clip.duration_seconds)} | {formatTime(clip.created_at)}
              </span>
            </div>
            <div className="clip-status">{getStatusBadge(clip.status)}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
