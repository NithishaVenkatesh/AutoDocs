import cv2
import numpy as np

# Start webcam
cap = cv2.VideoCapture(0)  # Use 0 for default camera

# Define range for yellow color in HSV
lower_yellow = np.array([20, 100, 100])
upper_yellow = np.array([30, 255, 255])

while True:
    # Read frame from webcam
    ret, frame = cap.read()
    if not ret:
        break

    # Convert frame to HSV
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    # Create mask for yellow color
    mask = cv2.inRange(hsv, lower_yellow, upper_yellow)

    # Apply mask on original frame
    result = cv2.bitwise_and(frame, frame, mask=mask)

    # Show results
    cv2.imshow("Live Feed", frame)
    cv2.imshow("Yellow Mask", mask)
    cv2.imshow("Detected Yellow Areas", result)

    # Press 'q' to exit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()