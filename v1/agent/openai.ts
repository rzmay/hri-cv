import OpenAI from 'npm:openai';
import { OpenAIRealtimeWebSocket } from 'npm:openai/beta/realtime/websocket';

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

if (!OPENAI_API_KEY) {
  console.error("Missing OpenAI API key. Set OPENAI_API_KEY in your environment.");
  Deno.exit(1);
}

// TODO: Establish OpenAI WebSocket connection
export async function connect(instructions: string): Promise<OpenAIRealtimeWebSocket> {
  console.log("Connecting to OpenAI WebSocket...");

  const client = new OpenAI({ apiKey: OPENAI_API_KEY });
  const rt = new OpenAIRealtimeWebSocket({ model: 'gpt-4o-realtime-preview-2024-12-17' }, client);

  await new Promise<void>((resolve) => rt.socket.addEventListener('open', () => {
    console.log('Connection opened!');
    rt.send({
      type: 'session.update',
      session: {
        modalities: ['text'],
        model: 'gpt-4o-realtime-preview',
        instructions,
      },
    });

    resolve();
  }));

  return rt;
}
