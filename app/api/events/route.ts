export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { addClient, removeClient } from '@/lib/sse'

export async function GET() {
  let controller: ReadableStreamDefaultController<string>

  const stream = new ReadableStream<string>({
    start(ctrl) {
      controller = ctrl
      addClient(ctrl)
      ctrl.enqueue(': connected\n\n')
    },
    cancel() {
      removeClient(controller)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
