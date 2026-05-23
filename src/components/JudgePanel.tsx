import { useEffect, useReducer } from 'react'
import { Circle, Loader2, Square, Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { Judgement, RecordingStatus } from '@/types'

type Props = {
  judgement: Judgement
  recording: RecordingStatus
  disabled: boolean
  onStartRecording: () => void
  onStopRecording: () => void
}

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function JudgePanel({
  judgement,
  recording,
  disabled,
  onStartRecording,
  onStopRecording,
}: Props) {
  const [, tick] = useReducer((n: number) => n + 1, 0)

  useEffect(() => {
    if (recording.kind !== 'recording') return
    const id = setInterval(tick, 200)
    return () => clearInterval(id)
  }, [recording])

  const elapsed = recording.kind === 'recording' ? performance.now() - recording.startedAt : 0

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = document.activeElement
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        if (disabled) return
        if (recording.kind === 'recording') onStopRecording()
        else if (recording.kind === 'idle') onStartRecording()
      } else if (e.key === 'Escape' && recording.kind === 'recording') {
        e.preventDefault()
        onStopRecording()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [disabled, recording, onStartRecording, onStopRecording])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">判定</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={cn(
                'h-6 w-6',
                n <= judgement.score
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground/30',
              )}
            />
          ))}
          <span className="ml-2 text-sm text-muted-foreground">{judgement.score} / 5</span>
        </div>
        <p className="text-sm">{judgement.comment}</p>

        <Separator />

        {recording.kind === 'recording' ? (
          <Button
            variant="destructive"
            className="w-full"
            onClick={onStopRecording}
            aria-live="polite"
          >
            <Square className="mr-2 h-4 w-4 fill-current" />
            停止 ({formatElapsed(elapsed)})
          </Button>
        ) : recording.kind === 'finalizing' ? (
          <Button className="w-full" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            保存中…
          </Button>
        ) : (
          <Button
            variant="destructive"
            className="w-full"
            onClick={onStartRecording}
            disabled={disabled}
          >
            <Circle className="mr-2 h-4 w-4 fill-current" />
            録画開始
          </Button>
        )}
        <p className="text-center text-xs text-muted-foreground">キー: R で開始/停止</p>
      </CardContent>
    </Card>
  )
}
