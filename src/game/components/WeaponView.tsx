import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../systems/gameState";
import { createPS1Material } from "../materials/ps1Material";
import { metalTex, woodTex } from "../materials/textures";
import type { DungeonLevel } from "../data/dungeon";

/**
 * First-person weapon viewmodel — short sword. Attaches to the camera.
 * Animated by the swing state in useGame.
 */
export function WeaponView({ level }: { level: DungeonLevel }) {
  const { camera } = useThree();
  const group = useRef<THREE.Group>(null);
  const blade = useMemo(
    () =>
      createPS1Material({
        map: metalTex(),
        fogColor: level.fogColor,
        fogNear: level.fogNear,
        fogFar: level.fogFar,
      }),
    [level],
  );
  const grip = useMemo(
    () =>
      createPS1Material({
        map: woodTex(),
        fogColor: level.fogColor,
        fogNear: level.fogNear,
        fogFar: level.fogFar,
      }),
    [level],
  );

  useFrame(() => {
    if (!group.current) return;
    const { swingActive, swingT } = useGame.getState();
    // Attach to camera each frame
    camera.add(group.current);

    let rotZ = -0.25;
    let rotX = -0.1;
    let posX = 0.32;
    let posY = -0.28;
    let posZ = -0.55;

    if (swingActive) {
      // windup -> slash -> recovery (swingT 0..1)
      const t = swingT;
      // overhead chop animation
      let s = 0;
      if (t < 0.3) s = -t / 0.3; // wind up (-1)
      else if (t < 0.55) s = -1 + ((t - 0.3) / 0.25) * 2; // slash to +1
      else s = 1 - (t - 0.55) / 0.45; // recover
      rotX = -0.1 + s * 1.2;
      rotZ = -0.25 - s * 0.5;
      posY = -0.28 - Math.abs(s) * 0.05;
    }

    group.current.position.set(posX, posY, posZ);
    group.current.rotation.set(rotX, 0, rotZ);
  });

  return (
    <group ref={group}>
      {/* grip */}
      <mesh position={[0, 0, 0]} material={grip}>
        <boxGeometry args={[0.06, 0.18, 0.06]} />
      </mesh>
      {/* guard */}
      <mesh position={[0, 0.12, 0]} material={blade}>
        <boxGeometry args={[0.22, 0.04, 0.08]} />
      </mesh>
      {/* blade */}
      <mesh position={[0, 0.5, 0]} material={blade}>
        <boxGeometry args={[0.07, 0.7, 0.02]} />
      </mesh>
      {/* tip */}
      <mesh position={[0, 0.88, 0]} rotation={[0, 0, Math.PI / 4]} material={blade}>
        <boxGeometry args={[0.05, 0.05, 0.02]} />
      </mesh>
    </group>
  );
}
