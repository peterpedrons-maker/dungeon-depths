import { useMemo } from "react";
import * as THREE from "three";
import { TILE_SIZE, WALL_HEIGHT, type DungeonLevel } from "../data/dungeon";
import { createPS1Material } from "../materials/ps1Material";
import {
  ceilingTex,
  floorTex,
  stoneWallTex,
} from "../materials/textures";
import { Prop } from "./Props";

export interface Collider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface LevelData {
  walls: { x: number; z: number }[];
  floors: { x: number; z: number }[];
  props: { type: string; x: number; z: number; rot: number }[];
  spawn: [number, number, number];
  colliders: Collider[];
}

export function parseLevel(level: DungeonLevel): LevelData {
  const walls: { x: number; z: number }[] = [];
  const floors: { x: number; z: number }[] = [];
  const props: { type: string; x: number; z: number; rot: number }[] = [];
  const colliders: Collider[] = [];
  let spawn: [number, number, number] = [0, 1.5, 0];

  const rows = level.grid;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      const wx = (c - row.length / 2) * TILE_SIZE;
      const wz = (r - rows.length / 2) * TILE_SIZE;
      if (ch === "#" || ch === "M") {
        walls.push({ x: wx, z: wz });
        colliders.push({
          minX: wx - TILE_SIZE / 2,
          maxX: wx + TILE_SIZE / 2,
          minZ: wz - TILE_SIZE / 2,
          maxZ: wz + TILE_SIZE / 2,
        });
      } else {
        floors.push({ x: wx, z: wz });
        if (ch === "X") spawn = [wx, 1.4, wz];
        const propType = tileToProp(ch);
        if (propType) {
          props.push({
            type: propType,
            x: wx,
            z: wz,
            rot: pseudoRandom(c * 13 + r * 7) * Math.PI * 2,
          });
          // small collider for solid props
          if (["P", "S", "F", "C", "B", "K", "A"].includes(ch)) {
            const r2 = ch === "P" || ch === "S" ? 0.45 : 0.6;
            colliders.push({
              minX: wx - r2,
              maxX: wx + r2,
              minZ: wz - r2,
              maxZ: wz + r2,
            });
          }
        }
      }
    }
  }

  return { walls, floors, props, spawn, colliders };
}

function tileToProp(ch: string): string | null {
  switch (ch) {
    case "T":
      return "torch";
    case "P":
      return "pillar";
    case "S":
      return "statue";
    case "C":
      return "chest";
    case "B":
      return "barrel";
    case "K":
      return "bookshelf";
    case "A":
      return "altar";
    case "F":
      return "fountain";
    default:
      return null;
  }
}

function pseudoRandom(n: number): number {
  const x = Math.sin(n * 9999) * 43758.5453;
  return x - Math.floor(x);
}

export function Level({ level, data }: { level: DungeonLevel; data: LevelData }) {
  const { wallMat, floorMat, ceilMat } = useMemo(() => {
    const fogOpts = {
      fogColor: level.fogColor,
      fogNear: level.fogNear,
      fogFar: level.fogFar,
    };
    return {
      wallMat: createPS1Material({ map: stoneWallTex(), ...fogOpts }),
      floorMat: createPS1Material({ map: floorTex(), ...fogOpts }),
      ceilMat: createPS1Material({ map: ceilingTex(), ...fogOpts }),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id]);

  // Instanced walls
  const wallGeom = useMemo(
    () => new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, TILE_SIZE),
    [],
  );
  const floorGeom = useMemo(
    () => new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE),
    [],
  );

  return (
    <group>
      {/* Walls */}
      {data.walls.map((w, i) => (
        <mesh
          key={`w${i}`}
          geometry={wallGeom}
          material={wallMat}
          position={[w.x, WALL_HEIGHT / 2, w.z]}
        />
      ))}
      {/* Floors */}
      {data.floors.map((f, i) => (
        <mesh
          key={`f${i}`}
          geometry={floorGeom}
          material={floorMat}
          position={[f.x, 0, f.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      ))}
      {/* Ceilings */}
      {data.floors.map((f, i) => (
        <mesh
          key={`c${i}`}
          geometry={floorGeom}
          material={ceilMat}
          position={[f.x, WALL_HEIGHT, f.z]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      ))}
      {/* Props */}
      {data.props.map((p, i) => (
        <Prop key={`p${i}`} type={p.type} position={[p.x, 0, p.z]} rotY={p.rot} level={level} />
      ))}
      {/* Scattered decorative props (bones, candles, debris) - density */}
      {data.floors.map((f, i) => {
        const r = pseudoRandom(f.x * 31 + f.z * 17);
        if (r < 0.18) {
          const sub = pseudoRandom(f.x * 7 + f.z * 23);
          const t =
            sub < 0.33 ? "bones" : sub < 0.66 ? "rubble" : "candle";
          const ox = (pseudoRandom(f.x + 1) - 0.5) * 1.2;
          const oz = (pseudoRandom(f.z + 2) - 0.5) * 1.2;
          return (
            <Prop
              key={`s${i}`}
              type={t}
              position={[f.x + ox, 0, f.z + oz]}
              rotY={r * Math.PI * 2}
              level={level}
            />
          );
        }
        return null;
      })}
    </group>
  );
}
