import { OpenAIRealtimeWebSocket } from 'npm:openai/beta/realtime/websocket';
import { readLines } from "https://deno.land/std@0.197.0/io/mod.ts";
import Stats from './stats.ts';
import form from './form.ts';

async function prompt(promptText: string) {
  const text = new TextEncoder().encode(`${promptText} `);
  Deno.stdout.writeSync(text);
  const { value: input } = await readLines(Deno.stdin).next();
  return input;
}

async function getInput() {
  const input = await prompt("You: ");

  // Recurse until correct
  if (!input?.trim()) return getInput();

  return input
}

export function startChat(client: OpenAIRealtimeWebSocket, onComplete: () => void) {
  let index = 0;

  // Start form
  Stats.singleton.startForm();

  // Always write out what the agent is saying
  client.on('response.text.delta', (event) => Deno.stdout.writeSync(new TextEncoder().encode(event.delta)));
  client.on('response.done', async () => {
    // New line
    console.log();

    // Get and send next message
    const input = await getInput();

    // Track
    Stats.singleton.onUserMessage(input);

    // Move to the next step
    index += 1;
    if (index >= form.length) return onComplete();

    // Send message
    client.send({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: input }],
      },
    });

    // Send next step
    client.send({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "system",
        content: [{ type: "input_text", text: `Give the user the following question: ${form[index]}` }],
      }
    })

    client.send({ type: 'response.create' });
  });

  // Send first step
  client.send({
    type: "conversation.item.create",
    item: {
      type: "message",
      role: "system",
      content: [{ type: "input_text", text: `Give the user the following question: ${form[index]}` }],
    }
  })

  // Start messaging!
  client.send({ type: 'response.create' });
}

