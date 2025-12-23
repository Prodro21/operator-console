import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { useSessionStore } from '../stores/sessionStore'
import type { CaptureAgent } from '../types'

export function VideoWall() {
  const captureAgents = useSessionStore((state) => state.captureAgents)

  // Show placeholder cells if no agents configured
  const displayItems = captureAgents.length > 0 ? captureAgents : [
    { id: 'placeholder-1', channelId: 'Camera 1', url: '', status: 'disconnected' as const },
    { id: 'placeholder-2', channelId: 'Camera 2', url: '', status: 'disconnected' as const },
    { id: 'placeholder-3', channelId: 'Camera 3', url: '', status: 'disconnected' as const },
    { id: 'placeholder-4', channelId: 'Camera 4', url: '', status: 'disconnected' as const },
  ]

  return (
    <div className="video-wall">
      {displayItems.map((agent) => (
        <VideoCell key={agent.id} agent={agent} />
      ))}
    </div>
  )
}

interface VideoCellProps {
  agent: CaptureAgent
}

function VideoCell({ agent }: VideoCellProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [streamStatus, setStreamStatus] = useState<'loading' | 'playing' | 'error' | 'offline'>('offline')

  // Build HLS URL from agent base URL
  const hlsUrl = agent.url ? `${agent.url}/hls/live.m3u8` : ''

  useEffect(() => {
    if (!hlsUrl || !videoRef.current) {
      setStreamStatus('offline')
      return
    }

    const video = videoRef.current
    setStreamStatus('loading')

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 6,
      })

      hlsRef.current = hls

      hls.loadSource(hlsUrl)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStreamStatus('playing')
        video.play().catch(() => {
          // Autoplay blocked, user needs to interact
        })
      })

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setStreamStatus('error')
          // Try to recover after a delay
          setTimeout(() => {
            if (hlsRef.current) {
              hlsRef.current.loadSource(hlsUrl)
            }
          }, 5000)
        }
      })

      return () => {
        hls.destroy()
        hlsRef.current = null
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = hlsUrl
      video.addEventListener('loadeddata', () => setStreamStatus('playing'))
      video.addEventListener('error', () => setStreamStatus('error'))
      video.play().catch(() => {})
    }
  }, [hlsUrl])

  return (
    <div className={`video-cell ${streamStatus}`}>
      <video
        ref={videoRef}
        muted
        playsInline
        poster=""
      />
      <div className="label">
        {agent.channelId}
        {streamStatus === 'playing' && <span className="live-dot"> ●</span>}
      </div>
      {streamStatus === 'loading' && (
        <div className="stream-overlay">Connecting...</div>
      )}
      {streamStatus === 'error' && (
        <div className="stream-overlay error">Stream Error - Retrying...</div>
      )}
      {streamStatus === 'offline' && (
        <div className="stream-overlay">No Stream</div>
      )}
    </div>
  )
}
