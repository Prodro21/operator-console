import { create } from 'zustand'
import type { Session, Channel, CaptureAgent, MarkState, PlayTag } from '../types'

interface SessionState {
  // Session
  session: Session | null
  setSession: (session: Session | null) => void

  // Channels (cameras)
  channels: Channel[]
  setChannels: (channels: Channel[]) => void

  // Capture agents
  captureAgents: CaptureAgent[]
  setCaptureAgents: (agents: CaptureAgent[]) => void

  // Marking state
  markState: MarkState
  startMark: () => void
  endMark: (tag?: PlayTag) => void
  cancelMark: () => void

  // Current play tag being built
  currentTag: PlayTag
  setPlayType: (type: string) => void
  setResult: (result: string) => void
}

const generatePlayId = () => `play-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const useSessionStore = create<SessionState>((set, get) => ({
  // Session
  session: null,
  setSession: (session) => set({ session }),

  // Channels
  channels: [],
  setChannels: (channels) => set({ channels }),

  // Capture agents
  captureAgents: [],
  setCaptureAgents: (captureAgents) => set({ captureAgents }),

  // Marking state
  markState: {
    playId: null,
    markInTime: null,
    isMarking: false,
  },

  startMark: () => {
    const playId = generatePlayId()
    const now = Date.now()

    set({
      markState: {
        playId,
        markInTime: now,
        isMarking: true,
      },
      currentTag: {},
    })

    // TODO: Send StartGhostClip to all capture agents
    const { captureAgents } = get()
    captureAgents.forEach(agent => {
      console.log(`Sending StartGhostClip to ${agent.id}:`, playId)
      // api.startGhostClip(agent.url, playId)
    })
  },

  endMark: (tag) => {
    const { markState, captureAgents, currentTag } = get()
    if (!markState.isMarking) return

    const finalTag = { ...currentTag, ...tag }

    // TODO: Send EndGhostClip to all capture agents
    captureAgents.forEach(agent => {
      console.log(`Sending EndGhostClip to ${agent.id}:`, markState.playId, finalTag)
      // api.endGhostClip(agent.url, markState.playId, finalTag)
    })

    set({
      markState: {
        playId: null,
        markInTime: null,
        isMarking: false,
      },
      currentTag: {},
    })
  },

  cancelMark: () => {
    set({
      markState: {
        playId: null,
        markInTime: null,
        isMarking: false,
      },
      currentTag: {},
    })
  },

  // Tag building
  currentTag: {},
  setPlayType: (playType) => set((state) => ({
    currentTag: { ...state.currentTag, playType }
  })),
  setResult: (result) => set((state) => ({
    currentTag: { ...state.currentTag, result }
  })),
}))
