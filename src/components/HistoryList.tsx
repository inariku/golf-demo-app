import { Camera, Trash2 } from 'lucide-react'

import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { SwingRecord } from '@/types'

type Props = {
  records: SwingRecord[]
  onDelete: (id: string) => void
}

function formatDate(ms: number) {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function HistoryList({ records, onDelete }: Props) {
  return (
    <Card className="flex flex-1 flex-col overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">履歴</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        {records.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="まだスイングが記録されていません"
            description="録画ボタンで最初のスイングを記録しましょう"
          />
        ) : (
          <ScrollArea className="h-full">
            <ul className="divide-y">
              {records.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start justify-between gap-2 px-6 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{formatDate(r.createdAt)}</p>
                    <p className="text-xs text-muted-foreground">
                      ★{r.judgement.score} ・ {(r.durationMs / 1000).toFixed(1)}秒
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.judgement.comment}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    onClick={() => onDelete(r.id)}
                    aria-label="削除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
