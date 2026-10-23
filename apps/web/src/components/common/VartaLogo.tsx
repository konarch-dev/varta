import React from 'react';

interface VartaLogoProps {
  className?: string;
  textClassName?: string;
  size?: number;
  showText?: boolean;
  showTagline?: boolean;
  variant?: 'mark' | 'full';
}

export const VartaLogo: React.FC<VartaLogoProps> = ({
  className = '',
  textClassName = '',
  size = 38,
  showText = true,
  showTagline = true,
  variant = 'mark',
}) => {
  if (variant === 'full') {
    return (
      <div className={`select-none flex items-center ${className}`}>
        <img
          src="/varta-logo.png"
          alt="VARTA — Baat Sabki"
          className="object-contain hover:scale-[1.02] transition-transform duration-200"
          style={{ height: size, width: 'auto' }}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* 3D Official VARTA Emblem */}
      <div className="relative shrink-0 flex items-center justify-center">
        <img
          src="/varta-logo-mark.png"
          alt="VARTA Emblem"
          className="object-contain hover:scale-105 transition-transform duration-200"
          style={{ width: size, height: 'auto', maxHeight: size * 1.1 }}
        />
      </div>

      {/* Brand Wordmark & Tricolor Accent Tagline */}
      {showText && (
        <div className={`flex flex-col leading-none ${textClassName}`}>
          <span className="font-extrabold tracking-wider text-slate-900 dark:text-white text-xl">
            VARTA
          </span>
          {showTagline && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-3.5 h-[2.5px] bg-[#FF9933] rounded-full inline-block"></span>
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 tracking-wider">
                Baat Sabki
              </span>
              <span className="w-3.5 h-[2.5px] bg-[#00C853] rounded-full inline-block"></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
