import { API_BASE_URL } from './config'

export async function generateWithGemini(prompt: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('ARJUN LOG RESPONSE', data)
    return data.response
  } catch (error) {
    console.error('Error generating with backend:', error)
    return 'Error: Could not generate response'
  }
} 