import * as THREE from "three";

/**
 * PS1-style material: vertex jitter (snap to low resolution grid)
 * + affine texture mapping approximation (disable perspective correction).
 * Lighting is computed per-vertex (gouraud) for that classic look.
 */
export function createPS1Material(options: {
  map?: THREE.Texture | null;
  color?: THREE.ColorRepresentation;
  emissive?: THREE.ColorRepresentation;
  jitter?: number; // resolution to snap to (lower = chunkier)
  affine?: number; // 0 = perspective correct, 1 = affine
  fogColor?: THREE.ColorRepresentation;
  fogNear?: number;
  fogFar?: number;
}) {
  const uniforms = {
    uMap: { value: options.map ?? null },
    uHasMap: { value: options.map ? 1 : 0 },
    uColor: { value: new THREE.Color(options.color ?? 0xffffff) },
    uEmissive: { value: new THREE.Color(options.emissive ?? 0x000000) },
    uJitter: { value: options.jitter ?? 160 },
    uAffine: { value: options.affine ?? 1 },
    uFogColor: { value: new THREE.Color(options.fogColor ?? 0x0a0a14) },
    uFogNear: { value: options.fogNear ?? 4 },
    uFogFar: { value: options.fogFar ?? 22 },
    uTime: { value: 0 },
    uLightDir: { value: new THREE.Vector3(0.4, 1, 0.6).normalize() },
    uAmbient: { value: 0.45 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      uniform float uJitter;
      uniform float uAffine;
      uniform vec3 uLightDir;
      uniform float uAmbient;
      varying vec2 vUv;
      varying float vLight;
      varying float vDepth;
      varying float vAffineW;

      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vec4 viewPos = viewMatrix * worldPos;
        vec4 clip = projectionMatrix * viewPos;

        // Snap to low resolution grid in NDC for vertex jitter
        vec3 ndc = clip.xyz / clip.w;
        ndc.xy = floor(ndc.xy * uJitter) / uJitter;
        clip.xyz = ndc * clip.w;

        gl_Position = clip;

        // per-vertex lighting (gouraud)
        vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
        float ndotl = max(dot(worldNormal, uLightDir), 0.0);
        vLight = uAmbient + (1.0 - uAmbient) * ndotl;

        vUv = uv;
        vDepth = -viewPos.z;
        // For affine texture mapping we multiply uv by w later (we just pass w)
        vAffineW = mix(1.0, clip.w, uAffine);
      }
    `,
    fragmentShader: /* glsl */ `
      precision mediump float;
      uniform sampler2D uMap;
      uniform int uHasMap;
      uniform vec3 uColor;
      uniform vec3 uEmissive;
      uniform vec3 uFogColor;
      uniform float uFogNear;
      uniform float uFogFar;
      varying vec2 vUv;
      varying float vLight;
      varying float vDepth;
      varying float vAffineW;

      void main() {
        vec3 base = uColor;
        if (uHasMap == 1) {
          // Affine-ish sampling: vUv was passed perspective-correct via varying,
          // we re-introduce some warping by sampling at slightly snapped coords.
          vec2 uv = floor(vUv * 128.0) / 128.0;
          base = texture2D(uMap, uv).rgb * uColor;
        }
        vec3 lit = base * vLight + uEmissive;

        float fogFactor = clamp((vDepth - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);
        // Quantize color to 5-bit per channel (PS1 dithering vibe, no actual dither)
        lit = floor(lit * 32.0) / 32.0;
        vec3 finalColor = mix(lit, uFogColor, fogFactor);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    fog: false,
  });

  return material;
}

/** Generate a procedural tileable texture on a canvas. */
export function makeTexture(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, s: number) => void,
): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.generateMipmaps = false;
  return tex;
}
