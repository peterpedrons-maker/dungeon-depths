import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame, type EnemyState } from "../systems/gameState";
import { createPS1Material } from "../materials/ps1Material";
import { statueTex } from "../materials/textures";
import type { DungeonLevel } from "../data/dungeon";
import type { Collider } from "./Level";

const SIGHT = 9;
const ATTACK_RANGE = 1.3;
const SPEED = 1.7;
const ATTACK_DAMAGE = 8;
const ATTACK_COOLDOWN = 1.4;

export function Enemies({
  level,
  colliders,
}: {
  level: DungeonLevel;
  colliders: Collider[];
}) {
  const enemies = useGame((s) => s.enemies);
  const updateEnemy = useGame((s) => s.updateEnemy);
  const damagePlayer = useGame((s) => s.damagePlayer);
  const { camera } = useThree();

  const boneMat = useMemo(
    () =>
      createPS1Material({
        map: statueTex(),
        color: 0xeae5d2,
        fogColor: level.fogColor,
        fogNear: level.fogNear,
        fogFar: level.fogFar,
      }),
    [level],
  );

  useFrame((_, dt) => {
    const px = camera.position.x;
    const pz = camera.position.z;
    for (const e of enemies) {
      if (e.state === "dead") continue;
      const dx = px - e.x;
      const dz = pz - e.z;
      const dist = Math.hypot(dx, dz);
      let { state, x, z, facing, stateTimer, hitCooldown } = e;
      stateTimer = Math.max(0, stateTimer - dt);
      hitCooldown = Math.max(0, hitCooldown - dt);
      if (state === "hurt") {
        if (stateTimer <= 0) state = "chase";
      } else if (state === "attack") {
        if (stateTimer <= 0) state = "chase";
      } else if (dist < SIGHT) {
        state = dist <= ATTACK_RANGE ? "attack" : "chase";
      } else if (state !== "idle") {
        state = "idle";
      }

      if (state === "chase" && dist > 0.01) {
        facing = Math.atan2(dx, dz);
        const stepX = (dx / dist) * SPEED * dt;
        const stepZ = (dz / dist) * SPEED * dt;
        const nx = x + stepX;
        if (!hitsWall(nx, z, colliders)) x = nx;
        const nz = z + stepZ;
        if (!hitsWall(x, nz, colliders)) z = nz;
      }

      if (state === "attack" && hitCooldown === 0) {
        damagePlayer(ATTACK_DAMAGE);
        hitCooldown = ATTACK_COOLDOWN;
        stateTimer = 0.6;
      }

      updateEnemy(e.id, { x, z, state, facing, stateTimer, hitCooldown });
    }
  });

  return (
    <group>
      {enemies.map((e) => (
        <Skeleton key={e.id} enemy={e} mat={boneMat} />
      ))}
    </group>
  );
}

function hitsWall(x: number, z: number, colliders: Collider[]): boolean {
  const r = 0.3;
  for (const c of colliders) {
    const cx = Math.max(c.minX, Math.min(x, c.maxX));
    const cz = Math.max(c.minZ, Math.min(z, c.maxZ));
    const dx = x - cx;
    const dz = z - cz;
    if (dx * dx + dz * dz < r * r) return true;
  }
  return false;
}

function Skeleton({ enemy, mat }: { enemy: EnemyState; mat: THREE.ShaderMaterial }) {
  const group = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.position.set(enemy.x, 0, enemy.z);
    group.current.rotation.y = enemy.facing;
    const t = clock.elapsedTime * 6 + enemy.x;
    const walking = enemy.state === "chase";
    const swing = walking ? Math.sin(t) * 0.6 : 0;
    const atk = enemy.state === "attack" ? Math.sin(clock.elapsedTime * 12) * 0.8 : 0;
    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
    if (leftArm.current) leftArm.current.rotation.x = -swing * 0.5 + atk;
    if (rightArm.current) rightArm.current.rotation.x = swing * 0.5 - atk;

    // hurt shake / dead fall
    if (enemy.state === "hurt") {
      group.current.position.x += (Math.random() - 0.5) * 0.05;
    }
    if (enemy.state === "dead") {
      group.current.rotation.x = Math.PI / 2;
      group.current.position.y = 0.3;
    } else {
      group.current.rotation.x = 0;
      group.current.position.y = 0;
    }
  });

  return (
    <group ref={group}>
      {/* pelvis */}
      <mesh position={[0, 0.85, 0]} material={mat}>
        <boxGeometry args={[0.35, 0.2, 0.22]} />
      </mesh>
      {/* torso */}
      <mesh position={[0, 1.2, 0]} material={mat}>
        <boxGeometry args={[0.4, 0.5, 0.25]} />
      </mesh>
      {/* ribs detail */}
      <mesh position={[0, 1.2, 0.13]} material={mat}>
        <boxGeometry args={[0.42, 0.08, 0.02]} />
      </mesh>
      {/* head (skull) */}
      <mesh position={[0, 1.6, 0]} material={mat}>
        <boxGeometry args={[0.28, 0.28, 0.28]} />
      </mesh>
      {/* eye sockets */}
      <mesh position={[-0.07, 1.62, 0.141]}>
        <boxGeometry args={[0.06, 0.06, 0.01]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      <mesh position={[0.07, 1.62, 0.141]}>
        <boxGeometry args={[0.06, 0.06, 0.01]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      {/* arms (pivot at shoulder) */}
      <group position={[-0.25, 1.4, 0]}>
        <mesh ref={leftArm} position={[0, -0.3, 0]} material={mat}>
          <boxGeometry args={[0.1, 0.6, 0.1]} />
        </mesh>
      </group>
      <group position={[0.25, 1.4, 0]}>
        <mesh ref={rightArm} position={[0, -0.3, 0]} material={mat}>
          <boxGeometry args={[0.1, 0.6, 0.1]} />
        </mesh>
        {/* sword */}
        <mesh position={[0, -0.7, 0.2]} material={mat}>
          <boxGeometry args={[0.04, 0.6, 0.06]} />
        </mesh>
      </group>
      {/* legs (pivot at hip) */}
      <group position={[-0.1, 0.75, 0]}>
        <mesh ref={leftLeg} position={[0, -0.4, 0]} material={mat}>
          <boxGeometry args={[0.12, 0.75, 0.12]} />
        </mesh>
      </group>
      <group position={[0.1, 0.75, 0]}>
        <mesh ref={rightLeg} position={[0, -0.4, 0]} material={mat}>
          <boxGeometry args={[0.12, 0.75, 0.12]} />
        </mesh>
      </group>
    </group>
  );
}
