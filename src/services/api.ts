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

  async endGhostClip(agentUrl: string, playId: string) {
    const res = await fetch(`${agentUrl}/api/v1/mark/out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ play_id: playId }),
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

// WebSocket for real-time events
export class WebSocketService {
  private ws: WebSocket | null = null
  private handlers: Map<string, ((data: unknown) => void)[]> = new Map()

  connect(url: string) {
    this.ws = new WebSocket(url)

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      const handlers = this.handlers.get(message.type) || []
      handlers.forEach(handler => handler(message.payload))
    }

    this.ws.onclose = () => {
      // Reconnect after 3 seconds
      setTimeout(() => this.connect(url), 3000)
    }
  }

  on(eventType: string, handler: (data: unknown) => void) {
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
