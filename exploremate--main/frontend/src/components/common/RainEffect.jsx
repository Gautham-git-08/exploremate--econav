import React, { useEffect, useRef } from 'react';

/**
 * Animated Rain & Subtle Lightning Canvas
 * Renders rain drops falling and occasional soft lightning flash for thunderstorm mode
 * Automatically pauses if reduceMotion is active
 */
export default function RainEffect({ mode = 'light_rain', reduceMotion = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (reduceMotion || !mode || mode === 'live' || mode === 'clear') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || 200;
    };
    resize();
    window.addEventListener('resize', resize);

    const isThunderstorm = mode === 'thunderstorm';
    const dropCount = isThunderstorm ? 80 : 40;
    const drops = [];

    for (let i = 0; i < dropCount; i++) {
      drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        length: Math.random() * 12 + (isThunderstorm ? 15 : 8),
        speed: Math.random() * 5 + (isThunderstorm ? 8 : 4),
        opacity: Math.random() * 0.4 + 0.2
      });
    }

    let flashAlpha = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Thunderstorm lightning flash
      if (isThunderstorm) {
        if (Math.random() < 0.008) {
          flashAlpha = 0.25;
        }
        if (flashAlpha > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          flashAlpha -= 0.02;
        }
      }

      // Draw raindrops
      ctx.strokeStyle = isThunderstorm ? 'rgba(180, 215, 255, 0.6)' : 'rgba(150, 195, 240, 0.45)';
      ctx.lineWidth = isThunderstorm ? 1.5 : 1;
      ctx.beginPath();

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 2, d.y + d.length);

        d.y += d.speed;
        d.x -= 1; // Slight wind slant

        if (d.y > canvas.height) {
          d.y = -d.length;
          d.x = Math.random() * (canvas.width + 50);
        }
      }
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [mode, reduceMotion]);

  if (reduceMotion || mode === 'live' || mode === 'clear') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none rounded-3xl z-10 w-full h-full"
    />
  );
}
