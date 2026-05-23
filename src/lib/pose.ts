import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'

import type { PoseFrame } from '@/types'

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

let landmarker: PoseLandmarker | null = null
let initPromise: Promise<void> | null = null

export function initPose(): Promise<void> {
  if (landmarker) return Promise.resolve()
  if (initPromise) return initPromise
  initPromise = (async () => {
    const fileset = await FilesetResolver.forVisionTasks(WASM_URL)
    landmarker = await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numPoses: 1,
    })
  })()
  return initPromise
}

export function detect(video: HTMLVideoElement, timeMs: number): PoseFrame | null {
  if (!landmarker) return null
  if (video.readyState < 2) return null
  const result = landmarker.detectForVideo(video, timeMs)
  const landmarks = result.landmarks[0]
  if (!landmarks) return null
  return {
    landmarks: landmarks.map((l) => ({
      x: l.x,
      y: l.y,
      z: l.z,
      visibility: l.visibility ?? 0,
    })),
  }
}

// 主要関節の接続定義(コードを短く保つため最小限)
const CONNECTIONS: [number, number][] = [
  [11, 12], // 肩
  [11, 13],
  [13, 15], // 左腕
  [12, 14],
  [14, 16], // 右腕
  [11, 23],
  [12, 24], // 体幹
  [23, 24], // 腰
  [23, 25],
  [25, 27], // 左脚
  [24, 26],
  [26, 28], // 右脚
]

export function drawPose(
  ctx: CanvasRenderingContext2D,
  frame: PoseFrame,
  w: number,
  h: number,
): void {
  ctx.clearRect(0, 0, w, h)
  ctx.lineWidth = 3
  ctx.strokeStyle = '#22c55e'
  ctx.fillStyle = '#22c55e'

  for (const [a, b] of CONNECTIONS) {
    const la = frame.landmarks[a]
    const lb = frame.landmarks[b]
    if (!la || !lb) continue
    ctx.beginPath()
    ctx.moveTo(la.x * w, la.y * h)
    ctx.lineTo(lb.x * w, lb.y * h)
    ctx.stroke()
  }

  for (const l of frame.landmarks) {
    ctx.beginPath()
    ctx.arc(l.x * w, l.y * h, 4, 0, Math.PI * 2)
    ctx.fill()
  }
}
