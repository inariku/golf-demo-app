import { useEffect, useRef } from 'react'

import { detect, drawPose } from '@/lib/pose'
import type { PoseFrame } from '@/types'

type Props = {
  videoRef: React.RefObject<HTMLVideoElement>
  onFrame: (frame: PoseFrame | null) => void
}

export function PoseOverlay({ videoRef, onFrame }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const onFrameRef = useRef(onFrame)

  useEffect(() => {
    onFrameRef.current = onFrame
  }, [onFrame])

  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const loop = () => {
      if (video.videoWidth && video.videoHeight) {
        if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth
        if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight
        const frame = detect(video, performance.now())
        if (frame) {
          drawPose(ctx, frame, canvas.width, canvas.height)
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
        onFrameRef.current(frame)
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [videoRef])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100"
    />
  )
}
