
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Float, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const FlowingSphere = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={[2, 0, 0]} scale={[2.5, 2.5, 2.5]}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color="#ffffff"
          speed={3}
          distort={0.4}
          roughness={0.05}
          metalness={0.1}
          emissive="#ffffff"
          emissiveIntensity={0.1}
        />
      </mesh>
    </Float>
  );
};

const ParticleField = () => {
  const count = 1500;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#ffffff" transparent opacity={0.2} />
    </points>
  );
};

const ThreeScene: React.FC = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      dpr={[1, 2]}
      onCreated={({ gl }) => {
        gl.setClearColor('#000000');
      }}
    >
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={5} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={2} color="#ffffff" />

      <FlowingSphere />
      <ParticleField />

      <ContactShadows position={[0, -3.5, 0]} opacity={0.4} scale={20} blur={2.5} far={4} color="#000000" />

      <Environment preset="night" />
    </Canvas>
  );
};

export default ThreeScene;
