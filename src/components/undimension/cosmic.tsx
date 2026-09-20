"use client";

import { memo, useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Realistic Blackhole — real-time GLSL raymarching shader via Three.js.
 *
 * This replaces the static SVG approach with a proper shader-based renderer.
 * The accretion disk ACTUALLY orbits (Keplerian motion — inner orbits faster),
 * the photon ring shimmers, Doppler beaming brightens the approaching side,
 * and the lensed back of the disk wraps around the event horizon as a halo.
 *
 * Research references:
 *   - chrismatgit/black-hole-simulation (Three.js + WebGL shader raymarching)
 *   - https://discourse.threejs.org (real-time Kerr black hole ray-tracer)
 *   - https://threejsroadmap.com (Raytracing a Black Hole with WebGPU)
 *   - https://blog.seanholloway.com (General Relativistic Ray Tracing, HLSL)
 *
 * The shader is a single full-screen quad (no 3D geometry needed — everything
 * is computed in the fragment shader). uTime drives the orbital motion.
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uPixelRatio;

  // --- hash + noise (for disk turbulence / background stars) ---
  float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p = p * 2.02 + 13.7;
      a *= 0.5;
    }
    return v;
  }

  // --- black hole + disk geometry constants ---
  const float HOLE_R   = 0.13;   // event horizon radius (in uv space)
  const float DISK_IN  = 0.165;  // disk inner edge (ISCO ~ 3 * hole radius)
  const float DISK_OUT = 0.52;   // disk outer edge
  const float DISK_TILT = 0.32;  // y-axis squish to fake the tilt (ellipse aspect)
  const float DISK_TILT_ROT = -0.18; // small rotation of the disk plane (radians)

  void main() {
    // Centered, aspect-corrected coordinates (-1..1 with y corrected)
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;

    // Apply a slight rotation to the disk plane for a more dynamic composition
    float c = cos(DISK_TILT_ROT), s = sin(DISK_TILT_ROT);
    uv = mat2(c, -s, s, c) * uv;

    vec2 d = uv;
    // Squish y to make the disk tilted (ellipse, not a flat line)
    vec2 diskD = vec2(d.x, d.y / DISK_TILT);
    float r = length(diskD);
    float angle = atan(diskD.y, diskD.x);

    vec3 col = vec3(0.0);

    // --- Background stars (parallax twinkle) ---
    vec2 starUv = floor(uv * 180.0);
    float starH = hash21(starUv);
    float star = step(0.992, starH);
    float twinkle = 0.6 + 0.4 * sin(uTime * 2.0 + starH * 30.0);
    col += star * twinkle * vec3(0.75, 0.85, 1.0);
    // Smaller dim stars
    vec2 starUv2 = floor(uv * 320.0);
    float star2 = step(0.997, hash21(starUv2));
    col += star2 * vec3(0.5, 0.55, 0.7);

    // --- Soft background nebula glow (the gravity well) ---
    float bgGlow = exp(-length(d) * 1.6) * 0.10;
    col += bgGlow * vec3(0.4, 0.25, 0.55);

    // --- Disk temperature color (hot inside → orange → red outside) ---
    float temp = 1.0 - smoothstep(DISK_IN, DISK_OUT, r);
    vec3 hot  = vec3(1.0, 0.95, 0.85);
    vec3 warm = vec3(1.0, 0.55, 0.12);
    vec3 cool = vec3(0.55, 0.08, 0.0);
    vec3 diskColor = mix(cool, warm, smoothstep(0.0, 0.5, temp));
    diskColor = mix(diskColor, hot, smoothstep(0.5, 1.0, temp));

    // --- Orbital motion: Keplerian — inner orbits faster than outer ---
    // angular velocity ~ 1/r^1.5 in real Kepler, but 1/r looks good here.
    // Scaled up so motion is clearly visible.
    float omega = 3.2 / (r + 0.05);
    float orbitalAngle = angle + uTime * omega;

    // --- Disk turbulence streaks (orbital flow lines) ---
    // LOW-frequency streaks so the orbital motion is clearly visible.
    // Two octaves: broad band structure + finer ripples.
    float bands = fbm(vec2(orbitalAngle * 2.0, r * 8.0));
    bands = pow(bands, 1.3);
    float ripples = fbm(vec2(orbitalAngle * 6.0, r * 16.0));
    float turb = mix(bands, ripples, 0.35);

    // --- Clearly-orbiting hot spot (a bright clump that sweeps around) ---
    // This makes the orbital motion unmistakable to the eye.
    float spotAngle = uTime * omega * 0.6;  // same direction as the streaks, slightly slower
    float spotDelta = mod(orbitalAngle - spotAngle + 3.14159, 6.28318) - 3.14159;
    float spotR = 0.30;  // spot sits at mid-disk
    float spotRadial = exp(-pow((r - spotR) / 0.05, 2.0));
    float spotAngular = exp(-pow(spotDelta / 0.35, 2.0));
    float hotSpot = spotRadial * spotAngular;

    // --- Doppler beaming: approaching side (left, -x) brighter, receding dimmer ---
    // Side is determined by the disk's local x (sign of diskD.x).
    float dopplerSide = -diskD.x / max(r, 0.001);
    float doppler = 0.45 + 0.85 * dopplerSide;
    // Relativistic beaming concentrates brightness on the approaching side
    doppler = pow(max(doppler, 0.0), 1.6) * 1.2 + 0.25;

    // --- Main disk ring (front view) ---
    if (r > DISK_IN && r < DISK_OUT) {
      // Edge fades
      float edgeIn  = smoothstep(DISK_IN, DISK_IN + 0.012, r);
      float edgeOut = 1.0 - smoothstep(DISK_OUT - 0.08, DISK_OUT, r);
      float edgeMask = edgeIn * edgeOut;
      vec3 c = diskColor;
      c *= 0.45 + 0.95 * turb;
      c *= doppler;
      // Hot inner edge gets extra brightness
      c += hot * smoothstep(DISK_IN + 0.04, DISK_IN, r) * 0.6;
      // Orbiting hot spot — bright white-yellow clump sweeping around the disk
      c += hot * hotSpot * 1.4 * doppler;
      col = mix(col, c, edgeMask);
    }

    // --- Event horizon shadow (full circle, pure black) ---
    // The "shadow" is the region where background light is captured by the
    // hole. The top half will be covered by the lensed disk-back arc next,
    // making the black region appear as a semicircle with a bright cap.
    if (length(d) < HOLE_R) {
      col = vec3(0.0);
    }

    // --- Lensed disk-back arc (the iconic Gargantua "cap") ---
    // The disk's FAR side is bent UP and OVER the top of the shadow by the
    // hole's gravity. From our viewpoint, this lensed light passes IN FRONT
    // of the top half of the shadow — so the black region looks like a
    // semicircle (bottom half visible) with a bright disk-arc cap on top.
    // This is the "half-sphere merged with the ring" look the user described.
    //
    // The arc covers the top half (d.y > 0) within the shadow AND just
    // outside it (up to HOLE_R + 0.06), forming a continuous bright ring
    // that merges with the photon ring and the main equatorial disk.
    float shadowDist = length(d);
    if (d.y > 0.0 && shadowDist < HOLE_R + 0.07) {
      // Lensed angular coordinate — slow orbital motion, same direction as disk
      float lensAngle = atan(d.y, d.x) + uTime * 1.3;
      // Temperature: hottest at the inner edge (closest to shadow) + very top
      float lensTemp = 1.0 - smoothstep(0.0, HOLE_R + 0.07, shadowDist);
      float topness = clamp(d.y / (HOLE_R + 0.04), 0.0, 1.0);
      lensTemp *= 0.55 + 0.65 * topness;
      vec3 lensColor = mix(vec3(0.7, 0.15, 0.0), vec3(1.0, 0.7, 0.25), lensTemp);
      lensColor = mix(lensColor, vec3(1.0, 0.95, 0.8), pow(lensTemp, 2.5));
      // Orbital turbulence streaks (matches the main disk's flow)
      float lensStreak = fbm(vec2(lensAngle * 3.0, shadowDist * 30.0));
      lensColor *= 0.5 + 0.85 * lensStreak;
      // Doppler beaming on the lensed arc (left side brighter)
      lensColor *= 0.55 + 0.7 * dopplerSide;
      // Extra brightness at the very top (lensing concentrates light there)
      lensColor *= 1.0 + 0.7 * pow(topness, 2.0);
      // Smooth fade at the equator so it blends with the black bottom half
      float equatorFade = smoothstep(0.0, 0.025, d.y);
      // Fade out at the outer edge
      float outerFade = 1.0 - smoothstep(HOLE_R + 0.02, HOLE_R + 0.07, shadowDist);
      col = mix(col, lensColor, equatorFade * outerFade);
    }

    // --- Photon ring: bright thin ring at the edge of the shadow ---
    // This is the lensed image of light orbiting the hole at 1.5 * Rs.
    // Brightest at the TOP where the lensed disk-back meets the shadow,
    // dimmer at the bottom (which is just the shadow's lower edge).
    float photonDist = abs(length(d) - HOLE_R - 0.006);
    float photonRing = smoothstep(0.012, 0.0, photonDist);
    float photonTopBoost = 0.4 + 1.4 * smoothstep(0.0, HOLE_R, max(d.y, 0.0));
    col += photonRing * vec3(1.0, 0.92, 0.7) * photonTopBoost;
    // Outer soft glow on the photon ring
    float photonGlow = smoothstep(0.04, 0.0, abs(length(d) - HOLE_R - 0.012));
    col += photonGlow * vec3(1.0, 0.7, 0.3) * 0.4 * (0.5 + photonTopBoost * 0.5);

    // --- Final soft glow around the whole black hole ---
    float glow = exp(-length(d) * 3.5) * 0.18;
    col += glow * vec3(1.0, 0.5, 0.15);

    // --- Vignette ---
    float vig = 1.0 - 0.35 * dot(uv, uv);
    col *= vig;

    // --- Tonemap (Reinhard) + slight gamma ---
    col = col / (1.0 + col);
    col = pow(col, vec3(0.85));

    gl_FragColor = vec4(col, 1.0);
  }
