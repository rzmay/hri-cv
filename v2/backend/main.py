import base64
import cv2
import numpy as np
import uvicorn
from fastapi import FastAPI, WebSocket
from deepface import DeepFace

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket connection accepted.")

    last_emotion = None

    while True:
        try:
            data = await websocket.receive_text()
            frame_bytes = base64.b64decode(data)
            nparr = np.frombuffer(frame_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            try:
                result = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
                dominant_emotion = result['dominant_emotion']
                confidence = result['emotion'][dominant_emotion]
            except:
                dominant_emotion = "unknown"
                confidence = 0.0

            # Only send an update if the emotion has changed
            if dominant_emotion != last_emotion:
                last_emotion = dominant_emotion
                await websocket.send_json({
                    "emotion": dominant_emotion,
                    "confidence": confidence
                })
        except:
            print("Client disconnected.")
            break

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
