import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { createPS1Material } from "../materials/ps1Material";
import {
  metalTex,
  statueTex,
  stoneWallTex,
  woodTex,
} from "../materials/textures";
import type { DungeonLevel } from "../data/dungeon";

interface PropProps {
  type: string;
  position: [number, number, number];
  rotY: number;
  level: DungeonLevel;
}

type SubProps = Omit<PropProps, "type">;

const matCache = new Map<string, THREE.ShaderMaterial>();
function cachedMat(key: string, factory: () => THREE.ShaderMaterial) {
  let m = matCache.get(key);
  if (!m) {
    m = factory();
    matCache.set(key, m);
  }
  return m;
}

function fogOptsFor(level: DungeonLevel) {
  return {
    fogColor: level.fogColor,
    fogNear: level.fogNear,
    fogFar: level.fogFar,
  };
}

export function Prop({ type, position, rotY, level }: PropProps) {
  switch (type) {
    case "torch":
      return <Torch position={position} rotY={rotY} level={level} />;
    case "pillar":
      return <Pillar position={position} rotY={rotY} level={level} />;
    case "statue":
      return <Statue position={position} rotY={rotY} level={level} />;
    case "chest":
      return <Chest position={position} rotY={rotY} level={level} />;
    case "barrel":
      return <Barrel position={position} rotY={rotY} level={level} />;
    case "bookshelf":
      return <Bookshelf position={position} rotY={rotY} level={level} />;
    case "altar":
      return <Altar position={position} rotY={rotY} level={level} />;
    case "fountain":
      return <Fountain position={position} rotY={rotY} level={level} />;
    case "bones":
      return <Bones position={position} rotY={rotY} level={level} />;
    case "rubble":
      return <Rubble position={position} rotY={rotY} level={level} />;
    case "candle":
      return <Candle position={position} rotY={rotY} level={level} />;
    default:
      return null;
  }
}

function Pillar({ position, level }: SubProps) {
  const mat = useMemo(
    () => cachedMat(`pillar-${level.id}`, () => createPS1Material({ map: stoneWallTex(), ...fogOptsFor(level) })),
    [level],
  );
  return (
    <group position={position}>
      <mesh position={[0, 0.1, 0]} material={mat}>
        <boxGeometry args={[0.9, 0.2, 0.9]} />
      </mesh>
      <mesh position={[0, 1.5, 0]} material={mat}>
        <cylinderGeometry args={[0.35, 0.4, 2.6, 8]} />
      </mesh>
      <mesh position={[0, 2.95, 0]} material={mat}>
        <boxGeometry args={[0.9, 0.2, 0.9]} />
      </mesh>
    </group>
  );
}

function Torch({ position, rotY, level }: SubProps) {
  const woodMat = useMemo(
    () => cachedMat(`torch-${level.id}`, () => createPS1Material({ map: woodTex(), ...fogOptsFor(level) })),
    [level],
  );
  const flameRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 8 + position[0] * 3 + position[2] * 5;
    const flick = 0.85 + Math.sin(t) * 0.1 + Math.sin(t * 2.7) * 0.05;
    if (flameRef.current) {
      flameRef.current.scale.set(flick, flick * 1.2, flick);
    }
    if (lightRef.current) {
      lightRef.current.intensity = 1.2 * flick;
    }
  });
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, 1.2, 0]} material={woodMat}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 6]} />
      </mesh>
      <mesh ref={flameRef} position={[0, 1.55, 0]}>
        <coneGeometry args={[0.12, 0.3, 6]} />
        <meshBasicMaterial color="#ff8030" toneMapped={false} />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, 1.55, 0]}
        color="#ff7020"
        intensity={1.2}
        distance={6}
        decay={2}
      />
    </group>
  );
}

function Statue({ position, rotY, level }: SubProps) {
  const mat = useMemo(
    () => cachedMat(`statue-${level.id}`, () => createPS1Material({ map: statueTex(), ...fogOptsFor(level) })),
    [level],
  );
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* base */}
      <mesh position={[0, 0.15, 0]} material={mat}>
        <boxGeometry args={[0.7, 0.3, 0.7]} />
      </mesh>
      {/* legs */}
      <mesh position={[0, 0.85, 0]} material={mat}>
        <boxGeometry args={[0.4, 1.1, 0.3]} />
      </mesh>
      {/* torso */}
      <mesh position={[0, 1.65, 0]} material={mat}>
        <boxGeometry args={[0.55, 0.6, 0.35]} />
      </mesh>
      {/* head */}
      <mesh position={[0, 2.1, 0]} material={mat}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
      </mesh>
      {/* arms holding sword */}
      <mesh position={[0, 1.4, 0.25]} material={mat}>
        <boxGeometry args={[0.15, 0.9, 0.15]} />
      </mesh>
      <mesh position={[0, 1.6, 0.42]} rotation={[0.3, 0, 0]} material={mat}>
        <boxGeometry args={[0.08, 1.4, 0.08]} />
      </mesh>
    </group>
  );
}

function Chest({ position, rotY, level }: SubProps) {
  const wood = useMemo(
    () => cachedMat(`chest-w-${level.id}`, () => createPS1Material({ map: woodTex(), ...fogOptsFor(level) })),
    [level],
  );
  const metal = useMemo(
    () => cachedMat(`chest-m-${level.id}`, () => createPS1Material({ map: metalTex(), ...fogOptsFor(level) })),
    [level],
  );
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.3, 0]} material={wood}>
        <boxGeometry args={[0.9, 0.6, 0.6]} />
      </mesh>
      <mesh position={[0, 0.7, 0]} material={wood}>
        <boxGeometry args={[0.9, 0.2, 0.6]} />
      </mesh>
      <mesh position={[0, 0.65, 0.31]} material={metal}>
        <boxGeometry args={[0.15, 0.2, 0.04]} />
      </mesh>
    </group>
  );
}

