import "jsr:@std/dotenv/load";

import { startEmotionServer } from "./emotion.ts";
import { connect } from "./openai.ts";
import { getInstructions } from "./instructions.ts";
import { OpenAIRealtimeWebSocket } from 'npm:openai/beta/realtime/websocket';
import { FormAgent } from "./formAgent.ts";
import { startChat } from "./client.ts";

enum UpdateMethod { SessionUpdate, SystemMessage }
const UPDATE_METHOD: UpdateMethod = UpdateMethod.SystemMessage

// Track emotion
let lastEmotion: string | null = null;

// Function to handle incoming emotions
function handleEmotion(variant: number, agent: FormAgent, client?: OpenAIRealtimeWebSocket) {
    return (emotion: string) => {
        if (emotion !== lastEmotion) {
            console.log(`Received new emotion ${emotion}`)
            lastEmotion = emotion

            // Update system
            if (UPDATE_METHOD == UpdateMethod.SessionUpdate) {
                const newInstructions = getInstructions(variant, agent, emotion);

                client?.send({
                    type: "session.update",
                    session: { instructions: newInstructions },
                });

                console.log(`Sent updated instructions ${newInstructions}`);
            } else if (UPDATE_METHOD == UpdateMethod.SystemMessage) {
                const systemMessage = `The user is now feeling ${emotion}.`;

                client?.send({
                    type: "conversation.item.create",
                    item: {
                        type: "message",
                        role: "system",
                        content: [{ type: "input_text", text: systemMessage }],
                      },
                })

                console.log(`Sent message ${systemMessage}`);
            }
        }
    }
}

async function main() {
    const trialID = 'placeholder';

    // Prompt for variant
    const variant = Number(prompt("Enter the response variant number (0 - 4)"));

    // Initialize form data
    const agent = new FormAgent();

    const initialInstructions = getInstructions(variant, agent);

    // Connect to OpenAI realtime
    const client = await connect(initialInstructions);

    // Start processing emotions
    startEmotionServer(() => handleEmotion(variant, agent, client));

    // Start client loop
    const startTime = Date.now();

    await new Promise<void>((resolve) => startChat(client, agent, () => resolve()))

    // Write stats to output file
    await Deno.writeTextFile(`./trial_data/${trialID}`, JSON.stringify({
        form: agent.getDataAndErrors(),
        millis: Date.now() - startTime
    }));
}

main();
