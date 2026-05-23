import { AlertCircle } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type Props = { message: string }

export function ErrorBanner({ message }: Props) {
  return (
    <Alert variant="destructive" className="rounded-none border-x-0">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>エラー</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
