import React, { useEffect, useRef, useState } from 'react';
import { GestureState } from '../types';

// Declare globals for the CDN loaded scripts
declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

interface HandManagerProps {
  onGestureChange: (gesture: GestureState) => void;
}

export const HandManager: React.FC<HandManagerProps> = ({ onGestureChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    let hands: any;
    let camera: any;

    const onResults = (results: any) => {
      if (!isMountedRef.current) return;
      
      // Fix: Check if results exists before accessing properties
      if (!results || !results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        onGestureChange({
            isFist: false,
            isOpenPalm: false,
            isPinching: false,
            handPosition: { x: 0, y: 0 }
        });
        return;
      }

      const landmarks = results.multiHandLandmarks[0]; // Use first hand
      
      // Simple gesture detection logic
      
      // 1. Is Fist? (Fingers curled)
      // Check tips against PIP (Proximal Interphalangeal) joints for 4 fingers
      const isFist = 
        landmarks[8].y > landmarks[6].y && // Index
        landmarks[12].y > landmarks[10].y && // Middle
        landmarks[16].y > landmarks[14].y && // Ring
        landmarks[20].y > landmarks[18].y;   // Pinky

      // 2. Is Open Palm? (Fingers extended)
      const isOpenPalm = 
        landmarks[8].y < landmarks[6].y &&
        landmarks[12].y < landmarks[10].y &&
        landmarks[16].y < landmarks[14].y &&
        landmarks[20].y < landmarks[18].y;

      // 3. Is Pinching? (Thumb tip close to Index tip)
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const distance = Math.sqrt(
        Math.pow(thumbTip.x - indexTip.x, 2) + 
        Math.pow(thumbTip.y - indexTip.y, 2)
      );
      const isPinching = distance < 0.05;

      // Hand centroid for movement
      const handX = landmarks[9].x; // Middle finger knuckle roughly center
      const handY = landmarks[9].y;

      onGestureChange({
        isFist,
        isOpenPalm,
        isPinching,
        handPosition: { x: handX, y: handY }
      });
    };

    const init = async () => {
      if (!isMountedRef.current) return;
      
      if (window.Hands) {
        try {
          hands = new window.Hands({
            locateFile: (file: string) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            },
          });

          hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          hands.onResults(onResults);

          if (videoRef.current) {
            camera = new window.Camera(videoRef.current, {
              onFrame: async () => {
                if (isMountedRef.current && videoRef.current && hands) {
                  try {
                    await hands.send({ image: videoRef.current });
                  } catch (e) {
                    console.warn("MediaPipe send error", e);
                  }
                }
              },
              width: 640,
              height: 480,
            });
            await camera.start();
            setLoaded(true);
          }
        } catch (error) {
           console.error("Failed to initialize MediaPipe", error);
        }
      } else {
        // Retry if script not loaded yet
        setTimeout(init, 500);
      }
    };

    init();

    return () => {
      isMountedRef.current = false;
      if (camera) {
        try { camera.stop(); } catch(e) {}
      }
      if (hands) {
        try { hands.close(); } catch(e) {}
      }
    };
  }, [onGestureChange]);

  return (
    <div className="fixed bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-gold-500 shadow-lg z-50 bg-black opacity-80 pointer-events-none">
      {!loaded && <div className="absolute inset-0 flex items-center justify-center text-xs text-gold-500">Loading AI...</div>}
      <video
        ref={videoRef}
        className="w-full h-full object-cover transform -scale-x-100"
        playsInline
      />
    </div>
  );
};