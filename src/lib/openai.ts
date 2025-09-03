import OpenAI from 'openai';

// OpenAI client configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a chat completion
 * @param prompt - The user's prompt
 * @param systemMessage - Optional system message
 * @returns Promise with the completion response
 */
export async function chat(prompt: string, systemMessage?: string) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const messages = [];
    if (systemMessage) {
      messages.push({ role: 'system', content: systemMessage });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return {
      success: true,
      content: response.choices[0]?.message?.content || '',
      message: 'Chat completion generated successfully',
    };
  } catch (error) {
    console.error('OpenAI chat error:', error);
    return {
      success: false,
      error: 'Failed to generate chat completion',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate text completion
 * @param prompt - The text prompt
 * @returns Promise with the completion response
 */
export async function complete(prompt: string) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await openai.completions.create({
      model: 'text-davinci-003',
      prompt,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return {
      success: true,
      content: response.choices[0]?.text || '',
      message: 'Text completion generated successfully',
    };
  } catch (error) {
    console.error('OpenAI completion error:', error);
    return {
      success: false,
      error: 'Failed to generate text completion',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if OpenAI is configured
 * @returns Boolean indicating if OpenAI is configured
 */
export function isConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

// Export the client instance
export default openai;
