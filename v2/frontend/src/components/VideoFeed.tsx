import React, { useEffect, useRef } from "react";

type VideoFeedProps = {
  onEmotionDetected: (emotion: string, confidence: number) => void;
};

export default function VideoFeed({ onEmotionDetected }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalIdRef = useRef<number | null>(null); // or NodeJS.Timeout if you’re using Node types

  useEffect(() => {
    // Ask permission and attach the video
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setupWebSocket();
      })
      .catch((err) => console.error("Error accessing camera:", err));

    // Clean up on unmount
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  function setupWebSocket() {
    const ws = new WebSocket(`${process.env.API_BASE_URL}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected!");
      startFrameLoop(ws);
    };

    ws.onmessage = (evt) => {
      // { emotion, confidence }
      const data = JSON.parse(evt.data);
      onEmotionDetected(data.emotion, data.confidence);
    };

    ws.onclose = () => console.log("WebSocket disconnected.");
  }

  function startFrameLoop(ws: WebSocket) {
    const FPS = 1; // 1 frame/second (adjust as needed)
    intervalIdRef.current = window.setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      if (ws.readyState !== WebSocket.OPEN) return;

      const videoEl = videoRef.current;
      const canvasEl = canvasRef.current;

      // Match canvas size to the video frame
      canvasEl.width = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;

      const ctx = canvasEl.getContext("2d");
      if (!ctx) return;

      // Draw the current video frame into the canvas
      ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

      // Convert canvas to base64
      const base64Data = canvasEl.toDataURL("image/jpeg").split(",")[1];
      ws.send(base64Data);
    }, 1000 / FPS);
  }

  return (
    <div>
      <video
        ref={videoRef}
        style={{ width: 320, height: 240, background: "#ccc" }}
      />
      {/* Hidden canvas for offscreen capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
