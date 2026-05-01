import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Renders the scene to a low-resolution render target and then to the screen
 * with nearest-neighbor scaling — gives the chunky PS1 look.
 */
export function PixelRenderer({
  internalWidth = 480,
  internalHeight = 360,
}: {
  internalWidth?: number;
  internalHeight?: number;
}) {
  const { gl, scene, camera, size } = useThree();

  const target = useMemo(() => {
    const t = new THREE.WebGLRenderTarget(internalWidth, internalHeight, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: true,
      stencilBuffer: false,
      type: THREE.UnsignedByteType,
    });
    return t;
  }, [internalWidth, internalHeight]);

  const screenScene = useMemo(() => {
    const s = new THREE.Scene();
    const geom = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
      uniforms: { tMap: { value: target.texture } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position,1.0); }`,
      fragmentShader: `
        precision mediump float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        void main(){ gl_FragColor = texture2D(tMap, vUv); }
      `,
      depthTest: false,
      depthWrite: false,
    });
    const m = new THREE.Mesh(geom, mat);
    s.add(m);
    return s;
  }, [target]);

  const screenCam = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);

  // Update camera aspect to match internal resolution so projection matches the RT
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.aspect = internalWidth / internalHeight;
    cam.updateProjectionMatrix();
  }, [camera, internalWidth, internalHeight]);

  // Disable auto-clear so we control passes
  useEffect(() => {
    const prev = gl.autoClear;
    gl.autoClear = true;
    return () => {
      gl.autoClear = prev;
    };
  }, [gl]);

  useFrame(() => {
    gl.setRenderTarget(target);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.render(screenScene, screenCam);
  }, 1);

  // Avoid R3F's default render
  useEffect(() => {
    // noop — frameloop is "always" by default; we render manually with priority 1
    // Three's default renderer pass also runs; to suppress it, set frameloop or use a custom renderer.
    // We use scene/camera priority trick: setting our render at priority 1 takes over.
  }, [size]);

  return null;
}
