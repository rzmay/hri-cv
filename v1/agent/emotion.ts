import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const PORT = 5000;

// Store active WebSocket connections
const clients: WebSocket[] = [];

// Function to start the WebSocket server
export function startEmotionServer(handleEmotion: (emotion: string, confidence: number) => void) {
  return new Promise<void>(resolve => {
    serve(async (req) => {
      // Ensure only WebSocket connections are accepted
      if (req.headers.get("upgrade") !== "websocket") {
        return new Response("WebSocket only", { status: 400 });
      }

      // Upgrade HTTP to WebSocket connection
      const { socket, response } = Deno.upgradeWebSocket(req);
      console.log("Emotion client connected");

      // Resolve the promise once we've received a connection!
      resolve();

      // Store the client connection
      clients.push(socket);

      // Handle incoming messages (emotions)
      socket.onmessage = (event) => {
        // console.log(`Socket event, emotion: ${event.data}`);
        const data = JSON.parse(event.data);
        if (data) handleEmotion(data.emotion, Math.round(data.confidence / 100)); // Pass emotion to the provided handler
      };

      // Handle client disconnection
      socket.onclose = () => {
        console.log("Emotion client disconnected");
        const index = clients.indexOf(socket);
        if (index !== -1) {
          clients.splice(index, 1);
        }
      };

      // Handle error
      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      return response;
    }, { port: PORT });
  });
}
