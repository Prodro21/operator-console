import { useEffect, useRef } from 'react'
import Hls from 'hls.js'
import { useSessionStore } from '../stores/sessionStore'

export function VideoWall() {
  const channels = useSessionStore((state) => state.channels)

  // Default channels for demo
  const displayChannels = channels.length > 0 ? channels : [
    { id: 'endzone', name: 'End Zone', hlsUrl: '', status: 'inactive' as const },
    { id: 'sideline', name: 'Sideline', hlsUrl: '', status: 'inactive' as const },
    { id: 'pressbox', name: 'Press Box', hlsUrl: '', status: 'inactive' as const },
    { id: 'coaches', name: 'Coaches', hlsUrl: '', status: 'inactive' as const },
  ]

  return (
    <div className="video-wall">
      {displayChannels.map((channel) => (
        <VideoCell key={channel.id} channel={channel} />
      ))}
    </div>
  )
}

interface VideoCellProps {
  channel: {
    id: string
    name: string
    hlsUrl: string
    status: 'active' | 'inactive' | 'error'
  }
}

function VideoCell({ channel }: VideoCellProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!channel.hlsUrl || !videoRef.current) return

    const video = videoRef.current

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      })

      hls.loadSource(channel.hlsUrl)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          // Autoplay blocked, user needs to interact
        })
      })

      return () => {
        hls.destroy()
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = channel.hlsUrl
      video.play().catch(() => {})
    }
  }, [channel.hlsUrl])

  return (
    <div className="video-cell">
      <video
        ref={videoRef}
        muted
        playsInline
        poster=""
      />
      <div className="label">
        {channel.name}
        {channel.status === 'active' && <span className="live-dot"> ●</span>}
      </div>
    </div>
  )
}
