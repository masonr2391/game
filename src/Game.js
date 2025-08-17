import React, { useEffect, useRef, useState } from "react";

const TAU = Math.PI * 2;

// Utilities
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const lerp = (a, b, t) => a + (b - a) * t;

// Random generator
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Track generation
function generateTrack(seed) {
  const rng = mulberry32(seed);
  const poly = [];
  const N = 100;
  const radius = 300 + rng() * 300;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU;
    const r = radius + rng() * 100 - 50;
    poly.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }
  const bounds = {
    minX: Math.min(...poly.map((p) => p.x)),
    maxX: Math.max(...poly.map((p) => p.x)),
    minY: Math.min(...poly.map((p) => p.y)),
    maxY: Math.max(...poly.map((p) => p.y)),
  };
  const halfW = 40;
  return { poly, bounds, halfW };
}

// Car factory
function makeCar(track) {
  const s0 = track.poly[0];
  const s1 = track.poly[1];
  const yaw = -Math.atan2(s1.y - s0.y, s1.x - s0.x) + Math.PI / 2;
  return { x: s0.x, y: s0.y, yaw, v: 0, delta: 0, radius: 15 };
}

// Drawing
function drawTrack(ctx, track) {
  ctx.strokeStyle = "#555";
  ctx.lineWidth = track.halfW * 2;
  ctx.beginPath();
  track.poly.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.stroke();
}

function drawCar(ctx, car, color) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.yaw);
  ctx.fillStyle = color;
  ctx.fillRect(-10, -5, 20, 10);
  ctx.restore();
}

// Main Component
export default function Game() {
  const canvasRef = useRef(null);
  const [seed, setSeed] = useState(Math.floor(Math.random() * 1e9));
  const [track, setTrack] = useState(generateTrack(seed));
  const [playerCar, setPlayerCar] = useState(null);
  const keys = useRef({});

  useEffect(() => {
    setTrack(generateTrack(seed));
  }, [seed]);

  useEffect(() => {
    setPlayerCar(makeCar(track));
  }, [track]);

  // Keyboard
  useEffect(() => {
    const down = (e) => (keys.current[e.key] = true);
    const up = (e) => (keys.current[e.key] = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Game loop
  useEffect(() => {
    let lastTime = performance.now();
    const step = (t) => {
      const dt = (t - lastTime) / 1000;
      lastTime = t;
      if (playerCar) {
        const acc = 100;
        if (keys.current["ArrowUp"]) playerCar.v += acc * dt;
        if (keys.current["ArrowDown"]) playerCar.v -= acc * dt;
        if (keys.current["ArrowLeft"]) playerCar.yaw -= 2 * dt;
        if (keys.current["ArrowRight"]) playerCar.yaw += 2 * dt;
        playerCar.v *= 0.98;
        playerCar.x += Math.sin(playerCar.yaw) * playerCar.v * dt;
        playerCar.y -= Math.cos(playerCar.yaw) * playerCar.v * dt;
      }

      const canvas = canvasRef.current;
      if (canvas && playerCar) {
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        drawTrack(ctx, track);
        drawCar(ctx, playerCar, "#0f0");
        ctx.restore();
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [playerCar, track]);

  return (
    <div>
      <canvas ref={canvasRef} width={800} height={600} style={{ border: "1px solid black" }} />
      <button onClick={() => setSeed(Math.floor(Math.random() * 1e9))}>New Track</button>
    </div>
  );
}
