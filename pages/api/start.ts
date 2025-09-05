import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = (req.body || {}) as { userId?: string }
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' })
    }

    const jobId = crypto.randomUUID()
    
    // Validate environment variables
    if (!process.env.N8N_START_URL) {
      return res.status(500).json({ error: 'N8N_START_URL environment variable not set' })
    }

    const response = await fetch(process.env.N8N_START_URL as string, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, userId })
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('n8n start failed:', text)
      return res.status(500).json({ 
        error: 'n8n start failed', 
        detail: text,
        status: response.status 
      })
    }

    const data = await response.json()
    
    // Handle different possible response formats from Merge
    const connectUrl = data.connectUrl || data.connect_url || data.link_url || data.connect_token
    
    if (!connectUrl) {
      console.error('No connect URL found in n8n response:', data)
      return res.status(500).json({ 
        error: 'No connect URL received from n8n',
        detail: 'Expected connectUrl, connect_url, link_url, or connect_token in response'
      })
    }

    return res.status(200).json({ 
      jobId, 
      connectUrl
    })
    
  } catch (error: any) {
    console.error('Start error:', error)
    return res.status(500).json({ 
      error: 'start error', 
      detail: error?.message || 'Unknown error occurred'
    })
  }
}
