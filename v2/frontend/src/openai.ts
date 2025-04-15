import OpenAI from 'openai';
import { OpenAIRealtimeWebSocket } from 'openai/beta/realtime/websocket';
import { getSystemInstructions } from './instructions.ts';

/**
 * Initializes the custom AI client, sets up event handlers, etc.
 * (Replace with the real code from your openai.ts)
 */
export default async function initializeOpenAI(variant: number): Promise<OpenAIRealtimeWebSocket> {
  console.log("Connecting to OpenAI WebSocket...");

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const rt = new OpenAIRealtimeWebSocket({ model: 'gpt-4o-realtime-preview-2024-12-17' }, client);

  await new Promise<void>((resolve) => rt.socket.addEventListener('open', () => {
    console.log('Connection opened!');
    rt.send({
      type: 'session.update',
      session: {
        modalities: ['text'],
        model: 'gpt-4o-realtime-preview',
        instructions: getSystemInstructions(variant),
      },
    });

    resolve();
  }));

  return rt;
}
