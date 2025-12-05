'use client';

import { useEffect, useRef } from 'react';

interface InteractiveDotsBackgroundProps {
  dotSpacing?: number;
  dotColor?: string;
  baseOpacity?: number;
  hoverRadius?: number;
  hoverScale?: number;
  hoverOpacity?: number;
}

export default function InteractiveDotsBackground({
  dotSpacing = 24,
  dotColor = 'rgba(207, 224, 45)',
  baseOpacity = 0.12,
  hoverRadius = 20,
  hoverScale = 1.5,
  hoverOpacity = 0.5,
}: InteractiveDotsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationFrameRef = useRef<number | null>(null);
  const dotsRef = useRef<Array<{ x: number; y: number; currentScale: number; targetScale: number; currentOpacity: number; targetOpacity: number; lastActivated: number; lastHoverScale: number; lastHoverOpacity: number }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      if (!canvas) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Create grid of dots
      const dots: Array<{ x: number; y: number; currentScale: number; targetScale: number; currentOpacity: number; targetOpacity: number; lastActivated: number; lastHoverScale: number; lastHoverOpacity: number }> = [];
      
      for (let x = dotSpacing / 2; x < width; x += dotSpacing) {
        for (let y = dotSpacing / 2; y < height; y += dotSpacing) {
          dots.push({
            x,
            y,
            currentScale: 1,
            targetScale: 1,
            currentOpacity: baseOpacity,
            targetOpacity: baseOpacity,
            lastActivated: 0,
            lastHoverScale: 1,
            lastHoverOpacity: baseOpacity,
          });
        }
      }

      dotsRef.current = dots;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mouse = mouseRef.current;
      const dots = dotsRef.current;
      const currentTime = Date.now();
      const trailDuration = 500; // 0.5 seconds in milliseconds

      dots.forEach((dot) => {
        // Calculate distance from mouse to dot
        const dx = mouse.x - dot.x;
        const dy = mouse.y - dot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if mouse is within hover range
        const timeSinceActivation = currentTime - dot.lastActivated;
        const isInRange = distance < 50;
        const isInTrail = timeSinceActivation < trailDuration;

        if (isInRange) {
          // Mouse is in range - activate the dot and update timestamp
          dot.lastActivated = currentTime;
          
          // Two-tier hover effect
          if (distance < 20) {
            // Inner zone (within 20px): scale by 75%, opacity to 0.5
            dot.targetScale = 1.75;
            dot.targetOpacity = 0.5;
          } else {
            // Outer zone (within 50px but beyond 20px): scale by 50%, opacity to 0.3
            dot.targetScale = 1.5;
            dot.targetOpacity = 0.3;
          }
          
          // Store the current hover state for trail effect
          dot.lastHoverScale = dot.targetScale;
          dot.lastHoverOpacity = dot.targetOpacity;
        } else if (isInTrail) {
          // Mouse left but within trail duration - fade based on remaining time
          const fadeProgress = timeSinceActivation / trailDuration;
          const fadeValue = 1 - fadeProgress;
          
          // Fade from last hover state to default
          dot.targetScale = 1 + (dot.lastHoverScale - 1) * fadeValue;
          dot.targetOpacity = baseOpacity + (dot.lastHoverOpacity - baseOpacity) * fadeValue;
        } else {
          // Default state - trail has ended
          dot.targetScale = 1;
          dot.targetOpacity = baseOpacity;
        }

        // Smooth interpolation - faster for more responsive feel
        dot.currentScale += (dot.targetScale - dot.currentScale) * 0.2;
        dot.currentOpacity += (dot.targetOpacity - dot.currentOpacity) * 0.2;

        // Draw dot
        // Parse color string (e.g., "rgba(207, 224, 45)" or "rgb(207, 224, 45)")
        const colorMatch = dotColor.match(/(\d+(?:\.\d+)?)/g);
        const r = colorMatch ? parseFloat(colorMatch[0]) : 207;
        const g = colorMatch ? parseFloat(colorMatch[1]) : 224;
        const b = colorMatch ? parseFloat(colorMatch[2]) : 45;
        
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dot.currentOpacity})`;
        
        ctx.beginPath();
        const radius = 1 * dot.currentScale;
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dotSpacing, dotColor, baseOpacity, hoverRadius, hoverScale, hoverOpacity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