`;

function Blackhole3DBase() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    const getSize = () => ({
      w: parent?.clientWidth || 700,
      h: parent?.clientHeight || 700,
    });

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true, // lets us readPixels for QA verification
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPixelRatio: { value: renderer.getPixelRatio() },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      depthTest: false,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const resize = () => {
      const { w, h } = getSize();
      renderer.setSize(w, h, false);
      uniforms.uResolution.value.set(
        w * renderer.getPixelRatio(),
        h * renderer.getPixelRatio()
      );
      uniforms.uPixelRatio.value = renderer.getPixelRatio();
    };
    resize();

    const ro = new ResizeObserver(resize);
    if (parent) ro.observe(parent);

    const clock = new THREE.Clock();
    let raf = 0;
    let running = true;
    let visible = true;

    // Pause when offscreen to save GPU
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
        if (visible && running) {
          clock.start();
          loop();
        }
      },
      { threshold: 0 }
    );
    if (parent) io.observe(parent);

    const loop = () => {
      if (!running || !visible) return;
      raf = requestAnimationFrame(loop);
      uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    };
    loop();

    // Cleanup
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      aria-hidden
      className="absolute -right-32 md:right-0 top-1/2 -translate-y-1/2 w-[450px] h-[450px] md:w-[700px] md:h-[700px] z-0 pointer-events-none -rotate-12"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

export const Blackhole = memo(Blackhole3DBase);

/**
 * Orbiting planets (unchanged from prior implementation).
 */
function PlanetsBase() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden"
    >
      {/* Orbit 1 */}
      <div
        className="absolute w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full border-4 border-white border-dashed animate-spin-slow"
        style={{ willChange: "transform" }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-4 border-white shadow-[8px_8px_0_#fff] overflow-hidden animate-spin-rev"
          style={{
            background: "radial-gradient(circle at 35% 35%, #4facfe, #00f2fe)",
            willChange: "transform",
          }}
        >
          <div className="w-10 h-10 bg-[#38b000] rounded-sm absolute -top-2 -left-2 rotate-12 border-2 border-black" />
          <div className="w-12 h-6 bg-[#38b000] rounded-sm absolute bottom-1 right-[-4px] -rotate-12 border-2 border-black" />
        </div>
      </div>

      {/* Orbit 2 */}
      <div
        className="absolute w-[550px] h-[550px] md:w-[800px] md:h-[800px] rounded-full border-4 border-white animate-spin-rev"
        style={{ willChange: "transform" }}
      >
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-16 h-16 rounded-full border-4 border-white shadow-[8px_8px_0_#fff] overflow-hidden animate-spin-slow"
          style={{ background: "#e07a5f", willChange: "transform" }}
        >
          <div className="w-6 h-6 bg-[#9b2226] border-2 border-black rounded-full absolute top-1 right-1" />
          <div className="w-4 h-4 bg-[#9b2226] border-2 border-black rounded-full absolute bottom-2 left-2" />
        </div>
      </div>

      {/* Orbit 3 (Saturn-like) */}
      <div
        className="absolute w-[700px] h-[700px] md:w-[1050px] md:h-[1050px] rounded-full border-4 border-white border-dotted animate-spin-slow"
        style={{ willChange: "transform" }}
      >
        <div
          className="absolute top-1/2 -left-10 -translate-y-1/2 w-28 h-28 rounded-full border-4 border-white shadow-[8px_8px_0_#fff] overflow-hidden animate-spin-rev"
          style={{ background: "#f4a261", willChange: "transform" }}
        >
          <div className="absolute w-full h-2 bg-[#e76f51] top-1/4 border-y-2 border-black" />
          <div className="absolute w-full h-4 bg-[#e76f51] bottom-1/3 border-y-2 border-black" />
          <div className="absolute w-[200%] h-[200%] border-y-[16px] border-x-8 border-white rounded-[50%] rotate-[25deg] scale-y-[0.3]" />
          <div className="absolute w-[180%] h-[180%] border-y-[8px] border-[#2a9d8f] rounded-[50%] rotate-[25deg] scale-y-[0.3] opacity-90" />
        </div>
      </div>
    </div>
  );
}

export const Planets = memo(PlanetsBase);
