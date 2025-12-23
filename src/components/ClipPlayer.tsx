import { useEffect, useRef } from 'react'
import { platformApi } from '../services/api'
import type { Clip } from '../types'

interface ClipPlayerProps {
  clip: Clip
  onClose: () => void
}

export function ClipPlayer({ clip, onClose }: ClipPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Record view when clip is opened
    platformApi.recordWatch(clip.id).catch(console.error)

    // Handle escape key to close
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [clip.id, onClose])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.focus()
    }
  }, [])

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleDownload = () => {
    const url = platformApi.getClipDownloadUrl(clip.id)
    const a = document.createElement('a')
    a.href = url
    a.download = `${clip.title || clip.play_id || clip.id}.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="clip-player-overlay" onClick={handleBackdropClick}>
      <div className="clip-player-modal">
        <div className="player-header">
          <h3>{clip.title || clip.play_id || 'Untitled Clip'}</h3>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="player-content">
          <video
            ref={videoRef}
            src={platformApi.getClipStreamUrl(clip.id)}
            controls
            autoPlay
            className="clip-video"
          />
        </div>

        <div className="player-footer">
          <div className="clip-info">
            <span className="info-item">
              Duration: {formatDuration(clip.duration_seconds)}
            </span>
            {clip.channel_id && (
              <span className="info-item">Channel: {clip.channel_id}</span>
            )}
            {clip.tags && Object.keys(clip.tags).length > 0 && (
              <div className="clip-tags">
                {Object.entries(clip.tags).map(([key, value]) => (
                  <span key={key} className="tag">
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="player-actions">
            <button className="action-btn" onClick={handleDownload}>
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
