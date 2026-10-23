'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';

export interface LightboxImage {
  id: string;
  url: string;
  alt?: string;
}

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: LightboxImage[];
  initialIndex?: number;
  author?: {
    displayName: string;
    username: string;
    avatarUrl?: string | null;
  };
  postContent?: string;
}

export function ImageLightboxModal({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  author,
  postContent,
}: ImageLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Update current index when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const currentImage = images[currentIndex];

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.5, 3.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 0.5);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleToggleZoom = useCallback(() => {
    if (scale > 1) {
      handleResetZoom();
    } else {
      setScale(2);
    }
  }, [scale, handleResetZoom]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    handleResetZoom();
  }, [images.length, handleResetZoom]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    handleResetZoom();
  }, [images.length, handleResetZoom]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext, handleZoomIn, handleZoomOut, handleResetZoom]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Drag to pan image when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = async () => {
    if (!currentImage?.url) return;
    try {
      const response = await fetch(currentImage.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `varta-image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      window.open(currentImage.url, '_blank');
    }
  };

  if (!isOpen || !currentImage) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none transition-all duration-200"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Header Bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        {/* Author Details if available */}
        {author ? (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#101D2D] overflow-hidden border border-white/20">
              {author.avatarUrl ? (
                <img
                  src={author.avatarUrl}
                  alt={author.username}
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[#FF9933] font-bold">
                  {author.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-tight">
                {author.displayName}
              </span>
              <span className="text-xs text-slate-400">@{author.username}</span>
            </div>
          </div>
        ) : (
          <div />
        )}

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-full border border-white/10 px-1 py-1 text-slate-200">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-full hover:bg-white/20 transition text-slate-300 hover:text-white"
              title="Zoom out (-)"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-semibold px-2 text-slate-300 min-w-[42px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-full hover:bg-white/20 transition text-slate-300 hover:text-white"
              title="Zoom in (+)"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-full hover:bg-white/20 transition text-slate-300 hover:text-white"
              title="Fit to screen (0)"
            >
              <Maximize2 size={15} />
            </button>
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 hover:text-white backdrop-blur-md transition"
            title="Download full image"
          >
            <Download size={18} />
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-red-500/80 border border-white/10 text-slate-200 hover:text-white backdrop-blur-md transition shadow-lg"
            title="Close viewer (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Focus Viewport */}
      <div
        className="relative w-full h-full flex items-center justify-center p-4 sm:p-8 overflow-hidden"
        onWheel={handleWheel}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <img
          src={currentImage.url}
          alt={currentImage.alt || 'Focused image'}
          referrerPolicy="no-referrer"
          draggable={false}
          onDoubleClick={handleToggleZoom}
          onMouseDown={handleMouseDown}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
          }}
          className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl transition-transform"
        />
      </div>

      {/* Multi-Image Carousel Controls */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/10 backdrop-blur-md transition active:scale-95 z-20 shadow-xl"
            title="Previous image"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/10 backdrop-blur-md transition active:scale-95 z-20 shadow-xl"
            title="Next image"
          >
            <ChevronRight size={24} />
          </button>

          {/* Indicator Counter Badge */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-black/70 border border-white/15 text-xs font-semibold text-slate-200 backdrop-blur-md">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}

      {/* Bottom Post Content Preview */}
      {postContent && scale === 1 && (
        <div className="absolute bottom-4 inset-x-4 max-w-2xl mx-auto z-10 pointer-events-none hidden sm:block">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-xs text-slate-200 leading-relaxed line-clamp-2 shadow-xl">
            {postContent}
          </div>
        </div>
      )}
    </div>
  );
}
