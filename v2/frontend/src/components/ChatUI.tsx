// src/components/ChatUI.tsx
import React, { useEffect, useState } from "react";
import { ChatAgent, ConversationItem } from "../client";

type Props = {
  agent: ChatAgent;
};

export default function ChatUI({ agent }: Props) {
  const [messages, setMessages] = useState<ConversationItem[]>([]);
  const [inputText, setInputText] = useState("");

  // 1) On mount, register a callback so we can update our local state
  useEffect(() => {
    agent.setOnMessageCallback((items) => {
      setMessages(items);
    });
    // Immediately load conversation (likely empty at first)
    setMessages(agent.getConversation());
  }, [agent]);

  // 2) Handle user sending a message
  function handleSend() {
    const text = inputText.trim();
    if (!text) return;
    setInputText("");

    //  A) Send the user message
    agent.sendUserMessage(text);
    //  B) Then request a new response from the AI
    agent.requestResponse();
  }

  return (
    <div style={{ border: "1px solid #ccc", padding: "1rem" }}>
      <div style={{ height: 200, overflow: "auto", marginBottom: "1rem" }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ margin: "4px 0" }}>
            <b>{msg.role}:</b> {msg.content}
          </div>
        ))}
      </div>
      <input
        style={{ width: "70%" }}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Type your message..."
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
