import { useCallback, useEffect, useRef, useState } from 'react'
import { CameraOff, Loader2 } from 'lucide-react'

import { CameraView } from '@/components/CameraView'
import { ErrorBanner } from '@/components/ErrorBanner'
import { EmptyState } from '@/components/EmptyState'
import { HistoryList } from '@/components/HistoryList'
import { JudgePanel } from '@/components/JudgePanel'
import { startCamera, stopCamera } from '@/lib/camera'
import { judge } from '@/lib/judge'
import { initPose } from '@/lib/pose'
import { createRecorder, type Recorder } from '@/lib/recorder'
import { deleteSwing, listSwings, saveSwing } from '@/lib/storage'
import type { CameraStatus, Judgement, PoseFrame, RecordingStatus, SwingRecord } from '@/types'

const RECORDING_MAX_MS = 30_000
const RECORDING_MIN_MS = 1_000

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const recorderRef = useRef<Recorder | null>(null)
  const lastFrameRef = useRef<PoseFrame | null>(null)
  const stopTimerRef = useRef<number | null>(null)

  const [poseReady, setPoseReady] = useState(false)
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>({ kind: 'idle' })
  const [recording, setRecording] = useState<RecordingStatus>({ kind: 'idle' })
  const [judgement, setJudgement] = useState<Judgement>({ score: 0, comment: '準備中…' })
  const [records, setRecords] = useState<SwingRecord[]>([])
  const [error, setError] = useState<string | null>(null)

  // 起動時の初期化。StrictMode の二重マウントに備えて cancelled フラグで保護。
  // initPose() は lib/pose.ts 内で冪等化されているため再呼び出しても問題なし。
  useEffect(() => {
    let cancelled = false
    let acquiredStream: MediaStream | null = null

    ;(async () => {
      try {
        await initPose()
        if (cancelled) return
        setPoseReady(true)
      } catch (e) {
        console.error(e)
        if (!cancelled) setError('姿勢推定モデルの読み込みに失敗しました')
      }

      setCameraStatus({ kind: 'requesting' })
      try {
        const stream = await startCamera()
        acquiredStream = stream
        if (cancelled) {
          stopCamera(stream)
          return
        }
        setCameraStatus({ kind: 'ready', stream })
      } catch (e) {
        if (cancelled) return
        const err = e as DOMException
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraStatus({ kind: 'denied' })
        } else {
          setCameraStatus({ kind: 'error', message: err.message ?? 'カメラを起動できません' })
        }
      }

      try {
        const list = await listSwings()
        if (!cancelled) setRecords(list)
      } catch (e) {
        console.error(e)
      }
    })()

    return () => {
      cancelled = true
      if (acquiredStream) stopCamera(acquiredStream)
    }
  }, [])

  const handleFrame = useCallback((frame: PoseFrame | null) => {
    lastFrameRef.current = frame
    setJudgement(judge(frame))
  }, [])

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return
    if (stopTimerRef.current !== null) {
      clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }
    setRecording({ kind: 'finalizing' })
    try {
      const { blob, mimeType, durationMs } = await recorderRef.current.stop()
      recorderRef.current = null

      if (durationMs < RECORDING_MIN_MS) {
        setError('録画が短すぎるため保存されませんでした (最低 1 秒)')
        setRecording({ kind: 'idle' })
        return
      }

      const finalJudgement = judge(lastFrameRef.current)
      const record: SwingRecord = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        durationMs,
        videoBlob: blob,
        mimeType,
        judgement: finalJudgement,
      }
      await saveSwing(record)
      setRecords((prev) => [record, ...prev])
    } catch (e) {
      console.error(e)
      setError('録画の保存に失敗しました')
    } finally {
      setRecording({ kind: 'idle' })
    }
  }, [])

  const startRecording = useCallback(() => {
    if (cameraStatus.kind !== 'ready') return
    setError(null)
    try {
      const recorder = createRecorder(cameraStatus.stream)
      recorderRef.current = recorder
      recorder.start()
      setRecording({ kind: 'recording', startedAt: performance.now() })
      stopTimerRef.current = window.setTimeout(() => {
        void stopRecording()
      }, RECORDING_MAX_MS)
    } catch (e) {
      console.error(e)
      setError('録画を開始できません (ブラウザ非対応の可能性)')
      recorderRef.current = null
    }
  }, [cameraStatus, stopRecording])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteSwing(id)
      setRecords((prev) => prev.filter((r) => r.id !== id))
    } catch (e) {
      console.error(e)
      setError('削除に失敗しました')
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-14 items-center border-b px-6 text-lg font-semibold">
        🏌 Golf Demo App
      </header>

      {error && <ErrorBanner message={error} />}

      <main className="flex flex-1 flex-row gap-4 p-4 lg:p-6">
        <section className="flex min-w-0 flex-1 items-start">
          {cameraStatus.kind === 'ready' && poseReady ? (
            <CameraView
              stream={cameraStatus.stream}
              videoRef={videoRef}
              isRecording={recording.kind === 'recording'}
              onFrame={handleFrame}
            />
          ) : cameraStatus.kind === 'denied' ? (
            <div className="flex aspect-video w-full items-center justify-center rounded-lg border bg-muted">
              <EmptyState
                icon={CameraOff}
                title="カメラへのアクセスが拒否されました"
                description="ブラウザの設定から許可後、ページを再読込してください"
              />
            </div>
          ) : cameraStatus.kind === 'error' ? (
            <div className="flex aspect-video w-full items-center justify-center rounded-lg border bg-muted">
              <EmptyState icon={CameraOff} title="カメラエラー" description={cameraStatus.message} />
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center gap-3 rounded-lg border bg-muted text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">
                {!poseReady ? '姿勢推定モデルを読み込み中…' : 'カメラを起動しています…'}
              </span>
            </div>
          )}
        </section>

        <aside className="flex w-80 shrink-0 flex-col gap-4">
          <JudgePanel
            judgement={judgement}
            recording={recording}
            disabled={cameraStatus.kind !== 'ready' || !poseReady}
            onStartRecording={startRecording}
            onStopRecording={() => void stopRecording()}
          />
          <HistoryList records={records} onDelete={handleDelete} />
        </aside>
      </main>
    </div>
  )
}
