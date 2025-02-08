import { API_BASE_URL } from './config'

export async function sendMovementCommand(direction: string, value: number) {
  try {
    // Always use stop endpoint for stop commands
    if (direction.toLowerCase().trim() === 'stop') {
      const response = await fetch(`${API_BASE_URL}/api/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    }

    // For all other movement commands
    const response = await fetch(`${API_BASE_URL}/api/move`, {
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