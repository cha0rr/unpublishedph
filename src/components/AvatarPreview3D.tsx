import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

interface AvatarPreview3DProps {
  selections: Record<string, string>;
}

/* ─── Color maps ─── */
const HAIR_HEX: Record<string, string> = {
  "Preto": "#1a1a2e",
  "Castanho escuro": "#3b2314",
  "Castanho claro": "#8b5e3c",
  "Loiro": "#d4a840",
  "Ruivo": "#b84420",
  "Platinado": "#ddd5c8",
  "Rosa": "#d45a9a",
  "Azul": "#3060c0",
  "Branco": "#e8e0e0",
};

const SKIN_HEX: Record<string, string> = {
  "Pele clara": "#fde0c8",
  "Pele branca": "#fce8d8",
  "Pele morena clara": "#d4a574",
  "Pele morena": "#b07840",
  "Pele negra": "#6b4226",
  "Pele asiática": "#f0d0a0",
};

const EYE_HEX: Record<string, string> = {
  "Castanho": "#5c3317",
  "Verde": "#2d8a4e",
  "Azul": "#3b82f6",
  "Mel": "#c49a3c",
  "Cinza": "#7888a0",
  "Preto": "#1a1a2a",
};

const HEIGHT_SCALE: Record<string, number> = {
  "Baixa": 0.9,
  "Média": 1,
  "Alta": 1.1,
};

const BODY_WIDTH: Record<string, number> = {
  "Magra": 0.82,
  "Atlética": 0.9,
  "Mediana": 1,
  "Curvilínea": 1.12,
  "Plus size": 1.25,
};

/* ─── Lerp helper for smooth color transitions ─── */
function useLerpColor(targetHex: string, speed = 4) {
  const colorRef = useRef(new THREE.Color(targetHex));
  const target = useMemo(() => new THREE.Color(targetHex), [targetHex]);

  useFrame((_, delta) => {
    colorRef.current.lerp(target, 1 - Math.exp(-speed * delta));
  });

  return colorRef;
}

