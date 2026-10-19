import React, { useMemo } from 'react';

interface FloatingNumber {
  id: number;
  val: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export const BackgroundFloatingNumbers: React.FC = () => {
  // Generate a fixed set of gentle pastel floating numbers that wander smoothly
  const numbers: FloatingNumber[] = useMemo(() => {
    const list: FloatingNumber[] = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        val: (i % 9) + 1,
        left: 5 + (i * 92) / count + (Math.sin(i) * 5),
        top: 6 + ((i * 37) % 85),
        size: 24 + ((i * 7) % 22),
        duration: 8 + (i % 5) * 2,
        delay: (i % 4) * 0.8,
        opacity: 0.12 + (i % 3) * 0.05,
      });
    }
    return list;
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {numbers.map((n) => (
        <span
          key={n.id}
          className="absolute font-bold select-none text-white transition-transform"
          style={{
            left: `${n.left}%`,
            top: `${n.top}%`,
            fontSize: `${n.size}px`,
            opacity: n.opacity,
            animation: `floatGentle ${n.duration}s ease-in-out infinite`,
            animationDelay: `${n.delay}s`,
            textShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {n.val}
        </span>
      ))}
    </div>
  );
};
