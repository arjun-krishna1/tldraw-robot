import { API_BASE_URL } from './config'

export async function sendMovementCommand(direction: string, value: number) {
  try {
    // If direction is "stop", use the stop endpoint
    const endpoint = direction === "stop" ? `${API_BASE_URL}/api/stop` : `${API_BASE_URL}/api/move`;
    const body = direction === "stop" ? {} : { direction, value };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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