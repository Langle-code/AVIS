export async function extractFromUrl(url: string): Promise<{ text: string; type: 'youtube' | 'pdf' | 'text'; title: string }> {
  if (isYouTubeUrl(url)) {
    return extractYouTube(url)
  }
  if (url.endsWith('.pdf') || url.includes('drive.google.com')) {
    return extractPdf(url)
  }
  return extractWebPage(url)
}

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com/watch') || url.includes('youtu.be/')
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /embed\/([^?]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

async function extractYouTube(url: string): Promise<{ text: string; type: 'youtube'; title: string }> {
  const videoId = extractVideoId(url)
  if (!videoId) throw new Error('Could not extract YouTube video ID')
  const { YoutubeTranscript } = await import('youtube-transcript')
  const transcript = await YoutubeTranscript.fetchTranscript(videoId)
  const text = transcript.map((t: any) => t.text).join(' ')
  return {
    text,
    type: 'youtube',
    title: `YouTube Video (${videoId})`,
  }
}

async function extractPdf(url: string): Promise<{ text: string; type: 'pdf'; title: string }> {
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  const { extractText } = await import('unpdf')
  const { text } = await extractText(new Uint8Array(buffer), { mergePages: true })
  return {
    text,
    type: 'pdf',
    title: url.split('/').pop() || 'Document',
  }
}

async function extractWebPage(url: string): Promise<{ text: string; type: 'text'; title: string }> {
  const response = await fetch(url)
  const html = await response.text()
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return {
    text,
    type: 'text',
    title: titleMatch ? titleMatch[1].trim() : url,
  }
}

export function chunkText(text: string, chunkSize = 600, overlap = 100): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  let i = 0
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.trim().length > 50) chunks.push(chunk)
    i += chunkSize - overlap
  }
  return chunks
}
