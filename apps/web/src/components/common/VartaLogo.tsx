import React from 'react';

interface VartaLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  showTagline?: boolean;
}

export const VartaLogo: React.FC<VartaLogoProps> = ({
  className = '',
  size = 36,
  showText = true,
  showTagline = false,
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="vartaGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="0.6" stopColor="#6366F1" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="bubbleGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#191F2B" />
            <stop offset="1" stopColor="#11151D" />
          </linearGradient>
          <filter id="glow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Conversation Bubble with subtle border */}
        <path
          d="M 50 8 C 26.8 8 8 25.4 8 46.8 C 8 59.8 15 71.2 26 78.4 L 21 92 L 36.8 84.4 C 41 85.3 45.4 85.7 50 85.7 C 73.2 85.7 92 68.3 92 46.8 C 92 25.4 73.2 8 50 8 Z"
          fill="url(#bubbleGrad)"
          stroke="#252D3A"
          strokeWidth="2.5"
        />

        {/* Dynamic Stylized V intersecting the speech bubble */}
        <path
          d="M 31 32 L 48 68 C 49 70 51 70 52 68 L 69 32 C 70.5 29 68 26 65 26 L 57 26 C 55 26 53.5 27 52.8 28.5 L 50 35 L 47.2 28.5 C 46.5 27 45 26 43 26 L 35 26 C 32 26 29.5 29 31 32 Z"
          fill="url(#vartaGrad)"
          filter="url(#glow)"
        />

        {/* Accent dot symbolizing Indian discourse & community focal point */}
        <circle cx="50" cy="46" r="3.5" fill="#FFFFFF" />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-extrabold tracking-wider text-xl text-slate-50 flex items-center gap-1">
            VARTA
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block animate-pulse"></span>
          </span>
          {showTagline && (
            <span className="text-[10px] uppercase font-semibold tracking-widest text-blue-400 mt-0.5">
              Baat Sabki
            </span>
          )}
        </div>
      )}
    </div>
  );
};
