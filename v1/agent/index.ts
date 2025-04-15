import "jsr:@std/dotenv/load";

import { startEmotionServer } from "./emotion.ts";
import { connect } from "./openai.ts";
import { getInstructions } from "./instructions.ts";
import { OpenAIRealtimeWebSocket } from 'npm:openai/beta/realtime/websocket';
import { startChat } from "./client.ts";
import Stats from "./stats.ts";

enum UpdateMethod { SessionUpdate, SystemMessage }
const UPDATE_METHOD: UpdateMethod = UpdateMethod.SystemMessage

// Track emotion
let lastEmotion: string | null = null;

// Function to handle incoming emotions
function handleEmotion(variant: number, client?: OpenAIRealtimeWebSocket) {
    return (emotion: string, confidence: number) => {
        if (emotion !== lastEmotion) {
            lastEmotion = emotion

            // Update tracking
            Stats.singleton.onEmotionChange(emotion);

            // Variant 0: provide no emotion
            if (variant == 0) return;

            // Update system
            if (UPDATE_METHOD == UpdateMethod.SessionUpdate) {
                const newInstructions = getInstructions(variant);

                client?.send({
                    type: "session.update",
                    session: { instructions: newInstructions },
                });

                // console.log(`Sent updated instructions ${newInstructions}`);
            } else if (UPDATE_METHOD == UpdateMethod.SystemMessage) {
                const systemMessage = `Detected emotion ${emotion} with confidence ${confidence}.`;

                client?.send({
                    type: "conversation.item.create",
                    item: {
                        type: "message",
                        role: "system",
                        content: [{ type: "input_text", text: systemMessage }],
                      },
                })

                // console.log(`Sent message ${systemMessage}`);
            }
        }
    }
}

async function main() {
    const trialID = crypto.randomUUID();

    // Prompt for variant
    const variant = Number(prompt("Enter the response variant number (0 - 4)"));

    const initialInstructions = getInstructions(variant);

    // Connect to OpenAI realtime
    const client = await connect(initialInstructions);

    // Start processing emotions
    await startEmotionServer(handleEmotion(variant, client));

    // Start client loop
    await new Promise<void>((resolve) => startChat(client, () => resolve()))

    client.close();

    Stats.singleton.endForm();

    console.log("Trial complete, saving results...");

    // Write stats to output file
    await Deno.writeTextFile(`./trial_data/${trialID}-v${variant}.json`, JSON.stringify({
        variant,
        initialInstructions,
        ...(Stats.singleton.getStats()),
    }, null, 2));

    Deno.exit();
}

main();