/* ─── Hair component based on type ─── */
function Hair({ type, colorHex }: { type: string; colorHex: string }) {
  const color = useLerpColor(colorHex);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (matRef.current) matRef.current.color.copy(color.current);
  });

  const mat = <meshStandardMaterial ref={matRef} color={colorHex} roughness={0.6} metalness={0.05} />;

  switch (type) {
    case "Liso":
      return (
        <group>
          {/* Hair cap */}
          <mesh position={[0, 1.72, 0]}>
            <sphereGeometry args={[0.52, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
            {mat}
          </mesh>
          {/* Long straight strands - back */}
          <mesh position={[0, 1.1, -0.15]}>
            <boxGeometry args={[0.85, 1.2, 0.15]} />
            <meshStandardMaterial color={colorHex} roughness={0.5} />
          </mesh>
          {/* Side left */}
          <mesh position={[-0.38, 1.2, 0.05]}>
            <boxGeometry args={[0.12, 1.0, 0.25]} />
            <meshStandardMaterial color={colorHex} roughness={0.5} />
          </mesh>
          {/* Side right */}
          <mesh position={[0.38, 1.2, 0.05]}>
            <boxGeometry args={[0.12, 1.0, 0.25]} />
            <meshStandardMaterial color={colorHex} roughness={0.5} />
          </mesh>
        </group>
      );

    case "Ondulado":
      return (
        <group>
          <mesh position={[0, 1.72, 0]}>
            <sphereGeometry args={[0.54, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
            {mat}
          </mesh>
          {/* Wavy back volume */}
          <mesh position={[0, 1.15, -0.12]}>
            <sphereGeometry args={[0.48, 16, 16]} />
            <meshStandardMaterial color={colorHex} roughness={0.55} />
          </mesh>
          {/* Side puffs */}
          <mesh position={[-0.42, 1.35, 0]}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial color={colorHex} roughness={0.55} />
          </mesh>
          <mesh position={[0.42, 1.35, 0]}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial color={colorHex} roughness={0.55} />
          </mesh>
        </group>
      );

    case "Cacheado":
      return (
        <group>
          <mesh position={[0, 1.72, 0]}>
            <sphereGeometry args={[0.56, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
            {mat}
          </mesh>
          {/* Curl clusters */}
          {[
            [-0.45, 1.4, 0.1], [0.45, 1.4, 0.1],
            [-0.42, 1.2, 0.12], [0.42, 1.2, 0.12],
            [-0.38, 1.0, 0.1], [0.38, 1.0, 0.1],
            [-0.3, 0.85, 0.08], [0.3, 0.85, 0.08],
            [0, 1.15, -0.35], [-0.2, 1.3, -0.32], [0.2, 1.3, -0.32],
          ].map((pos, i) => (
            <mesh key={i} position={pos as [number, number, number]}>
              <sphereGeometry args={[0.12, 10, 10]} />
              <meshStandardMaterial color={colorHex} roughness={0.7} />
            </mesh>
          ))}
        </group>
      );

    case "Crespo":
      return (
        <group>
          {/* Big afro volume */}
          <mesh position={[0, 1.78, 0]}>
            <sphereGeometry args={[0.68, 32, 24]} />
            {mat}
          </mesh>
          {/* Extra volume bumps */}
          {[
            [-0.5, 1.8, 0.2], [0.5, 1.8, 0.2],
            [-0.45, 1.6, 0.3], [0.45, 1.6, 0.3],
            [0, 2.1, 0], [-0.35, 2.05, 0], [0.35, 2.05, 0],
            [0, 1.7, -0.5], [-0.3, 1.7, -0.45], [0.3, 1.7, -0.45],
          ].map((pos, i) => (
            <mesh key={i} position={pos as [number, number, number]}>
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshStandardMaterial color={colorHex} roughness={0.85} />
            </mesh>
          ))}
        </group>
      );

    case "Curto":
      return (
        <group>
          <mesh position={[0, 1.74, 0]}>
            <sphereGeometry args={[0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            {mat}
          </mesh>
          {/* Short side wisps */}
          <mesh position={[-0.35, 1.55, 0.1]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color={colorHex} roughness={0.6} />
          </mesh>
          <mesh position={[0.35, 1.55, 0.1]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color={colorHex} roughness={0.6} />
          </mesh>
        </group>
      );

    case "Raspado":
      return (
        <mesh position={[0, 1.74, 0]}>
          <sphereGeometry args={[0.465, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
          <meshStandardMaterial color={colorHex} roughness={0.95} transparent opacity={0.6} />
        </mesh>
      );

    case "Trançado":
      return (
        <group>
          <mesh position={[0, 1.74, 0]}>
            <sphereGeometry args={[0.52, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            {mat}
          </mesh>
          {/* Left braid */}
          {[0, 1, 2, 3, 4, 5].map(i => (
            <mesh key={`lb${i}`} position={[-0.32, 1.3 - i * 0.15, -0.1 + (i % 2) * 0.06]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color={colorHex} roughness={0.65} />
            </mesh>
          ))}
          {/* Right braid */}
          {[0, 1, 2, 3, 4, 5].map(i => (
            <mesh key={`rb${i}`} position={[0.32, 1.3 - i * 0.15, -0.1 + (i % 2) * 0.06]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color={colorHex} roughness={0.65} />
            </mesh>
          ))}
        </group>
      );

    default:
      return (
        <mesh position={[0, 1.72, 0]}>
          <sphereGeometry args={[0.52, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          {mat}
        </mesh>
      );
  }
}

/* ─── Character Model built from primitives ─── */
function CharacterModel({ selections }: { selections: Record<string, string> }) {
  const skinHex = SKIN_HEX[selections.skinColor] || SKIN_HEX["Pele morena"];
  const hairHex = HAIR_HEX[selections.hairColor] || HAIR_HEX["Preto"];
  const eyeHex = EYE_HEX[selections.eyeColor] || EYE_HEX["Castanho"];
  const heightS = HEIGHT_SCALE[selections.height] || 1;
  const bodyW = BODY_WIDTH[selections.bodyType] || 1;

  const skinColor = useLerpColor(skinHex);
  const eyeColor = useLerpColor(eyeHex);

  const skinMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const eyeMatLRef = useRef<THREE.MeshStandardMaterial>(null);
  const eyeMatRRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (skinMatRef.current) skinMatRef.current.color.copy(skinColor.current);
    if (eyeMatLRef.current) eyeMatLRef.current.color.copy(eyeColor.current);
    if (eyeMatRRef.current) eyeMatRRef.current.color.copy(eyeColor.current);
  });

  // Lip color derived from skin
  const lipHex = useMemo(() => {
    const c = new THREE.Color(skinHex);
    c.offsetHSL(0.95, 0.25, -0.1);
    return `#${c.getHexString()}`;
  }, [skinHex]);

  return (
    <group scale={[1, heightS, 1]}>
      {/* ── Head ── */}
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial ref={skinMatRef} color={skinHex} roughness={0.5} metalness={0} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 1.5, 0.38]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color={skinHex} roughness={0.5} />
      </mesh>

      {/* ── Eyes ── */}
      {/* Eye whites */}
      <mesh position={[-0.14, 1.58, 0.34]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#f8f8ff" roughness={0.2} />
      </mesh>
      <mesh position={[0.14, 1.58, 0.34]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#f8f8ff" roughness={0.2} />
      </mesh>
      {/* Irises */}
      <mesh position={[-0.14, 1.58, 0.4]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial ref={eyeMatLRef} color={eyeHex} roughness={0.3} />
      </mesh>
      <mesh position={[0.14, 1.58, 0.4]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial ref={eyeMatRRef} color={eyeHex} roughness={0.3} />
      </mesh>
      {/* Pupils */}
      <mesh position={[-0.14, 1.58, 0.44]}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.1} />
      </mesh>
      <mesh position={[0.14, 1.58, 0.44]}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.1} />
      </mesh>
      {/* Eye highlights */}
      <mesh position={[-0.12, 1.6, 0.445]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.16, 1.6, 0.445]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>

      {/* Eyebrows */}
      <mesh position={[-0.14, 1.66, 0.36]} rotation={[0.2, 0, 0.15]}>
        <boxGeometry args={[0.12, 0.015, 0.03]} />
        <meshStandardMaterial color="#2a2020" roughness={0.8} />
      </mesh>
      <mesh position={[0.14, 1.66, 0.36]} rotation={[0.2, 0, -0.15]}>
        <boxGeometry args={[0.12, 0.015, 0.03]} />
        <meshStandardMaterial color="#2a2020" roughness={0.8} />
      </mesh>

      {/* Lips */}
      <mesh position={[0, 1.44, 0.36]}>
        <sphereGeometry args={[0.06, 16, 8]} />
        <meshStandardMaterial color={lipHex} roughness={0.35} />
      </mesh>

      {/* Cheek blush (subtle spheres) */}
      <mesh position={[-0.28, 1.48, 0.24]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#ff9999" transparent opacity={0.12} roughness={0.9} />
      </mesh>
      <mesh position={[0.28, 1.48, 0.24]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#ff9999" transparent opacity={0.12} roughness={0.9} />
      </mesh>

      {/* ── Hair ── */}
      <Hair type={selections.hairType || "Liso"} colorHex={hairHex} />

      {/* ── Neck ── */}
      <mesh position={[0, 1.18, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.18, 16]} />
        <meshStandardMaterial color={skinHex} roughness={0.5} />
      </mesh>

      {/* ── Torso ── */}
      <group scale={[bodyW, 1, 1]}>
        {/* Upper body */}
        <mesh position={[0, 0.88, 0]}>
          <cylinderGeometry args={[0.22, 0.28, 0.55, 16]} />
          <meshStandardMaterial color="#e8e0f0" roughness={0.4} />
        </mesh>
        {/* Lower body / hips */}
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.28, 0.22, 0.3, 16]} />
          <meshStandardMaterial color="#4a4070" roughness={0.4} />
        </mesh>
      </group>

      {/* ── Arms ── */}
      <mesh position={[-0.35 * bodyW, 0.9, 0]} rotation={[0, 0, 0.15]}>
        <cylinderGeometry args={[0.05, 0.045, 0.55, 12]} />
        <meshStandardMaterial color={skinHex} roughness={0.5} />
      </mesh>
      <mesh position={[0.35 * bodyW, 0.9, 0]} rotation={[0, 0, -0.15]}>
        <cylinderGeometry args={[0.05, 0.045, 0.55, 12]} />
        <meshStandardMaterial color={skinHex} roughness={0.5} />
      </mesh>
      {/* Hands */}
      <mesh position={[-0.39 * bodyW, 0.62, 0]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color={skinHex} roughness={0.5} />
      </mesh>
      <mesh position={[0.39 * bodyW, 0.62, 0]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color={skinHex} roughness={0.5} />
      </mesh>

      {/* ── Legs ── */}
      <mesh position={[-0.12, 0.22, 0]}>
        <cylinderGeometry args={[0.07, 0.06, 0.45, 12]} />
        <meshStandardMaterial color="#4a4070" roughness={0.4} />
      </mesh>
      <mesh position={[0.12, 0.22, 0]}>
        <cylinderGeometry args={[0.07, 0.06, 0.45, 12]} />
        <meshStandardMaterial color="#4a4070" roughness={0.4} />
      </mesh>
      {/* Shoes */}
      <mesh position={[-0.12, -0.02, 0.04]}>
        <boxGeometry args={[0.08, 0.06, 0.14]} />
        <meshStandardMaterial color="#2a2030" roughness={0.3} />
      </mesh>
      <mesh position={[0.12, -0.02, 0.04]}>
        <boxGeometry args={[0.08, 0.06, 0.14]} />
        <meshStandardMaterial color="#2a2030" roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ─── Slow auto-rotate ─── */
function AutoRotate() {
  const controlsRef = useRef<any>(null);
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 1.5;
      controlsRef.current.update();
    }
  });
  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={false}
      minPolarAngle={Math.PI * 0.35}
      maxPolarAngle={Math.PI * 0.65}
      autoRotate
      autoRotateSpeed={1.5}
    />
  );
}

/* ─── Main exported component ─── */
export function AvatarPreview3D({ selections }: AvatarPreview3DProps) {
  return (
    <div className="w-full aspect-[3/4] rounded-xl overflow-hidden" style={{ minHeight: 300 }}>
      <Canvas
        camera={{ position: [0, 1.2, 3], fov: 35 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-2, 3, -3]} intensity={0.4} color="#aaccff" />
        {/* Rim light */}
        <pointLight position={[0, 2, -3]} intensity={0.6} color="#ff88cc" />

        <CharacterModel selections={selections} />
        <AutoRotate />
      </Canvas>
    </div>
  );
}
