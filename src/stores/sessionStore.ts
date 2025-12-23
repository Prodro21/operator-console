import { create } from 'zustand'
import type { Session, Channel, CaptureAgent, MarkState, PlayTag, Clip } from '../types'
import { captureApi, platformApi, wsService } from '../services/api'

interface SessionState {
  // Session
  session: Session | null
  setSession: (session: Session | null) => void
  createSession: (name: string, type: string) => Promise<void>
  startSession: () => Promise<void>
  completeSession: () => Promise<void>

  // Channels (cameras)
  channels: Channel[]
  setChannels: (channels: Channel[]) => void
  loadChannels: () => Promise<void>

  // Capture agents
  captureAgents: CaptureAgent[]
  setCaptureAgents: (agents: CaptureAgent[]) => void
  addCaptureAgent: (agent: CaptureAgent) => void
  removeCaptureAgent: (agentId: string) => void
  configureAgents: () => Promise<void>

  // Marking state
  markState: MarkState
  startMark: () => Promise<void>
  endMark: (tag?: PlayTag) => Promise<void>
  cancelMark: () => void

  // Quick clip
  quickClip: (durationSeconds?: number) => Promise<void>

  // Current play tag being built
  currentTag: PlayTag
  setPlayType: (type: string) => void
  setResult: (result: string) => void

  // Recent clips from WebSocket events
  recentClips: Clip[]
  addClip: (clip: Clip) => void
  clearClips: () => void

  // Error state
  lastError: string | null
  clearError: () => void
}

const generatePlayId = () => `play-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const useSessionStore = create<SessionState>((set, get) => ({
  // Session
  session: null,
  setSession: (session) => set({ session }),

  createSession: async (name: string, type: string) => {
    try {
      const session = await platformApi.createSession({ name, type })
      set({ session, lastError: null })
    } catch (error) {
      set({ lastError: `Failed to create session: ${error}` })
    }
  },

  startSession: async () => {
    const { session, configureAgents } = get()
    if (!session) return

    try {
      const updated = await platformApi.startSession(session.id)
      set({ session: updated, lastError: null })
      // Configure all capture agents with session info
      await configureAgents()
    } catch (error) {
      set({ lastError: `Failed to start session: ${error}` })
    }
  },

  completeSession: async () => {
    const { session } = get()
    if (!session) return

    try {
      const updated = await platformApi.completeSession(session.id)
      set({ session: updated, lastError: null })
    } catch (error) {
      set({ lastError: `Failed to complete session: ${error}` })
    }
  },

  // Channels
  channels: [],
  setChannels: (channels) => set({ channels }),

  loadChannels: async () => {
    try {
      const channels = await platformApi.listChannels()
      set({ channels, lastError: null })
    } catch (error) {
      set({ lastError: `Failed to load channels: ${error}` })
    }
  },

  // Capture agents
  captureAgents: [],
  setCaptureAgents: (captureAgents) => set({ captureAgents }),

  addCaptureAgent: (agent: CaptureAgent) => {
    set((state) => ({
      captureAgents: [...state.captureAgents, agent],
    }))
  },

  removeCaptureAgent: (agentId: string) => {
    set((state) => ({
      captureAgents: state.captureAgents.filter((a) => a.id !== agentId),
    }))
  },

  configureAgents: async () => {
    const { session, captureAgents } = get()
    if (!session) return

    const results = await Promise.allSettled(
      captureAgents.map((agent) =>
        captureApi.setConfig(agent.url, {
          sessionId: session.id,
          channelId: agent.channelId,
        })
      )
    )

    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length > 0) {
      console.error('Some agents failed to configure:', failed)
    }
  },

  // Marking state
  markState: {
    playId: null,
    markInTime: null,
    isMarking: false,
  },

  startMark: async () => {
    const playId = generatePlayId()
    const now = Date.now()

    set({
      markState: {
        playId,
        markInTime: now,
        isMarking: true,
      },
      currentTag: {},
      lastError: null,
    })

    // Send StartGhostClip to all capture agents
    const { captureAgents } = get()
    const results = await Promise.allSettled(
      captureAgents.map((agent) => {
        console.log(`[${agent.id}] Starting ghost clip:`, playId)
        return captureApi.startGhostClip(agent.url, playId)
      })
    )

    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length > 0) {
      console.error('Some agents failed to start ghost clip:', failed)
    }
  },

  endMark: async (tag) => {
    const { markState, captureAgents, currentTag } = get()
    if (!markState.isMarking || !markState.playId) return

    const finalTag = { ...currentTag, ...tag }

    // Reset state immediately for responsive UI
    set({
      markState: {
        playId: null,
        markInTime: null,
        isMarking: false,
      },
      currentTag: {},
    })

    // Send EndGhostClip to all capture agents with tags
    const results = await Promise.allSettled(
      captureAgents.map((agent) => {
        console.log(`[${agent.id}] Ending ghost clip:`, markState.playId, finalTag)
        return captureApi.endGhostClip(agent.url, markState.playId!, finalTag)
      })
    )

    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length > 0) {
      console.error('Some agents failed to end ghost clip:', failed)
      set({ lastError: 'Some capture agents failed to generate clip' })
    }
  },

  cancelMark: () => {
    // Note: We don't send cancel to agents - ghost clips will just expire
    set({
      markState: {
        playId: null,
        markInTime: null,
        isMarking: false,
      },
      currentTag: {},
    })
  },

  // Quick clip - grab last N seconds without marking
  quickClip: async (durationSeconds = 15) => {
    const { captureAgents } = get()

    const results = await Promise.allSettled(
      captureAgents.map((agent) => {
        console.log(`[${agent.id}] Quick clip:`, durationSeconds, 'seconds')
        return captureApi.quickClip(agent.url, durationSeconds)
      })
    )

    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length > 0) {
      console.error('Some agents failed quick clip:', failed)
      set({ lastError: 'Some capture agents failed quick clip' })
    }
  },

  // Tag building
  currentTag: {},
  setPlayType: (playType) =>
    set((state) => ({
      currentTag: { ...state.currentTag, playType },
    })),
  setResult: (result) =>
    set((state) => ({
      currentTag: { ...state.currentTag, result },
    })),

  // Recent clips from WebSocket
  recentClips: [],
  addClip: (clip) =>
    set((state) => ({
      recentClips: [clip, ...state.recentClips].slice(0, 50), // Keep last 50
    })),
  clearClips: () => set({ recentClips: [] }),

  // Error state
  lastError: null,
  clearError: () => set({ lastError: null }),
}))

// WebSocket event handlers - set up outside store to avoid recreation
let wsInitialized = false

export const initializeWebSocket = () => {
  if (wsInitialized) return

  wsService.on('clip_ready', (data) => {
    console.log('[WS] Clip ready:', data)
    const clip = data as import('../types').Clip
    useSessionStore.getState().addClip(clip)
  })

  wsService.on('clip_created', (data) => {
    console.log('[WS] Clip created:', data)
  })

  wsService.on('clip_failed', (data) => {
    console.log('[WS] Clip failed:', data)
    useSessionStore.setState({ lastError: `Clip generation failed: ${JSON.stringify(data)}` })
  })

  wsInitialized = true
}

export const connectWebSocket = (url?: string) => {
  initializeWebSocket()
  wsService.connect(url)
}

export const disconnectWebSocket = () => {
  wsService.disconnect()
}
