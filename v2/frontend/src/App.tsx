import React, { useEffect, useState } from "react";
import { initializeOpenAI } from "./openai";
import { ChatAgent } from "./client";
import ChatUI from "./components/ChatUI";
import VideoFeed from "./components/VideoFeed";
import { Stats } from "./stats";

function App() {
  // Query param to show system messages
  const params = new URLSearchParams(window.location.search);
  const showSystem = params.get("system") === "true";
  const variant = Number(params.get("variant"));

  const [stats] = useState(() => new Stats());
  const [agent, setAgent] = useState<ChatAgent | null>(null);
  const [emotion, setEmotion] = useState("unknown");
  const [confidence, setConfidence] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Initialization
  useEffect(() => {
    // Initialize the custom AI client
    initializeOpenAI(variant);

    // Create the ChatAgent
    const chatAgent = new ChatAgent(showSystem);
    setAgent(chatAgent);

    // 1) Whenever the user sends a message, track sentiment analysis
    chatAgent.setOnUserMessageCallback((message) => {
      stats.onUserMessage(message);
    });

    // 2) On complete
    chatAgent.setOnCompleteCallback(() => {
      stats.endForm();
      setIsComplete(true);

      // Post stats to the backend (Google Sheets)
      postStats(stats).catch((err) => {
        console.error("Error posting stats:", err);
      });
    });

    // Start stats tracking
    stats.startForm();
  }, []);

  // Whenever emotion changes, track it
  useEffect(() => {
    stats.onEmotionChange(emotion);
  }, [stats, emotion]);

  // Simple function to POST stats to the backend
  async function postStats(statsObj: Stats) {
    // Construct the data you want to send
    const bodyData = {
      formCompletionTime: statsObj.getFormCompletionTime(),
      emotionDurations: statsObj.getEmotionDurations(),
      averageSentiment: statsObj.getAverageSentiment(),
      variant, // Optionally log which variant was used
    };

    // Send to your Python server
    const res = await fetch(`${process.env.API_BASE_URL}/stats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });

    if (!res.ok) {
      throw new Error(
        `POST ${process.env.API_BASE_URL}/stats failed: ${res.status} ${res.statusText}`,
      );
    }
    console.log("Stats posted successfully!");
  }

  return (
    <div style={{ margin: "1rem" }}>
      <h1>Web Demo with Real-time Chat & Emotion</h1>

      {isComplete
        ? (
          <div>
            <h2>Trial complete, thank you for participating!</h2>
            <p>(Feel free to close this tab or refresh.)</p>
          </div>
        )
        : (
          <>
            <VideoFeed
              onEmotionDetected={(emo, conf) => {
                setEmotion(emo);
                setConfidence(conf);
              }}
            />
            <p>
              Current emotion: {emotion} (confidence: {confidence.toFixed(2)})
            </p>
            {agent && <ChatUI agent={agent} />}
          </>
        )}
    </div>
  );
}

export default App;
