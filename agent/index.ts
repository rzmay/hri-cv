import "jsr:@std/dotenv/load";

import { startEmotionServer } from "./emotion.ts";
import { connectToOpenAI } from "./openai.ts";
import { getUpdatedInstructions } from "./instructions.ts";
import { startChat } from "./client.ts";

// Track emotion
let lastEmotion: string | null = null;

// Function to handle incoming emotions
function handleEmotion(variant: number, formData: object, openAISocket?: WebSocket) {
    return (emotion: string) => {
        if (emotion !== lastEmotion) {
            console.log(`Received new emotion ${emotion}`)
            lastEmotion = emotion

            const newInstructions = getUpdatedInstructions(variant, formData, emotion);

            openAISocket?.send(JSON.stringify({
                event: "session.update",
                data: { instructions: newInstructions }
            }));
        }
    }
}

async function main() {
    // Initialize form data
    const formData = {
        name: {
            value: "UNSPECIFIED",
            errors: [],
        }
    }

    // Prompt for variant
    const variant = Number(prompt("Enter the response variant number (0 - 4)"));

    // TODO: Connect to OpenAI WebSocket
    // const openAISocket = await connectToOpenAI();

    startEmotionServer(handleEmotion(variant, formData));

    // TODO: Start client loop
}

main();
