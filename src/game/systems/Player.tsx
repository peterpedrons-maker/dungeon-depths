import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Collider } from "../components/Level";
import { useInput } from "./input";
import { useGame } from "./gameState";

const PLAYER_RADIUS = 0.35;
const EYE_HEIGHT = 1.55;
const WALK_SPEED = 3.2;
const RUN_SPEED = 5.4;
const MOUSE_SENS = 0.0022;
const SWING_DURATION = 0.55; // seconds total
const SWING_HIT_START = 0.18;
const SWING_HIT_END = 0.38;
const WEAPON_RANGE = 1.6;
const WEAPON_DAMAGE = 25;

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
  const swingRef = useRef({ active: false, t: 0, hitDone: false });

  useEffect(() => {
    state.current.pos.set(spawn[0], spawn[1], spawn[2]);
  }, [spawn]);

  // Pointer lock
  useEffect(() => {
    const canvas = gl.domElement;
    const isTouch = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
    useInput.getState().setTouch(isTouch);
    const onClick = () => {
      if (isTouch) return; // touch uses joystick UI
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
    const onMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      if (e.button === 0) useInput.getState().pressAttack();
      if (e.button === 2) useInput.getState().setBlock(true);
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) useInput.getState().setAttackHeld(false);
      if (e.button === 2) useInput.getState().setBlock(false);
    };
    const onContext = (e: MouseEvent) => e.preventDefault();
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      if (e.code === "KeyF") useInput.getState().pressInteract();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
    };
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("contextmenu", onContext);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("contextmenu", onContext);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [gl]);

  useFrame((_, dt) => {
    const s = state.current;
    const k = keys.current;
    const input = useInput.getState();

    // Apply touch look
    const look = input.consumeLook();
    if (look.dx !== 0 || look.dy !== 0) {
      s.yaw -= look.dx * MOUSE_SENS * 1.4;
      s.pitch -= look.dy * MOUSE_SENS * 1.4;
      s.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, s.pitch));
    }

    let mx = 0;
    let mz = 0;
    if (k.has("KeyW")) mz -= 1;
    if (k.has("KeyS")) mz += 1;
    if (k.has("KeyA")) mx -= 1;
    if (k.has("KeyD")) mx += 1;
    // touch joystick adds to keyboard
    mx += input.moveX;
    mz += input.moveY;
    // clamp to unit circle
    const ml = Math.hypot(mx, mz);
    if (ml > 1) {
      mx /= ml;
      mz /= ml;
    }
    const wantRun = k.has("ShiftLeft") || k.has("ShiftRight") || input.run;
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

    // === Weapon swing ===
    const game = useGame.getState();
    const sw = swingRef.current;
    if (input.attack && !sw.active && s.stamina >= 15) {
      sw.active = true;
      sw.t = 0;
      sw.hitDone = false;
      s.stamina = Math.max(0, s.stamina - 15);
      game.startSwing();
      // single-press unless held; clear edge
      input.setAttackHeld(false);
    }
    if (sw.active) {
      sw.t += dt;
      const phase = sw.t / SWING_DURATION;
      game.setSwing(true, Math.min(1, phase));
      if (!sw.hitDone && sw.t >= SWING_HIT_START && sw.t <= SWING_HIT_END) {
        // do hit detection: enemies in cone in front
        const cosA = Math.cos(s.yaw);
        const sinA = Math.sin(s.yaw);
        const fwdX = -sinA;
        const fwdZ = -cosA;
        for (const en of game.enemies) {
          if (en.state === "dead") continue;
          const dx = en.x - s.pos.x;
          const dz = en.z - s.pos.z;
          const dist = Math.hypot(dx, dz);
          if (dist > WEAPON_RANGE) continue;
          const dot = (dx / (dist || 1)) * fwdX + (dz / (dist || 1)) * fwdZ;
          if (dot > 0.4) {
            game.damageEnemy(en.id, WEAPON_DAMAGE);
          }
        }
        sw.hitDone = true;
      }
      if (sw.t >= SWING_DURATION) {
        sw.active = false;
        game.setSwing(false, 0);
      }
    }

    // tick flash + message timers
    if (game.damageFlash > 0) game.tickFlash(dt);
    if (game.message) game.tickMessage(dt);
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
