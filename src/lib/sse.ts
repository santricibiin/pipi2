import { ServerResponse } from 'http'

type Client = {
  controller: ReadableStreamDefaultController
  channel: string
}

const clients = new Set<Client>()
const runningChannels = new Set<string>()

export function getChannel(userId: number | null, role: string): string {
  if (role === 'admin' || role === 'open' || !userId) return 'admin'
  return `user-${userId}`
}

export function isRunning(channel: string): boolean {
  return runningChannels.has(channel)
}

export function setRunning(channel: string, running: boolean): void {
  if (running) runningChannels.add(channel)
  else runningChannels.delete(channel)
  broadcastEvent(channel, 'status', { running })
}

export function broadcast(channel: string, line: string): void {
  console.log(`[${channel}] ${line}`)
  const payload = `data: ${JSON.stringify(line)}\n\n`
  for (const client of clients) {
    if (client.channel === channel) {
      try { client.controller.enqueue(new TextEncoder().encode(payload)) } catch {}
    }
  }
}

export function broadcastEvent(channel: string, event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const client of clients) {
    if (client.channel === channel) {
      try { client.controller.enqueue(new TextEncoder().encode(payload)) } catch {}
    }
  }
}

export function createSSEStream(channel: string): ReadableStream {
  let client: Client

  return new ReadableStream({
    start(controller) {
      client = { controller, channel }
      clients.add(client)

      const init = `event: status\ndata: ${JSON.stringify({ running: runningChannels.has(channel) })}\n\nretry: 3000\n\n`
      controller.enqueue(new TextEncoder().encode(init))
    },
    cancel() {
      clients.delete(client)
    },
  })
}
