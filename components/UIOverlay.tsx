import React from 'react';
import { AppMode, GestureState } from '../types';

interface UIOverlayProps {
  mode: AppMode;
  gesture: GestureState;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  photoCount: number;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ mode, gesture, onPhotoUpload, photoCount }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10">
      
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div>
           <h1 className="text-4xl font-serif text-yellow-400 tracking-widest drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
             HOLIDAY MEMORIES
           </h1>
           <p className="text-white/70 mt-2 text-sm max-w-md">
             Use hand gestures to control the magic. 
             Fist to form the tree, Open Hand to scatter, Pinch to grab a memory.
           </p>
        </div>
        
        <label className="cursor-pointer bg-red-800 hover:bg-red-700 text-white px-6 py-2 rounded-full border border-yellow-500/50 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(196,30,58,0.5)]">
          <span className="text-sm font-bold tracking-wider">ADD PHOTO</span>
          <input type="file" accept="image/*" multiple onChange={onPhotoUpload} className="hidden" />
        </label>
      </div>

      {/* Status Indicators */}
      <div className="self-center flex flex-col items-center gap-4">
         <div className="flex gap-8 text-white/50 text-sm font-light tracking-widest">
            <div className={`transition-all duration-300 ${mode === AppMode.TREE ? 'text-yellow-400 scale-110 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]' : ''}`}>
               TREE FORM
            </div>
            <div className={`transition-all duration-300 ${mode === AppMode.SCATTER ? 'text-yellow-400 scale-110 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]' : ''}`}>
               SCATTER MIST
            </div>
         </div>
      </div>

      {/* Gesture Feedback */}
      <div className="flex justify-between items-end">
         <div className="bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10 text-white/80 w-64">
            <h3 className="text-xs uppercase tracking-widest text-yellow-500 mb-2">System Status</h3>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Mode:</span>
              <span className="font-mono text-yellow-200">{mode}</span>
            </div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Hand Detected:</span>
              <span className={`font-mono ${gesture.handPosition.x !== 0 ? 'text-green-400' : 'text-red-400'}`}>
                {gesture.handPosition.x !== 0 ? 'YES' : 'NO'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Action:</span>
              <span className="font-mono text-blue-300">
                 {gesture.isFist ? 'GATHER' : gesture.isPinching ? 'GRAB' : gesture.isOpenPalm ? 'SCATTER' : 'IDLE'}
              </span>
            </div>
            <div className="mt-2 text-xs text-white/40">
               Photos Loaded: {photoCount}
            </div>
         </div>
      </div>
    </div>
  );
};
