export async function sendMovementCommand(direction: string, value: number) {
  try {
    const response = await fetch('http://localhost:8000/api/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ direction, value }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending movement command:', error);
    throw error;
  }
} 