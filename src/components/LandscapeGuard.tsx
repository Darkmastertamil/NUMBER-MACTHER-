import React, { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';

export const LandscapeGuard: React.FC = () => {
  const [isLandscapeOnPhone, setIsLandscapeOnPhone] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // If width > height and max-height is phone-like (< 600px), it's a rotated phone!
      const isLandscape = window.innerWidth > window.innerHeight;
      const isShortHeight = window.innerHeight < 550;
      setIsLandscapeOnPhone(isLandscape && isShortHeight);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isLandscapeOnPhone) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#1e1b2e]/95 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center text-pink-300 mb-4 animate-bounce">
        <Smartphone className="w-9 h-9 rotate-90" />
      </div>
      <h2 className="text-2xl font-bold text-pink-200 mb-2">Please Rotate Your Phone</h2>
      <p className="text-sm text-slate-300 max-w-xs leading-relaxed">
        Number Match Party is designed for portrait mode to give you the best tapping experience.
      </p>
    </div>
  );
};
