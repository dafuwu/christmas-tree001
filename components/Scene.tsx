
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, PerspectiveCamera, Image as DreiImage, Sparkles, Environment, Float, Octahedron, Tetrahedron, Torus, Circle } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { AppMode, GestureState, OrnamentData, PhotoData } from '../types';
import { generateOrnaments, calculateTreePosForPhoto, calculateScatterPosForPhoto } from '../utils/geometry';

// --- Complex Bethlehem Star ---
const TreeStar = ({ mode }: { mode: AppMode }) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const raysRef1 = useRef<THREE.Mesh>(null);
  const raysRef2 = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if(!groupRef.current) return;
    const time = state.clock.elapsedTime;
    
    // Float Logic
    const targetPos = mode === AppMode.TREE 
      ? new THREE.Vector3(0, 5.8, 0) 
      : new THREE.Vector3(0, 9, 0);
    
    groupRef.current.position.lerp(targetPos, 0.05);

    // Complex Rotations
    if (coreRef.current) coreRef.current.rotation.y -= delta * 0.5;
    if (raysRef1.current) {
        raysRef1.current.rotation.z += delta * 0.2;
        raysRef1.current.rotation.x = Math.sin(time * 0.5) * 0.2;
    }
    if (raysRef2.current) {
        raysRef2.current.rotation.z -= delta * 0.2;
        raysRef2.current.rotation.y = Math.cos(time * 0.5) * 0.2;
    }

    // Pulse
    const scale = 1 + Math.sin(time * 2) * 0.15;
    groupRef.current.scale.setScalar(scale);
  });

  const goldMaterial = useMemo(() => new THREE.MeshStandardMaterial({
      color: "#FFD700",
      emissive: "#FFAA00",
      emissiveIntensity: 2,
      roughness: 0.2,
      metalness: 1,
      toneMapped: false
  }), []);

  return (
    <group ref={groupRef} position={[0, 5.8, 0]}>
        {/* Core Light */}
        <pointLight intensity={15} distance={10} color="#FFD700" decay={2} />
        
        {/* Central Core */}
        <Octahedron ref={coreRef} args={[0.6, 0]} material={goldMaterial} />
        
        {/* Long Rays (Vertical/Horizontal) */}
        <group ref={raysRef1}>
            <Octahedron args={[1, 0]} scale={[0.3, 2.5, 0.3]} material={goldMaterial} />
            <Octahedron args={[1, 0]} scale={[2.5, 0.3, 0.3]} material={goldMaterial} />
        </group>

        {/* Diagonal Rays */}
        <group ref={raysRef2} rotation={[0, 0, Math.PI / 4]}>
            <Octahedron args={[1, 0]} scale={[0.2, 1.8, 0.2]} material={goldMaterial} />
            <Octahedron args={[1, 0]} scale={[1.8, 0.2, 0.2]} material={goldMaterial} />
        </group>

        {/* Halo Particles */}
        <Sparkles count={40} scale={3} size={4} speed={0.4} opacity={0.8} color="#FFFFE0" />
    </group>
  );
};

// --- Spiral Garland ---
const Garland = ({ mode }: { mode: AppMode }) => {
    const ref = useRef<THREE.Mesh>(null);
    const geometry = useMemo(() => {
        // Create a spiral tube
        const path = new THREE.CurvePath();
        const curve = new THREE.CatmullRomCurve3(
            Array.from({ length: 50 }, (_, i) => {
                const t = i / 49;
                const h = t * 10 - 5; // Height -5 to 5
                const r = 3.6 * (1 - t); // Radius gets smaller
                const angle = t * Math.PI * 10; // 5 full turns
                return new THREE.Vector3(
                    Math.cos(angle) * r,
                    h,
                    Math.sin(angle) * r
                );
            })
        );
        return new THREE.TubeGeometry(curve, 100, 0.08, 8, false);
    }, []);

    useFrame((state) => {
        if (mode === AppMode.SCATTER && ref.current) {
            ref.current.visible = false; // Hide garland in scatter mode
        } else if (ref.current) {
            ref.current.visible = true;
            ref.current.rotation.y = state.clock.elapsedTime * 0.1;
        }
    });

    return (
        <mesh ref={ref} geometry={geometry}>
            <meshStandardMaterial 
                color="#C0C0C0" 
                emissive="#444" 
                metalness={1} 
                roughness={0.2} 
            />
        </mesh>
    );
};

// --- Snowy Floor ---
const SnowyFloor = ({ mode }: { mode: AppMode }) => {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.5, 0]}>
            <circleGeometry args={[8, 32]} />
            <meshStandardMaterial 
                color="#ffffff" 
                roughness={1}
                transparent
                opacity={0.3}
            />
        </mesh>
    );
}

