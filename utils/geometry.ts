
import { OrnamentData } from '../types';
import * as THREE from 'three';

export const generateOrnaments = (count: number): OrnamentData[] => {
  const ornaments: OrnamentData[] = [];
  
  // Enhanced Christmas Palette
  const colors = [
    '#D42426', // Deep Red
    '#165B33', // Deep Green
    '#F8B229', // Warm Gold
    '#EA4630', // Bright Red
    '#FFFFFF', // Snow White
    '#146B3A', // Forest Green
    '#BB2528', // Berry Red
    '#00FFFF', // Ice Cyan (Accent)
  ];

  for (let i = 0; i < count; i++) {
    // Tree Position (Cone)
    const yTree = (i / count) * 10 - 5; // Height from -5 to 5
    const radiusAtHeight = 3.5 * (1 - (yTree + 5) / 10); // Tapering radius
    const angle = i * 0.5 + Math.random();
    const r = radiusAtHeight + (Math.random() - 0.5) * 0.8;
    const xTree = r * Math.cos(angle);
    const zTree = r * Math.sin(angle);

    // Scatter Position (Cloud)
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const scatterR = 8 + Math.random() * 4;
    const xScatter = scatterR * Math.sin(phi) * Math.cos(theta);
    const yScatter = scatterR * Math.sin(phi) * Math.sin(theta);
    const zScatter = scatterR * Math.cos(phi);

    // Determine Shape Type
    const rand = Math.random();
    let type: 'sphere' | 'box' | 'torus' = 'sphere';
    let scale = 0.1 + Math.random() * 0.2;

    if (rand > 0.8) {
        type = 'box'; // 20% Gifts
        scale += 0.05;
    } else if (rand > 0.6) {
        type = 'torus'; // 20% Wreaths/Rings
        scale += 0.1; // Wreaths look better slightly larger
    }

    ornaments.push({
      id: i,
      type: type,
      color: colors[Math.floor(Math.random() * colors.length)],
      positionTree: [xTree, yTree, zTree],
      positionScatter: [xScatter, yScatter, zScatter],
      scale: scale, 
    });
  }
  return ornaments;
};

export const calculateTreePosForPhoto = (index: number, total: number) => {
   // Spiral placement on the tree surface
   const y = (index / total) * 8 - 4;
   const radius = 3.8 * (1 - (y + 4) / 10) + 0.2;
   const angle = index * 2.5;
   return new THREE.Vector3(
     radius * Math.cos(angle),
     y,
     radius * Math.sin(angle)
   );
};

export const calculateScatterPosForPhoto = () => {
    const r = 6 + Math.random() * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    return new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
    );
};
