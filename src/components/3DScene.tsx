import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

// Floating Film Reel Component
function FilmReel({ position, rotationSpeed = 1, scale = 1 }: { position: [number, number, number]; rotationSpeed?: number; scale?: number }) {
  const group = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * rotationSpeed * 0.6;
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
      group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.2) * 0.6;
    }
  });

  return (
    <group ref={group} position={position} scale={scale}>
      {/* Outer ring */}
      <mesh>
        <torusGeometry args={[2.2, 0.12, 16, 48]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.7} />
      </mesh>
      {/* Inner ring */}
      <mesh>
        <torusGeometry args={[1.6, 0.08, 16, 48]} />
        <meshBasicMaterial color="#c026ff" transparent opacity={0.55} />
      </mesh>
      {/* Film perforations */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[Math.cos((i / 8) * Math.PI * 2) * 2, Math.sin((i / 8) * Math.PI * 2) * 2, 0]} rotation={[0, 0, (i / 8) * Math.PI * 2]}>
          <boxGeometry args={[0.18, 0.32, 0.3]} />
          <meshBasicMaterial color="#111" />
        </mesh>
      ))}
    </group>
  );
}

// Cinematic Camera Model (stylized)
function CinematicCamera({ position, speed = 0.8 }: { position: [number, number, number]; speed?: number }) {
  const group = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * speed * 0.4;
      group.current.position.y = position[1] + Math.cos(state.clock.elapsedTime * 0.9) * 0.8;
    }
  });

  return (
    <group ref={group} position={position}>
      {/* Camera body */}
      <mesh>
        <boxGeometry args={[1.8, 1.1, 2.6]} />
        <meshPhongMaterial color="#222" shininess={80} specular="#111" />
      </mesh>
      {/* Lens barrel */}
      <mesh position={[0, 0, 1.8]}>
        <cylinderGeometry args={[0.55, 0.7, 1.4, 28]} />
        <meshPhongMaterial color="#1a1a1f" />
      </mesh>
      {/* Lens glass (neon glow) */}
      <mesh position={[0, 0, 2.6]}>
        <circleGeometry args={[0.48]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.85} />
      </mesh>
      {/* Red recording dot */}
      <mesh position={[0.7, 0.55, 1.1]}>
        <sphereGeometry args={[0.09]} />
        <meshBasicMaterial color="#ff2255" />
      </mesh>
    </group>
  );
}

// Neon Ring / Light Orb
function NeonRing({ position, color, radius = 3.5 }: { position: [number, number, number]; color: string; radius?: number }) {
  const mesh = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.z = state.clock.elapsedTime * 0.3;
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.4;
    }
  });

  return (
    <mesh ref={mesh} position={position}>
      <torusGeometry args={[radius, 0.035, 12, 52]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
}

// Floating Particles (data / film dust)
function FloatingParticles() {
  const count = 38;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 38;
      pos[i + 1] = (Math.random() - 0.5) * 26;
      pos[i + 2] = (Math.random() - 0.5) * 22;
    }
    return pos;
  }, []);

  const pointsRef = useRef<THREE.Points>(null!);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.015;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial size={0.065} color="#c026ff" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

// Main Scene
function Scene() {
  const { camera } = useThree();

  // Gentle auto-orbit camera movement
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.08;
    camera.position.x = Math.sin(t) * 13.5;
    camera.position.z = Math.cos(t) * 15.5 + 2;
    camera.position.y = Math.sin(t * 0.6) * 3.2 + 4.5;
    camera.lookAt(0, 1.5, 0);
  });

  return (
    <>
      {/* Ambient + key lights */}
      <ambientLight intensity={0.15} />
      <pointLight position={[-18, 22, -12]} intensity={1.8} color="#c026ff" />
      <pointLight position={[24, -6, 14]} intensity={1.4} color="#00f0ff" />
      <pointLight position={[0, 28, -8]} intensity={0.9} color="#ffffff" />

      {/* Core cinematic objects */}
      <FilmReel position={[-7.5, 3, -4]} rotationSpeed={0.9} scale={0.9} />
      <FilmReel position={[8.5, -1.5, -6]} rotationSpeed={-1.1} scale={0.75} />
      
      <CinematicCamera position={[-4.5, 6, 1]} speed={0.65} />
      <CinematicCamera position={[5.5, -3.5, -3]} speed={-0.85} />

      {/* Glowing neon architecture rings */}
      <NeonRing position={[0, 5, -9]} color="#00f0ff" radius={5.2} />
      <NeonRing position={[-9, -2, 4]} color="#c026ff" radius={4.8} />
      <NeonRing position={[7, 9, 2]} color="#ff00aa" radius={3.6} />

      <FloatingParticles />

      {/* Distant stars / city lights */}
      <Stars 
        radius={82} 
        depth={38} 
        count={180} 
        factor={3.2} 
        saturation={0} 
        fade 
        speed={0.4} 
      />

      {/* Subtle ground plane */}
      <mesh rotation={[-Math.PI * 0.5, 0, 0]} position={[0, -6.5, 0]}>
        <planeGeometry args={[120, 120]} />
        <meshBasicMaterial color="#050508" transparent opacity={0.85} />
      </mesh>

      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        minDistance={7} 
        maxDistance={32}
        enableDamping 
        dampingFactor={0.12}
        target={[0, 2, 0]}
      />
    </>
  );
}

// Post-processing (Bloom for that true cinematic glow)
function PostFX() {
  return (
    <EffectComposer>
      <Bloom 
        luminanceThreshold={0.2} 
        luminanceSmoothing={0.75} 
        height={480} 
        intensity={0.85}
      />
      <Vignette offset={0.3} darkness={0.65} />
    </EffectComposer>
  );
}

export default function Cinematic3DScene() {
  return (
    <div className="canvas-container relative h-[540px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#020203]">
      <Canvas 
        camera={{ position: [0, 8, 19], fov: 42, near: 0.1, far: 300 }} 
        style={{ background: '#050508' }}
        gl={{ 
          antialias: true, 
          alpha: true, 
          preserveDrawingBuffer: true,
          powerPreference: "high-performance"
        }}
      >
        <Scene />
        <PostFX />
      </Canvas>
      
      {/* Overlay labels */}
      <div className="absolute bottom-4 left-4 text-[10px] font-mono tracking-[2px] text-white/40 pointer-events-none">
        DRAG TO ORBIT • SCROLL TO ZOOM
      </div>
      <div className="absolute top-4 right-4 px-3 py-1 text-[10px] rounded-full bg-black/50 border border-white/10 text-white/60 font-mono tracking-widest">
        REACT THREE FIBER
      </div>
    </div>
  );
}