function Barrel({ position, rotY, level }: SubProps) {
  const mat = useMemo(
    () => cachedMat(`barrel-${level.id}`, () => createPS1Material({ map: woodTex(), ...fogOptsFor(level) })),
    [level],
  );
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.45, 0]} material={mat}>
        <cylinderGeometry args={[0.4, 0.35, 0.9, 10]} />
      </mesh>
    </group>
  );
}

function Bookshelf({ position, rotY, level }: SubProps) {
  const wood = useMemo(
    () => cachedMat(`shelf-${level.id}`, () => createPS1Material({ map: woodTex(), ...fogOptsFor(level) })),
    [level],
  );
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, 1.2, 0]} material={wood}>
        <boxGeometry args={[1.2, 2.4, 0.4]} />
      </mesh>
      {/* book color blocks */}
      {[0.3, 0.9, 1.5, 2.1].map((y, i) => (
        <mesh key={i} position={[0, y, 0.22]}>
          <boxGeometry args={[1.0, 0.4, 0.05]} />
          <meshBasicMaterial color={["#5a2820", "#3a4060", "#604030", "#3a3a3a"][i]} />
        </mesh>
      ))}
    </group>
  );
}

function Altar({ position, rotY, level }: SubProps) {
  const mat = useMemo(
    () => cachedMat(`altar-${level.id}`, () => createPS1Material({ map: stoneWallTex(), ...fogOptsFor(level) })),
    [level],
  );
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.1, 0]} material={mat}>
        <boxGeometry args={[1.4, 0.2, 1.4]} />
      </mesh>
      <mesh position={[0, 0.55, 0]} material={mat}>
        <boxGeometry args={[1.0, 0.7, 1.0]} />
      </mesh>
      <mesh position={[0, 1.0, 0]} material={mat}>
        <boxGeometry args={[1.4, 0.15, 1.4]} />
      </mesh>
      {/* glowing rune */}
      <mesh position={[0, 1.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.45, 8]} />
        <meshBasicMaterial color="#80c0ff" toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 1.3, 0]} color="#80c0ff" intensity={0.8} distance={4} />
    </group>
  );
}

function Fountain({ position, level }: SubProps) {
  const mat = useMemo(
    () => cachedMat(`fountain-${level.id}`, () => createPS1Material({ map: stoneWallTex(), ...fogOptsFor(level) })),
    [level],
  );
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} material={mat}>
        <cylinderGeometry args={[0.95, 1.0, 0.4, 12]} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.05, 12]} />
        <meshBasicMaterial color="#3060a0" transparent opacity={0.85} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.9, 0]} material={mat}>
        <cylinderGeometry args={[0.15, 0.2, 1.0, 8]} />
      </mesh>
      <mesh position={[0, 1.5, 0]} material={mat}>
        <sphereGeometry args={[0.25, 8, 6]} />
      </mesh>
      <pointLight position={[0, 1.0, 0]} color="#60a0ff" intensity={0.9} distance={5} />
    </group>
  );
}

function Bones({ position, rotY }: SubProps) {
  return (
    <group position={[position[0], 0.05, position[2]]} rotation={[0, rotY, 0]}>
      <mesh>
        <boxGeometry args={[0.4, 0.08, 0.08]} />
        <meshBasicMaterial color="#c8c0a8" />
      </mesh>
      <mesh position={[0.05, 0.04, 0.15]} rotation={[0, 0.6, 0]}>
        <boxGeometry args={[0.3, 0.06, 0.06]} />
        <meshBasicMaterial color="#c8c0a8" />
      </mesh>
      <mesh position={[0.2, 0.06, -0.05]}>
        <sphereGeometry args={[0.08, 6, 4]} />
        <meshBasicMaterial color="#d8d0b8" />
      </mesh>
    </group>
  );
}

function Rubble({ position, rotY, level }: SubProps) {
  const mat = useMemo(
    () => cachedMat(`rubble-${level.id}`, () => createPS1Material({ map: stoneWallTex(), ...fogOptsFor(level) })),
    [level],
  );
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.1, 0]} material={mat}>
        <boxGeometry args={[0.3, 0.2, 0.3]} />
      </mesh>
      <mesh position={[0.18, 0.06, 0.1]} material={mat}>
        <boxGeometry args={[0.18, 0.12, 0.15]} />
      </mesh>
      <mesh position={[-0.15, 0.05, -0.1]} material={mat}>
        <boxGeometry args={[0.15, 0.1, 0.12]} />
      </mesh>
    </group>
  );
}

function Candle({ position, rotY }: SubProps) {
  const flameRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (flameRef.current) {
      const t = clock.elapsedTime * 9 + position[0] + position[2];
      const f = 0.9 + Math.sin(t) * 0.1;
      flameRef.current.scale.set(f, f * 1.3, f);
    }
  });
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.24, 6]} />
        <meshBasicMaterial color="#e8d8b8" />
      </mesh>
      <mesh ref={flameRef} position={[0, 0.3, 0]}>
        <coneGeometry args={[0.04, 0.1, 5]} />
        <meshBasicMaterial color="#ffb060" toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.3, 0]} color="#ff9040" intensity={0.4} distance={2.5} />
    </group>
  );
}
