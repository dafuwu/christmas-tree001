import React, { useState, useCallback, useEffect } from 'react';
import { Scene } from './components/Scene';
import { HandManager } from './components/HandManager';
import { UIOverlay } from './components/UIOverlay';
import { AppMode, GestureState, PhotoData } from './types';

// Default photos to make it look good initially
const DEFAULT_PHOTOS = [
  'https://picsum.photos/id/10/500/500',
  'https://picsum.photos/id/15/500/500',
  'https://picsum.photos/id/20/500/500',
  'https://picsum.photos/id/25/500/500',
  'https://picsum.photos/id/30/500/500',
];

export default function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.TREE);
  const [gesture, setGesture] = useState<GestureState>({
    isFist: false,
    isOpenPalm: false,
    isPinching: false,
    handPosition: { x: 0, y: 0 }
  });

  const [photos, setPhotos] = useState<PhotoData[]>(
    DEFAULT_PHOTOS.map((url, i) => ({ id: `def-${i}`, url }))
  );

  const handleGestureChange = useCallback((newGesture: GestureState) => {
    setGesture(newGesture);

    // State Machine Logic
    if (newGesture.isFist) {
      setMode(AppMode.TREE);
    } else if (newGesture.isOpenPalm) {
      setMode(AppMode.SCATTER);
    }
    // Pinch logic is handled inside the Scene for specific object interaction
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos: PhotoData[] = [];
      Array.from(e.target.files).forEach((file) => {
        const url = URL.createObjectURL(file as Blob);
        newPhotos.push({
          id: `user-${Date.now()}-${Math.random()}`,
          url
        });
      });
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-sans">
      <Scene mode={mode} gesture={gesture} photos={photos} />
      <UIOverlay 
        mode={mode} 
        gesture={gesture} 
        onPhotoUpload={handlePhotoUpload} 
        photoCount={photos.length} 
      />
      <HandManager onGestureChange={handleGestureChange} />
    </div>
  );
}