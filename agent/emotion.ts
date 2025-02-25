import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const PORT = 5000;

// Store active WebSocket connections
const clients: WebSocket[] = [];

// Function to start the WebSocket server
export function startEmotionServer(handleEmotion: (emotion: string) => void) {
  serve(async (req) => {
    // Ensure only WebSocket connections are accepted
    if (req.headers.get("upgrade") !== "websocket") {
      return new Response("WebSocket only", { status: 400 });
    }

    // Upgrade HTTP to WebSocket connection
    const { socket, response } = Deno.upgradeWebSocket(req);
    console.log("Emotion client connected");

    // Store the client connection
    clients.push(socket);

    // Handle incoming messages (emotions)
    socket.onmessage = (event) => {
      const emotion = event.data;
      handleEmotion(emotion); // Pass emotion to the provided handler
    };

    // Handle client disconnection
    socket.onclose = () => {
      console.log("Emotion client disconnected");
      const index = clients.indexOf(socket);
      if (index !== -1) {
        clients.splice(index, 1);
      }
    };

    return response;
  }, { port: PORT });
}
