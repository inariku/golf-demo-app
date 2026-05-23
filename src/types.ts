export type Judgement = {
  score: number
  comment: string
}

export type SwingRecord = {
  id: string
  createdAt: number
  durationMs: number
  videoBlob: Blob
  mimeType: string
  judgement: Judgement
}

export type PoseLandmark = {
  x: number
  y: number
  z: number
  visibility: number
}

export type PoseFrame = {
  landmarks: PoseLandmark[]
}

export type CameraStatus =
  | { kind: 'idle' }
  | { kind: 'requesting' }
  | { kind: 'ready'; stream: MediaStream }
  | { kind: 'denied' }
  | { kind: 'error'; message: string }

export type RecordingStatus =
  | { kind: 'idle' }
  | { kind: 'recording'; startedAt: number }
  | { kind: 'finalizing' }
