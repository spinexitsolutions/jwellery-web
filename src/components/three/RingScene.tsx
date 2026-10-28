"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer, MeshTransmissionMaterial, OrbitControls, Sparkles } from "@react-three/drei";
import type { MotionValue } from "framer-motion";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { GEMS, METALS } from "./constants";

function useBrilliantGeometry() {
  return useMemo(() => {
    // Profile of a round brilliant: culet → pavilion → girdle → crown → table.
    const pts = [
      new THREE.Vector2(0.0001, -0.43),
      new THREE.Vector2(0.2, -0.2),
      new THREE.Vector2(0.5, 0),
      new THREE.Vector2(0.5, 0.04),
      new THREE.Vector2(0.38, 0.15),
      new THREE.Vector2(0.27, 0.2),
      new THREE.Vector2(0.0001, 0.2),
    ];
    const g = new THREE.LatheGeometry(pts, 16);
    const flat = g.toNonIndexed();
    flat.computeVertexNormals();
    return flat;
  }, []);
}

function Ring({ metal, gem, progress, interactive, bg }: { metal: string; gem: string; progress?: MotionValue<number>; interactive?: boolean; bg: string }) {
  const bgColor = useMemo(() => new THREE.Color(bg), [bg]);
  const group = useRef<THREE.Group>(null);
  const gemGeo = useBrilliantGeometry();
  const m = METALS[metal] ?? METALS.gold;
  const g = GEMS[gem] ?? GEMS.diamond;
  const viewportWidth = useThree((st) => st.viewport.width);
  // Keep the ring proportionate on narrow (portrait) canvases.
  const fit = Math.min(1, viewportWidth / 3.4) * 0.86;
  const prongs = useMemo(() => [0, 1, 2, 3, 4, 5].map((i) => (i / 6) * Math.PI * 2 + Math.PI / 6), []);

  useFrame((state, delta) => {
    if (!group.current) return;
    const p = progress?.get() ?? 0;
    if (interactive) group.current.scale.setScalar(fit);
    if (!interactive) {
      group.current.rotation.y += delta * 0.35;
      const targetX = -0.35 + state.pointer.y * 0.25 + p * 1.2;
      const targetZ = -state.pointer.x * 0.2;
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetX, 0.06);
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, targetZ, 0.06);
      const s = fit * (1 - p * 0.25);
      group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, s, 0.1));
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, -0.25 - p * 0.8, 0.1);
    }
  });

  return (
    <group ref={group} rotation={[-0.35, 0, 0]} position={[0, -0.25, 0]} scale={0.86}>
      {/* band */}
      <mesh scale={[1, 1, 2.3]}>
        <torusGeometry args={[1, 0.085, 48, 220]} />
        <meshStandardMaterial color={m.color} metalness={1} roughness={0.14} envMapIntensity={1.2} />
      </mesh>
      {/* basket */}
      <mesh position={[0, 1.13, 0]}>
        <cylinderGeometry args={[0.22, 0.09, 0.2, 32, 1, true]} />
        <meshStandardMaterial color={m.color} metalness={1} roughness={0.2} side={THREE.DoubleSide} />
      </mesh>
      {/* prongs */}
      {prongs.map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 0.29, 1.42, Math.sin(a) * 0.29]} rotation={[Math.sin(a) * 0.28, 0, -Math.cos(a) * 0.28]}>
          <cylinderGeometry args={[0.02, 0.028, 0.44, 10]} />
          <meshStandardMaterial color={m.color} metalness={1} roughness={0.18} />
        </mesh>
      ))}
      {/* stone */}
      <mesh geometry={gemGeo} position={[0, 1.55, 0]} scale={0.72}>
        <MeshTransmissionMaterial
          color={g.color}
          attenuationColor={g.attenuation}
          attenuationDistance={gem === "diamond" ? 10 : 0.6}
          ior={2.4}
          thickness={0.8}
          roughness={0}
          chromaticAberration={gem === "diamond" ? 0.6 : 0.25}
          anisotropicBlur={0.1}
          distortion={0}
          samples={6}
          resolution={256}
          backside
          backsideThickness={0.4}
          flatShading
          background={bgColor}
        />
      </mesh>
    </group>
  );
}

export default function RingScene({
  metal = "gold",
  gem = "diamond",
  progress,
  interactive = false,
  shadow = false,
  bg = "#F3EEE6",
  onReady,
}: {
  metal?: string;
  gem?: string;
  progress?: MotionValue<number>;
  interactive?: boolean;
  shadow?: boolean;
  bg?: string;
  /** Called once the WebGL context exists and the first frames have rendered. */
  onReady?: () => void;
}) {
  // A warm, bright studio environment so gold reads as gold rather than bronze.
  const envTint = metal === "platinum" ? "#8f949c" : metal === "rose" ? "#9c8279" : "#9a8768";
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0.3, 6.6], fov: 32 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={() => requestAnimationFrame(() => requestAnimationFrame(() => onReady?.()))}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 4]} intensity={1.4} />
      <Float speed={interactive ? 0 : 1.6} rotationIntensity={0.2} floatIntensity={interactive ? 0 : 0.6}>
        <Ring metal={metal} gem={gem} progress={progress} interactive={interactive} bg={bg} />
      </Float>
      {!interactive && <Sparkles count={40} scale={[6, 4, 3]} size={2.2} speed={0.35} color={METALS[metal]?.color ?? "#E9C27D"} opacity={0.7} />}
      {shadow && <ContactShadows position={[0, -1.55, 0]} opacity={0.35} scale={8} blur={2.6} far={3} />}
      {interactive && <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.2} minPolarAngle={Math.PI / 3.2} maxPolarAngle={Math.PI / 1.7} />}
      <Environment resolution={256}>
        <color attach="background" args={[envTint]} />
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer form="circle" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={8} />
          <Lightformer form="ring" color="#ffd9a8" intensity={6} onUpdate={(self) => self.lookAt(0, 0, 0)} position={[10, 10, 0]} scale={10} />
        </group>
      </Environment>
    </Canvas>
  );
}
