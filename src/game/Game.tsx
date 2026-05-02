import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { LEVELS } from "./data/dungeon";
import { Level, parseLevel } from "./components/Level";
import { Player } from "./systems/Player";
import { PixelRenderer } from "./components/PixelRenderer";
import { HUD } from "./components/HUD";
import { Enemies } from "./components/Enemy";
import { WeaponView } from "./components/WeaponView";
import { TouchControls } from "./components/TouchControls";
import { useGame } from "./systems/gameState";

export function Game({ levelId = "hub" }: { levelId?: string }) {
  const level = LEVELS[levelId] ?? LEVELS.hub;
  const data = useMemo(() => parseLevel(level), [level]);
  const [stamina, setStamina] = useState(100);
  const [hint, setHint] = useState(true);
  const lastStaminaUpdate = useRef(0);
  const setEnemies = useGame((s) => s.setEnemies);
  const reset = useGame((s) => s.reset);

  useEffect(() => {
    reset();
    setEnemies(
      data.enemySpawns.map((e, i) => ({
        id: `sk${i}`,
        type: "skeleton" as const,
        x: e.x,
        z: e.z,
        hp: 50,
        maxHp: 50,
        state: "idle" as const,
        facing: 0,
        stateTimer: 0,
        hitCooldown: 0,
      })),
    );
  }, [data, setEnemies, reset]);

  return (
    <div className="fixed inset-0 bg-black">
      <Canvas
        gl={{ antialias: false, powerPreference: "high-performance" }}
        dpr={1}
        camera={{ fov: 70, near: 0.05, far: 60, position: [0, 1.5, 0] }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(level.fogColor));
        }}
        onPointerDown={() => setHint(false)}
      >
        <Suspense fallback={null}>
          <PixelRenderer internalWidth={480} internalHeight={360} />
          <ambientLight intensity={0.25} color="#6080a0" />
          <Level level={level} data={data} />
          <Enemies level={level} colliders={data.colliders} />
          <WeaponView level={level} />
          <Player
            spawn={data.spawn}
            colliders={data.colliders}
            onStaminaChange={(s) => {
              const now = performance.now();
              if (now - lastStaminaUpdate.current > 80) {
                lastStaminaUpdate.current = now;
                setStamina(s);
              }
            }}
          />
        </Suspense>
      </Canvas>
      <HUDBound stamina={stamina} locationName={level.name} showHint={hint} />
      <TouchControls />
    </div>
  );
}

function HUDBound({
  stamina,
  locationName,
  showHint,
}: {
  stamina: number;
  locationName: string;
  showHint: boolean;
}) {
  const hp = useGame((s) => s.hp);
  const maxHp = useGame((s) => s.maxHp);
  const mp = useGame((s) => s.mp);
  const maxMp = useGame((s) => s.maxMp);
  const flash = useGame((s) => s.damageFlash);
  const message = useGame((s) => s.message);
  return (
    <>
      <HUD
        hp={hp}
        maxHp={maxHp}
        mp={mp}
        maxMp={maxMp}
        stamina={stamina}
        locationName={locationName}
        showHint={showHint}
        message={message}
      />
      {flash > 0 && (
        <div
          className="pointer-events-none fixed inset-0 z-10"
          style={{
            background: `radial-gradient(ellipse at center, transparent 30%, rgba(180,20,20,${0.6 * flash}))`,
          }}
        />
      )}
    </>
  );
}
