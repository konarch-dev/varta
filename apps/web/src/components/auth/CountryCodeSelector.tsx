'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export interface Country {
  code: string;
  name: string;
  flag: string;
  iso: string;
}

export const COUNTRIES: Country[] = [
  { code: '+91', name: 'India', flag: '🇮🇳', iso: 'IN' },
  { code: '+1', name: 'United States / Canada', flag: '🇺🇸', iso: 'US' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧', iso: 'GB' },
  { code: '+971', name: 'United Arab Emirates', flag: '🇦🇪', iso: 'AE' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦', iso: 'SA' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬', iso: 'SG' },
  { code: '+61', name: 'Australia', flag: '🇦🇺', iso: 'AU' },
  { code: '+49', name: 'Germany', flag: '🇩🇪', iso: 'DE' },
  { code: '+33', name: 'France', flag: '🇫🇷', iso: 'FR' },
  { code: '+81', name: 'Japan', flag: '🇯🇵', iso: 'JP' },
  { code: '+977', name: 'Nepal', flag: '🇳🇵', iso: 'NP' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩', iso: 'BD' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰', iso: 'LK' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾', iso: 'MY' },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩', iso: 'ID' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦', iso: 'ZA' },
  { code: '+64', name: 'New Zealand', flag: '🇳🇿', iso: 'NZ' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷', iso: 'BR' },
  { code: '+7', name: 'Russia', flag: '🇷🇺', iso: 'RU' },
];

interface CountryCodeSelectorProps {
  selectedCode: string;
  onSelect: (country: Country) => void;
  disabled?: boolean;
}

export function CountryCodeSelector({
  selectedCode,
  onSelect,
  disabled = false,
}: CountryCodeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry =
    COUNTRIES.find((c) => c.code === selectedCode) || COUNTRIES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.includes(searchQuery) ||
      c.iso.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 sm:py-2.5 bg-white hover:bg-slate-50 border-r border-[#E2E8F0] text-slate-800 font-bold text-xs sm:text-sm rounded-l-2xl transition select-none outline-none focus:bg-slate-100 disabled:opacity-50 cursor-pointer"
        aria-label="Select Country Code"
      >
        <span className="text-base sm:text-lg leading-none">{selectedCountry.flag}</span>
        <span className="font-extrabold tracking-tight text-[#0B1422]">{selectedCountry.code}</span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#FF5722]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2.5 border-b border-slate-100 bg-slate-50">
            <div className="relative flex items-center bg-white rounded-xl px-2.5 py-1.5 border border-slate-200 focus-within:border-[#FF5722]">
              <Search size={14} className="text-slate-400 mr-2 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country or code..."
                className="w-full text-xs outline-none bg-transparent font-medium text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 py-1">
            {filteredCountries.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-400 text-center">
                No matching country found
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.code === selectedCountry.code;
                return (
                  <button
                    key={`${c.iso}-${c.code}`}
                    type="button"
                    onClick={() => {
                      onSelect(c);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition hover:bg-orange-50/70 ${
                      isSelected
                        ? 'bg-orange-50 font-bold text-[#FF5722]'
                        : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-500 shrink-0 ml-2">
                      {c.code}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
