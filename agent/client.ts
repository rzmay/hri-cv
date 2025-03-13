import { OpenAIRealtimeWebSocket } from 'npm:openai/beta/realtime/websocket';
import { FormAgent } from "./formAgent.ts";

const encoder = new TextEncoder();

function getInput(): string {
  let input: string | null = "";
  while (!input?.trim()) {
    input = prompt("You: ");
  }

  return input
}

export function startChat(client: OpenAIRealtimeWebSocket, agent: FormAgent, onComplete: () => void) {
  // Always write out what the agent is saying
  client.on('response.text.delta', (event) => Deno.stdout.writeSync(encoder.encode(event.delta)));
  client.on('response.done', () => {
    // New line
    console.log();

    if (agent.formIsComplete()) onComplete();

    // Get and send next message
    const input = getInput();

    client.send({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: input }],
      },
    });

    client.send({ type: 'response.create' });
  });

  // Start messaging!
  client.send({ type: 'response.create' });
}

