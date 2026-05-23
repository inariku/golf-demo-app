export type Recorder = {
  start(): void
  stop(): Promise<{ blob: Blob; mimeType: string; durationMs: number }>
}

const PREFERRED_MIMES = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
  'video/mp4',
]

function pickMime(): string {
  for (const m of PREFERRED_MIMES) {
    if (MediaRecorder.isTypeSupported(m)) return m
  }
  return ''
}

export function createRecorder(stream: MediaStream): Recorder {
  const mimeType = pickMime()
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
  const chunks: Blob[] = []
  let startedAt = 0

  recorder.addEventListener('dataavailable', (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  })

  return {
    start() {
      chunks.length = 0
      startedAt = performance.now()
      recorder.start(1000)
    },
    stop() {
      return new Promise((resolve) => {
        recorder.addEventListener(
          'stop',
          () => {
            const finalMime = recorder.mimeType || mimeType || 'video/webm'
            const blob = new Blob(chunks, { type: finalMime })
            resolve({ blob, mimeType: finalMime, durationMs: performance.now() - startedAt })
          },
          { once: true },
        )
        recorder.stop()
      })
    },
  }
}
