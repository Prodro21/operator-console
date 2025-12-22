// Session types
export interface Session {
  id: string
  name: string
  type: 'game' | 'practice' | 'scrimmage'
  status: 'scheduled' | 'live' | 'paused' | 'completed'
  opponent?: string
  createdAt: string
}

// Channel/Camera types
export interface Channel {
  id: string
  name: string
  hlsUrl: string
  status: 'active' | 'inactive' | 'error'
}

// Capture machine types
export interface CaptureAgent {
  id: string
  channelId: string
  url: string
  status: 'connected' | 'disconnected'
}

// Tagging types
export interface MarkState {
  playId: string | null
  markInTime: number | null
  isMarking: boolean
}

export interface PlayTag {
  playType?: string
  result?: string
  quarter?: number
  down?: number
  distance?: number
  yardLine?: number
}

// Ghost-clipping events
export interface ClipSegmentReady {
  playId: string
  channelId: string
  segmentUrl: string
  sequence: number
  timestamp: number
  isFinal: boolean
}
