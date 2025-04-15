import cv2
import asyncio
import websockets
from deepface import DeepFace
import json


WS_SERVER = "ws://localhost:5000"

# Load face cascade classifier
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

async def capture_emotion(websocket):
    # Start capturing video
    cap = cv2.VideoCapture(0)

    last_emotion = None

    while True:
        # Capture frame-by-frame
        ret, frame = cap.read()

        # Convert frame to grayscale
        gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Convert grayscale frame to RGB format
        rgb_frame = cv2.cvtColor(gray_frame, cv2.COLOR_GRAY2RGB)

        # Detect faces in the frame
        faces, scores = face_cascade.detectMultiScale2(gray_frame, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

        # Continue if no faces found
        if len(faces) <= 0: continue

        # Unwrap the scores tuple
        if isinstance(scores, tuple):
            scores = scores[0]

        # Get best face
        best_idx = scores.argmax()  # Index of the most confident face
        best_face = faces[best_idx]

        (x, y, w, h) = best_face

        # Extract the face ROI (Region of Interest)
        face_roi = rgb_frame[y:y + h, x:x + w]

        # Perform emotion analysis on the face ROI
        result = DeepFace.analyze(
            face_roi,
            actions=['emotion'],
            enforce_detection=False,
        )

        # Determine the dominant emotion
        dominant_emotion = result[0]['dominant_emotion']
        confidence = result[0]['emotion'][dominant_emotion]

        # Send the dominant emotion
        if (dominant_emotion != last_emotion and websocket != None):
                last_emotion = dominant_emotion
                # print(f"Emotion: {dominant_emotion}, confidence: {confidence}")
                await websocket.send(json.dumps({
                    "emotion": dominant_emotion,
                    "confidence": confidence
                }))

        # Draw rectangle around face and label with predicted emotion
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)
        cv2.putText(frame, dominant_emotion, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

        # Display the resulting frame
        cv2.imshow('Real-time Emotion Detection', frame)

        # Press 'q' to exit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Release the capture and close all windows
    cap.release()
    cv2.destroyAllWindows()

async def keep_socket_alive(websocket):
    try:
        async for _ in websocket:
            pass  # just keep reading messages (even if you're not expecting any)
    except:
        pass  # safely ignore disconnects

async def main():
    async with websockets.connect(WS_SERVER, ping_interval=None, ping_timeout=None) as websocket:
        asyncio.create_task(keep_socket_alive(websocket))
        await capture_emotion(websocket)

if __name__ == "__main__":
    asyncio.run(main())
