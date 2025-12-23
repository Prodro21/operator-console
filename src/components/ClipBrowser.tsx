import { useState, useEffect } from 'react'
import { platformApi } from '../services/api'
import { useSessionStore } from '../stores/sessionStore'
import type { Clip } from '../types'

interface ClipBrowserProps {
  onPlayClip: (clip: Clip) => void
}

export function ClipBrowser({ onPlayClip }: ClipBrowserProps) {
  const session = useSessionStore((state) => state.session)
  const recentClips = useSessionStore((state) => state.recentClips)

  const [clips, setClips] = useState<Clip[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'session' | 'favorites'>('all')

  // Load clips on mount and when filter changes
  useEffect(() => {
    loadClips()
  }, [filter, session?.id])

  // Merge recent clips from WebSocket
  useEffect(() => {
    if (recentClips.length > 0) {
      setClips((prev) => {
        const newClips = [...prev]
        for (const clip of recentClips) {
          const idx = newClips.findIndex((c) => c.id === clip.id)
          if (idx >= 0) {
            newClips[idx] = clip
          } else {
            newClips.unshift(clip)
          }
        }
        return newClips
      })
    }
  }, [recentClips])

  const loadClips = async () => {
    setLoading(true)
    setError(null)

    try {
      let params: Parameters<typeof platformApi.listClips>[0] = { limit: 50 }

      if (filter === 'session' && session?.id) {
        params.session_id = session.id
      } else if (filter === 'favorites') {
        params.favorite = true
      }

      const response = await platformApi.listClips(params)
      setClips(response.clips || [])
    } catch (err) {
      setError('Failed to load clips')
      console.error('Failed to load clips:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFavorite = async (clip: Clip, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const updated = await platformApi.toggleFavorite(clip.id)
      setClips((prev) =>
        prev.map((c) => (c.id === clip.id ? updated : c))
      )
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <div className="clip-browser">
      <div className="browser-header">
        <h3>Clips</h3>
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-tab ${filter === 'session' ? 'active' : ''}`}
            onClick={() => setFilter('session')}
            disabled={!session}
          >
            Session
          </button>
          <button
            className={`filter-tab ${filter === 'favorites' ? 'active' : ''}`}
            onClick={() => setFilter('favorites')}
          >
            Favorites
          </button>
        </div>
        <button className="refresh-btn" onClick={loadClips} disabled={loading}>
          {loading ? '...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="browser-error">{error}</div>}

      <div className="clips-grid">
        {clips.length === 0 && !loading ? (
          <div className="no-clips-message">
            {filter === 'session' && !session
              ? 'Start a session to see clips'
              : 'No clips found'}
          </div>
        ) : (
          clips.map((clip) => (
            <div
              key={clip.id}
              className={`clip-card ${clip.status}`}
              onClick={() => clip.status === 'ready' && onPlayClip(clip)}
            >
              <div className="clip-thumbnail">
                {clip.status === 'ready' && clip.thumbnail_path ? (
                  <img
                    src={platformApi.getClipThumbnailUrl(clip.id)}
                    alt={clip.title || 'Clip thumbnail'}
                  />
                ) : (
                  <div className="thumbnail-placeholder">
                    {clip.status === 'processing' ? 'Processing...' : 'No Preview'}
                  </div>
                )}
                <div className="clip-duration">{formatDuration(clip.duration_seconds)}</div>
                {clip.status === 'ready' && (
                  <div className="play-overlay">
                    <span className="play-icon">▶</span>
                  </div>
                )}
              </div>
              <div className="clip-details">
                <div className="clip-title-row">
                  <span className="clip-title">{clip.title || clip.play_id || 'Untitled'}</span>
                  <button
                    className={`favorite-btn ${clip.is_favorite ? 'active' : ''}`}
                    onClick={(e) => handleToggleFavorite(clip, e)}
                  >
                    {clip.is_favorite ? '★' : '☆'}
                  </button>
                </div>
                <div className="clip-meta">
                  <span>{formatDate(clip.created_at)}</span>
                  <span>{formatTime(clip.created_at)}</span>
                  {clip.channel_id && <span>{clip.channel_id}</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
