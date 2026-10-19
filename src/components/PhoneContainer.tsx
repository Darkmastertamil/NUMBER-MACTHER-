import React from 'react';

interface PhoneContainerProps {
  children: React.ReactNode;
}

export const PhoneContainer: React.FC<PhoneContainerProps> = ({ children }) => {
  return (
    <div className="w-full h-[100dvh] flex items-center justify-center bg-[#151221] overflow-hidden select-none touch-manipulation">
      {/* On desktop: centered phone mockup frame. On mobile: full edge-to-edge 100dvh */}
      <main
        role="main"
        className="relative w-full h-[100dvh] max-w-[440px] md:max-h-[890px] md:h-[94dvh] md:rounded-[36px] bg-gradient-to-b from-[#2a243e] via-[#201b33] to-[#1a162b] text-white shadow-2xl md:ring-8 md:ring-[#373052] flex flex-col overflow-hidden isolate"
      >
        {children}
      </main>
    </div>
  );
};
