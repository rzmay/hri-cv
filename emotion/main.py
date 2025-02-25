import cv2
import asyncio
import websockets
from deepface import DeepFace


WS_SERVER = "ws://localhost:5000"

# Load face cascade classifier
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

async def capture_emotion(websocket):
    # Start capturing video
    cap = cv2.VideoCapture(0)

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
        if len(faces) < 0: continue

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
        emotion = result[0]['dominant_emotion']

        # Send the dominant emotion
        if (websocket != None): await websocket.send(emotion)

        # Draw rectangle around face and label with predicted emotion
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)
        cv2.putText(frame, emotion, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

        # Display the resulting frame
        cv2.imshow('Real-time Emotion Detection', frame)

        # Press 'q' to exit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Release the capture and close all windows
    cap.release()
    cv2.destroyAllWindows()

async def main():
    # async with websockets.connect(WS_SERVER) as websocket:
    #     await capture_emotion(websocket)
    await capture_emotion(None)

if __name__ == "__main__":
    asyncio.run(main())
