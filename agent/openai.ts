const OPENAI_WS_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

if (!OPENAI_API_KEY) {
  console.error("Missing OpenAI API key. Set OPENAI_API_KEY in your environment.");
  Deno.exit(1);
}

// TODO: Establish OpenAI WebSocket connection
export async function connectToOpenAI(): Promise<WebSocket> {
  console.log("Connecting to OpenAI WebSocket...");

  return new WebSocket(OPENAI_WS_URL)
}
