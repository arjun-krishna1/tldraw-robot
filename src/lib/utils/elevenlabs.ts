export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  try {
    console.log('Making text-to-speech API request to backend')
    const response = await fetch('http://localhost:8000/api/speak', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    console.log('Received response from backend, processing audio data')
    const data = await response.json();
    
    // Convert base64 to ArrayBuffer
    console.log('Converting audio data to ArrayBuffer')
    const binaryString = atob(data.audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    console.log('Successfully converted audio data to ArrayBuffer')
    
    return bytes.buffer;
  } catch (error) {
    console.error('Error in text-to-speech process:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
} 