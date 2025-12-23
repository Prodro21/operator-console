// API service for communicating with platform and capture agents

const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL || 'http://localhost:8080'

// Platform API
export const platformApi = {
  // Sessions
  async createSession(data: { name: string; type: string }) {
    const res = await fetch(`${PLATFORM_URL}/api/v1/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  },

  async startSession(sessionId: string) {
    const res = await fetch(`${PLATFORM_URL}/api/v1/sessions/${sessionId}/start`, {
      method: 'POST',
    })
    return res.json()
  },

  async completeSession(sessionId: string) {
    const res = await fetch(`${PLATFORM_URL}/api/v1/sessions/${sessionId}/complete`, {
      method: 'POST',
    })
    return res.json()
  },

  // Channels
  async listChannels() {
    const res = await fetch(`${PLATFORM_URL}/api/v1/channels`)
    return res.json()
  },

  // Clips
  async listClips(params?: {
    session_id?: string
    channel_id?: string
    status?: string
    favorite?: boolean
    limit?: number
    offset?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params?.session_id) searchParams.set('session_id', params.session_id)
    if (params?.channel_id) searchParams.set('channel_id', params.channel_id)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.favorite !== undefined) searchParams.set('favorite', String(params.favorite))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.offset) searchParams.set('offset', String(params.offset))

    const url = `${PLATFORM_URL}/api/v1/clips${searchParams.toString() ? '?' + searchParams.toString() : ''}`
    const res = await fetch(url)
    return res.json()
  },

  async getClip(clipId: string) {
    const res = await fetch(`${PLATFORM_URL}/api/v1/clips/${clipId}`)
    return res.json()
  },

  async getSessionClips(sessionId: string) {
    const res = await fetch(`${PLATFORM_URL}/api/v1/sessions/${sessionId}/clips`)
    return res.json()
  },

  async toggleFavorite(clipId: string) {
    const res = await fetch(`${PLATFORM_URL}/api/v1/clips/${clipId}/favorite`, {
      method: 'POST',
    })
    return res.json()
  },

  async recordWatch(clipId: string) {
    const res = await fetch(`${PLATFORM_URL}/api/v1/clips/${clipId}/watch`, {
      method: 'POST',
    })
    return res.json()
  },

  // Helper to get clip URLs
  getClipStreamUrl(clipId: string) {
    return `${PLATFORM_URL}/api/v1/clips/${clipId}/stream`
  },

  getClipThumbnailUrl(clipId: string) {
    return `${PLATFORM_URL}/api/v1/clips/${clipId}/thumbnail`
  },

  getClipDownloadUrl(clipId: string) {
    return `${PLATFORM_URL}/api/v1/clips/${clipId}/download`
  },
}

// Capture Agent API
export const captureApi = {
  async getStatus(agentUrl: string) {
    const res = await fetch(`${agentUrl}/api/v1/status`)
    return res.json()
  },

  async setConfig(agentUrl: string, config: { sessionId: string; channelId: string }) {
    const res = await fetch(`${agentUrl}/api/v1/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: config.sessionId,
        channel_id: config.channelId,
      }),
    })
    return res.json()
  },

  async startGhostClip(agentUrl: string, playId: string) {
    const res = await fetch(`${agentUrl}/api/v1/mark/in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ play_id: playId }),
    })
    return res.json()
  },

  async endGhostClip(agentUrl: string, playId: string, tags?: Record<string, unknown>) {
    const res = await fetch(`${agentUrl}/api/v1/mark/out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        play_id: playId,
        generate_clip: true,
        tags: tags || {},
      }),
    })
    return res.json()
  },

  async quickClip(agentUrl: string, durationSeconds: number, playId?: string) {
    const res = await fetch(`${agentUrl}/api/v1/clip/quick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duration_seconds: durationSeconds,
        play_id: playId || `quick-${Date.now()}`,
      }),
    })
    return res.json()
  },

  async generateClip(agentUrl: string, request: {
    startTime: number
    endTime: number
    playId: string
  }) {
    const res = await fetch(`${agentUrl}/api/v1/clip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start_time: request.startTime,
        end_time: request.endTime,
        play_id: request.playId,
      }),
    })
    return res.json()
  },
}

// WebSocket URL from environment
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'

// WebSocket event types
export type WSEventType = 'clip_created' | 'clip_ready' | 'clip_failed' | 'session_start' | 'session_end' | 'clip_segment_ready'

// WebSocket for real-time events
export class WebSocketService {
  private ws: WebSocket | null = null
  private handlers: Map<string, ((data: unknown) => void)[]> = new Map()
  private url: string = WS_URL
  private shouldReconnect: boolean = false

  connect(url?: string) {
    if (url) this.url = url
    this.shouldReconnect = true

    console.log('[WS] Connecting to', this.url)
    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      console.log('[WS] Connected')
    }

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        console.log('[WS] Received:', message.type, message.payload)
        const handlers = this.handlers.get(message.type) || []
        handlers.forEach(handler => handler(message.payload))
      } catch (err) {
        console.error('[WS] Failed to parse message:', err)
      }
    }

    this.ws.onclose = () => {
      console.log('[WS] Disconnected')
      if (this.shouldReconnect) {
        // Reconnect after 3 seconds
        setTimeout(() => this.connect(), 3000)
      }
    }

    this.ws.onerror = (err) => {
      console.error('[WS] Error:', err)
    }
  }

  disconnect() {
    this.shouldReconnect = false
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  on(eventType: WSEventType | string, handler: (data: unknown) => void) {
    const handlers = this.handlers.get(eventType) || []
    handlers.push(handler)
    this.handlers.set(eventType, handlers)
  }

  off(eventType: string, handler: (data: unknown) => void) {
    const handlers = this.handlers.get(eventType) || []
    this.handlers.set(eventType, handlers.filter(h => h !== handler))
  }
}

export const wsService = new WebSocketService()
