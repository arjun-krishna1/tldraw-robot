import { GoogleGenerativeAI } from '@google/generative-ai'

// In Next.js, environment variables prefixed with NEXT_PUBLIC_ are available in the browser
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY
if (!API_KEY) {
  throw new Error('NEXT_PUBLIC_GEMINI_API_KEY environment variable is not set')
}

const genAI = new GoogleGenerativeAI(API_KEY)

export async function generateWithGemini(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (error) {
    console.error('Error generating with Gemini:', error)
    return 'Error: Could not generate response'
  }
} 