// --- Generic Instanced Shape Component ---
interface InstancedShapeProps {
  mode: AppMode;
  data: OrnamentData[];
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

const InstancedShape: React.FC<InstancedShapeProps> = ({ mode, data, geometry, material }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  // Create color array
  const colorArray = useMemo(() => {
    const c = new Float32Array(data.length * 3);
    data.forEach((o, i) => {
      const col = new THREE.Color(o.color);
      col.multiplyScalar(2.5); // Boost for neon/glow look
      c[i * 3] = col.r;
      c[i * 3 + 1] = col.g;
      c[i * 3 + 2] = col.b;
    });
    return c;
  }, [data]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const lerpFactor = THREE.MathUtils.clamp(delta * 2.0, 0, 1);
    const time = state.clock.elapsedTime;

    data.forEach((o, i) => {
      meshRef.current!.getMatrixAt(i, tempObject.matrix);
      tempObject.matrix.decompose(tempObject.position, tempObject.quaternion, tempObject.scale);
      
      const targetPos = mode === AppMode.TREE 
        ? new THREE.Vector3(...o.positionTree) 
        : new THREE.Vector3(...o.positionScatter);

      // Add floating noise
      const noise = new THREE.Vector3(
        Math.sin(time + i * 0.5) * 0.2,
        Math.cos(time * 0.8 + i * 0.5) * 0.2,
        Math.sin(time * 0.3 + i * 0.5) * 0.2
      );
      
      if (mode === AppMode.SCATTER) {
         targetPos.add(noise.multiplyScalar(2));
      } else {
        // Spin the tree
        const angle = time * 0.15;
        const x = targetPos.x * Math.cos(angle) - targetPos.z * Math.sin(angle);
        const z = targetPos.x * Math.sin(angle) + targetPos.z * Math.cos(angle);
        targetPos.setX(x);
        targetPos.setZ(z);
      }

      tempObject.position.lerp(targetPos, lerpFactor);
      
      // Rotation (Spin ornaments)
      tempObject.rotation.x += delta * 0.2;
      tempObject.rotation.y += delta * 0.5;
      
      // Scale pulse
      const pulse = 1 + Math.sin(time * 2 + i) * 0.1;
      tempObject.scale.setScalar(o.scale * pulse);

      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, data.length]}>
      <instancedBufferAttribute attach="instanceColor" args={[colorArray, 3]} />
    </instancedMesh>
  );
};

// --- Ornament System Wrapper ---
interface OrnamentSystemProps {
  mode: AppMode;
  ornaments: OrnamentData[];
}

const OrnamentSystem: React.FC<OrnamentSystemProps> = ({ mode, ornaments }) => {
  // Split data by type
  const spheres = useMemo(() => ornaments.filter(o => o.type === 'sphere'), [ornaments]);
  const boxes = useMemo(() => ornaments.filter(o => o.type === 'box'), [ornaments]);
  const torus = useMemo(() => ornaments.filter(o => o.type === 'torus'), [ornaments]);

  // Geometries
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 24, 24), []);
  const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const torusGeo = useMemo(() => new THREE.TorusGeometry(0.6, 0.25, 12, 24), []);
  
  // Materials - High gloss, high emissive
  const sphereMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    roughness: 0.1, metalness: 0.8, clearcoat: 1, emissive: new THREE.Color("#111"), emissiveIntensity: 0.2, toneMapped: false
  }), []);

  const boxMat = useMemo(() => new THREE.MeshStandardMaterial({
    roughness: 0.3, metalness: 0.4, emissive: new THREE.Color("#222"), emissiveIntensity: 0.5, toneMapped: false
  }), []);

  const torusMat = useMemo(() => new THREE.MeshStandardMaterial({
    roughness: 0.2, metalness: 0.9, emissive: new THREE.Color("#333"), emissiveIntensity: 0.4, toneMapped: false
  }), []);

  return (
    <>
      <InstancedShape mode={mode} data={spheres} geometry={sphereGeo} material={sphereMat} />
      <InstancedShape mode={mode} data={boxes} geometry={boxGeo} material={boxMat} />
      <InstancedShape mode={mode} data={torus} geometry={torusGeo} material={torusMat} />
    </>
  );
};

// --- Floating Photo Component (Unchanged logic, just keeping context) ---
interface FloatingPhotoProps {
  url: string;
  index: number;
  total: number;
  mode: AppMode;
  isZoomed: boolean;
}

