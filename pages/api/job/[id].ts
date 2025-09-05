import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query as { id: string }
  
  if (!id) {
    return res.status(400).json({ error: 'Job ID is required' })
  }

  try {
    // Validate environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return res.status(500).json({ 
        error: 'Supabase environment variables not set',
        detail: 'SUPABASE_URL and SUPABASE_ANON_KEY are required'
      })
    }

    const url = `${process.env.SUPABASE_URL}/rest/v1/jobs?id=eq.${id}&select=*`
    
    const response = await fetch(url, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY as string,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('Supabase read failed:', text)
      return res.status(500).json({ 
        error: 'supabase read failed', 
        detail: text,
        status: response.status
      })
    }

    const jobs = await response.json()
    
    // Return the first job or empty object if not found
    const job = jobs?.[0] || { 
      id, 
      phase: 'not_found', 
      progress: 0,
      message: 'Job not found in database'
    }

    return res.status(200).json(job)
    
  } catch (error: any) {
    console.error('Job read error:', error)
    return res.status(500).json({ 
      error: 'job read error', 
      detail: error?.message || 'Unknown error occurred'
    })
  }
}
