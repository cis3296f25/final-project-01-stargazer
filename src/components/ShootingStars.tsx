import { useEffect, useRef } from "react";

export default function ShootingStars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    interface Star {
      x: number;
      y: number;
      length: number;
      speed: number;
      angle: number;
      opacity: number;
    }

    const stars: Star[] = [];

    function createStar() {
      const star: Star = {
        x: Math.random() * width,
        y: Math.random() * height * 0.4,
        length: 250 + Math.random() * 200,
        speed: 6 + Math.random() * 10,
        angle: Math.PI / 4,
        opacity: 0.3 + Math.random() * 0.5,
      };
      stars.push(star);

      setTimeout(createStar, 1200 + Math.random() * 3000);
    }

    function drawStar(star: Star) {
      const tailX = star.x - star.length * Math.cos(star.angle);
      const tailY = star.y - star.length * Math.sin(star.angle);

      const gradient = ctx.createLinearGradient(star.x, star.y, tailX, tailY);
      gradient.addColorStop(0, `rgba(255,255,255,${star.opacity})`);
      gradient.addColorStop(1, "rgba(255,255,255,0)");

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(star.x, star.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
    }

    function updateStar(star: Star) {
      star.x += star.speed;
      star.y += star.speed;

      if (star.x > width + star.length || star.y > height + star.length) {
        stars.splice(stars.indexOf(star), 1);
      }
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      for (const star of stars) {
        drawStar(star);
        updateStar(star);
      }

      requestAnimationFrame(animate);
    }

    createStar();
    animate();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
    />
  );
}