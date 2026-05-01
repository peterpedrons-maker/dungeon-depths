import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Collider } from "../components/Level";

const PLAYER_RADIUS = 0.35;
const EYE_HEIGHT = 1.55;
const WALK_SPEED = 3.2;
const RUN_SPEED = 5.4;
const MOUSE_SENS = 0.0022;

interface PlayerState {
  yaw: number;
  pitch: number;
  pos: THREE.Vector3;
  velY: number;
  onGround: boolean;
  stamina: number;
  bobT: number;
}

export function Player({
  spawn,
  colliders,
  onStaminaChange,
}: {
  spawn: [number, number, number];
  colliders: Collider[];
  onStaminaChange?: (s: number) => void;
}) {
  const { camera, gl } = useThree();
  const keys = useRef<Set<string>>(new Set());
  const state = useRef<PlayerState>({
    yaw: 0,
    pitch: 0,
    pos: new THREE.Vector3(spawn[0], spawn[1], spawn[2]),
    velY: 0,
    onGround: true,
    stamina: 100,
    bobT: 0,
  });

  useEffect(() => {
    state.current.pos.set(spawn[0], spawn[1], spawn[2]);
  }, [spawn]);

  // Pointer lock
  useEffect(() => {
    const canvas = gl.domElement;
    const onClick = () => {
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
      }
    };
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      state.current.yaw -= e.movementX * MOUSE_SENS;
      state.current.pitch -= e.movementY * MOUSE_SENS;
      state.current.pitch = Math.max(
        -Math.PI / 2 + 0.1,
        Math.min(Math.PI / 2 - 0.1, state.current.pitch),
      );
    };
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
    };
    canvas.addEventListener("click", onClick);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [gl]);

  useFrame((_, dt) => {
    const s = state.current;
    const k = keys.current;
    let mx = 0;
    let mz = 0;
    if (k.has("KeyW")) mz -= 1;
    if (k.has("KeyS")) mz += 1;
    if (k.has("KeyA")) mx -= 1;
    if (k.has("KeyD")) mx += 1;
    const wantRun = k.has("ShiftLeft") || k.has("ShiftRight");
    const moving = mx !== 0 || mz !== 0;
    const canRun = wantRun && s.stamina > 0;
    const speed = canRun && moving ? RUN_SPEED : WALK_SPEED;

    // Stamina
    if (canRun && moving) {
      s.stamina = Math.max(0, s.stamina - dt * 25);
    } else {
      s.stamina = Math.min(100, s.stamina + dt * 18);
    }
    onStaminaChange?.(s.stamina);

    if (moving) {
      const len = Math.hypot(mx, mz);
      mx /= len;
      mz /= len;
      const cos = Math.cos(s.yaw);
      const sin = Math.sin(s.yaw);
      // forward in world: -z when yaw=0
      const fx = -sin;
      const fz = -cos;
      const rx = cos;
      const rz = -sin;
      const dx = (fx * -mz + rx * mx) * speed * dt;
      const dz = (fz * -mz + rz * mx) * speed * dt;

      // Move with collision (axis-separated)
      const nx = s.pos.x + dx;
      if (!collide(nx, s.pos.z, colliders)) s.pos.x = nx;
      const nz = s.pos.z + dz;
      if (!collide(s.pos.x, nz, colliders)) s.pos.z = nz;

      s.bobT += dt * (canRun ? 12 : 8);
    } else {
      // settle bob
      s.bobT *= 0.9;
    }

    const bob = Math.sin(s.bobT) * 0.04;
    camera.position.set(s.pos.x, EYE_HEIGHT + bob, s.pos.z);
    camera.rotation.order = "YXZ";
    camera.rotation.set(s.pitch, s.yaw, 0);
  });

  return null;
}

function collide(x: number, z: number, colliders: Collider[]): boolean {
  for (const c of colliders) {
    const cx = Math.max(c.minX, Math.min(x, c.maxX));
    const cz = Math.max(c.minZ, Math.min(z, c.maxZ));
    const dx = x - cx;
    const dz = z - cz;
    if (dx * dx + dz * dz < PLAYER_RADIUS * PLAYER_RADIUS) return true;
  }
  return false;
}
