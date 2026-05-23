import type { Judgement, PoseFrame } from '@/types'

export function judge(frame: PoseFrame | null): Judgement {
  if (!frame) {
    return { score: 0, comment: '姿勢が検出できません' }
  }

  const visibilities = frame.landmarks.map((l) => l.visibility)
  const avg = visibilities.reduce((a, b) => a + b, 0) / Math.max(1, visibilities.length)

  if (avg > 0.85) return { score: 5, comment: 'ナイススタンス!' }
  if (avg > 0.7) return { score: 4, comment: '良い姿勢' }
  if (avg > 0.5) return { score: 3, comment: '姿勢チェック中' }
  if (avg > 0.3) return { score: 2, comment: 'カメラに体を映してください' }
  return { score: 1, comment: '姿勢が見えません' }
}

// TODO(workshop): スイング軌跡や肩の回転角を使った本格判定に拡張する
