import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { LEVELS } from "./data/dungeon";
import { Level, parseLevel } from "./components/Level";
import { Player } from "./systems/Player";
import { PixelRenderer } from "./components/PixelRenderer";
import { HUD } from "./components/HUD";

export function Game({ levelId = "hub" }: { levelId?: string }) {
  const level = LEVELS[levelId] ?? LEVELS.hub;
  const data = useMemo(() => parseLevel(level), [level]);
  const [stamina, setStamina] = useState(100);
  const [hint, setHint] = useState(true);
  const lastStaminaUpdate = useRef(0);

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
      <HUD
        hp={100}
        maxHp={100}
        mp={50}
        maxMp={50}
        stamina={stamina}
        locationName={level.name}
        showHint={hint}
      />
    </div>
  );
}
