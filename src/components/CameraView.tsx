import { useEffect } from 'react'

import { PoseOverlay } from '@/components/PoseOverlay'
import { cn } from '@/lib/utils'
import type { PoseFrame } from '@/types'

type Props = {
  stream: MediaStream
  videoRef: React.RefObject<HTMLVideoElement>
  isRecording: boolean
  onFrame: (frame: PoseFrame | null) => void
}

export function CameraView({ stream, videoRef, isRecording, onFrame }: Props) {
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.srcObject = stream
    return () => {
      v.srcObject = null
    }
  }, [stream, videoRef])

  return (
    <div
      className={cn(
        'relative aspect-video w-full overflow-hidden rounded-lg bg-black ring-offset-background transition-shadow',
        isRecording && 'ring-4 ring-destructive',
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full -scale-x-100 object-cover"
      />
      <PoseOverlay videoRef={videoRef} onFrame={onFrame} />
    </div>
  )
}