const FloatingPhoto: React.FC<FloatingPhotoProps> = ({ url, index, total, mode, isZoomed }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const treePos = useMemo(() => calculateTreePosForPhoto(index, total), [index, total]);
  const scatterPos = useMemo(() => calculateScatterPosForPhoto(), []);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    let targetPos = new THREE.Vector3();
    let targetScale = 1;
    let targetRot = new THREE.Euler(0, 0, 0);

    const time = state.clock.elapsedTime;

    if (isZoomed) {
      targetPos.set(0, 0, 7);
      targetScale = 4.5;
      targetRot.set(0, 0, 0);
    } else {
      if (mode === AppMode.TREE) {
         const angle = time * 0.15 + (index * 2.5);
         const radius = Math.sqrt(treePos.x**2 + treePos.z**2) + 0.5; 
         targetPos.set(
             radius * Math.cos(angle),
             treePos.y,
             radius * Math.sin(angle)
         );
         
         targetRot.set(0, -angle + Math.PI / 2, 0);
         targetScale = 1.5;

      } else {
        targetPos.copy(scatterPos);
        targetPos.y += Math.sin(time + index) * 0.5;
        targetPos.x += Math.cos(time * 0.5 + index) * 0.2;
        
        targetRot.set(
            Math.sin(time * 0.1 + index) * 0.5,
            Math.cos(time * 0.1 + index) * 0.5,
            0
        );
        targetScale = 2;
      }
    }

    meshRef.current.position.lerp(targetPos, isZoomed ? 0.1 : 0.04);
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), 0.1);
    
    if (!isZoomed) {
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRot.x, 0.05);
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRot.y, 0.05);
        meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRot.z, 0.05);
    } else {
        meshRef.current.rotation.set(0,0,0);
        meshRef.current.lookAt(state.camera.position);
    }
  });

  return (
    <DreiImage
      ref={meshRef}
      url={url}
      transparent
      opacity={1} 
      side={THREE.DoubleSide}
      toneMapped={false} 
    />
  );
};

// --- Camera Controller ---
const CameraController: React.FC<{ gesture: GestureState, mode: AppMode }> = ({ gesture, mode }) => {
  const { camera } = useThree();
  
  useFrame(() => {
    if (mode === AppMode.SCATTER && gesture.isOpenPalm) {
      const targetX = (gesture.handPosition.x - 0.5) * 15;
      const targetY = (gesture.handPosition.y - 0.5) * 15;
      
      const newPos = new THREE.Vector3(
          Math.sin(targetX) * 14, 
          targetY, 
          Math.cos(targetX) * 14
      );
      
      camera.position.lerp(newPos, 0.03);
      camera.lookAt(0, 0, 0);
    } else if (mode === AppMode.TREE) {
        camera.position.lerp(new THREE.Vector3(0, 0, 16), 0.02);
        camera.lookAt(0, 0, 0);
    }
  });
  return null;
}

// --- Main Scene ---
interface SceneProps {
  mode: AppMode;
  gesture: GestureState;
  photos: PhotoData[];
}

export const Scene: React.FC<SceneProps> = ({ mode, gesture, photos }) => {
  const ornaments = useMemo(() => generateOrnaments(350), []);
  const [zoomedPhotoId, setZoomedPhotoId] = useState<string | null>(null);

  useEffect(() => {
    if (mode === AppMode.SCATTER && gesture.isPinching) {
       if (!zoomedPhotoId && photos.length > 0) {
          const randomId = photos[Math.floor(Math.random() * photos.length)].id;
          setZoomedPhotoId(randomId);
       }
    } else if (!gesture.isPinching) {
        setZoomedPhotoId(null);
    }
  }, [gesture.isPinching, mode, photos, zoomedPhotoId]);

  return (
    <Canvas dpr={[1, 2]} shadows>
      <PerspectiveCamera makeDefault position={[0, 0, 16]} fov={50} />
      <color attach="background" args={['#050010']} />
      
      <Environment preset="night" />

      {/* Stars Background */}
      <Stars radius={150} depth={50} count={7000} factor={4} saturation={1} fade speed={0.5} />
      
      {/* Falling Snow Effect */}
      <Sparkles 
        count={600} 
        scale={[25, 25, 25]} 
        size={3} 
        speed={0.4} 
        opacity={0.6} 
        color="#fff" 
        noise={1} 
      />
      
      {/* Magical Dust (Gold) */}
      <Sparkles count={150} scale={10} size={5} speed={0.2} opacity={0.5} color="#FFD700" />

      {/* Lights */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={30} color="#FFD700" distance={50} decay={2} />
      <pointLight position={[-10, -5, -10]} intensity={30} color="#ff0033" distance={50} decay={2} />
      <pointLight position={[0, 15, 0]} intensity={20} color="#00ff66" distance={50} decay={2} />

      <TreeStar mode={mode} />
      <OrnamentSystem mode={mode} ornaments={ornaments} />
      <Garland mode={mode} />
      <SnowyFloor mode={mode} />
      
      {photos.map((photo, index) => (
        <FloatingPhoto 
          key={photo.id}
          url={photo.url} 
          index={index} 
          total={photos.length}
          mode={mode}
          isZoomed={zoomedPhotoId === photo.id}
        />
      ))}

      <CameraController gesture={gesture} mode={mode} />
      
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.2} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.6} 
        />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
        <Noise opacity={0.02} />
      </EffectComposer>
    </Canvas>
  );
};
