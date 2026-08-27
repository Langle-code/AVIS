const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN!
const GRAPH_URL = 'https://graph.facebook.com/v20.0/me/messages'

export async function sendMessage(recipientId: string, text: string): Promise<void> {
  const res = await fetch(`${GRAPH_URL}?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    console.error('Messenger send error:', err)
    throw new Error(`Messenger API error: ${res.status}`)
  }
}

export async function sendQuickReply(
  recipientId: string,
  text: string,
  options: { title: string; payload: string }[]
): Promise<void> {
  const quick_replies = options.map(o => ({
    content_type: 'text',
    title: o.title,
    payload: o.payload,
  }))

  const res = await fetch(`${GRAPH_URL}?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text, quick_replies },
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    console.error('Messenger quick reply error:', err)
    throw new Error(`Messenger API error: ${res.status}`)
  }
}
