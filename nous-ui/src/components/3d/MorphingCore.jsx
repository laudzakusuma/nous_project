import React, { useRef } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Text, Environment, Float } from '@react-three/drei';
import { motion } from 'framer-motion-3d';

const FONT_URL = '/fonts/Rajdhani-Bold.ttf';

export default function MorphingCore() {
  const gltf = useLoader(GLTFLoader, '/models/window.glb');
  
  const textVariants = {
    initial: { x: 25, opacity: 0 }, 
    moveAcross: { 
      x: -25, 
      opacity: [0, 1, 1, 0],
      transition: { duration: 12, ease: "linear", repeat: Infinity } 
    }
  };

  return (
    <>
      <Environment preset="warehouse" blur={0.6} background={false} />
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 2, 2]} intensity={1} color="#ffffff" />

      {/* --- RUANGAN (JENDELA) --- */}
      <group position={[0, -3, 0]}> 
        <primitive 
            object={gltf.scene} 
            scale={0.015} 
            rotation={[0, -1.57, 0]} 
        /> 
      </group>

      {/* --- TEKS NOUS (POSISI BARU) --- */}
      {/* y=0 (Tengah), z=-15 (Jarak aman) */}
      <Float speed={2} rotationIntensity={0.05} floatIntensity={0.1}>
        <motion.group
          initial="initial"
          animate="moveAcross"
          variants={textVariants}
          position={[0, 0, -15]} 
        >
          <Text font={FONT_URL} fontSize={4} color="#eebb00" anchorX="center" anchorY="middle">
            NOUS
            {/* fog={false} agar tetap terang walau jauh */}
            <meshStandardMaterial emissive="#eebb00" emissiveIntensity={2} toneMapped={false} fog={false} />
          </Text>
          <Text position={[0, -1.5, 0]} font={FONT_URL} fontSize={0.6} color="white" letterSpacing={0.2}>
            ORACLE SYSTEM
          </Text>
        </motion.group>
      </Float>
    </>
  );
}