import React from 'react';
import { MapPin } from 'lucide-react';
import { DhakaArea } from '../types';
import { DHAKA_COORDINATES } from '../data/seedData';

export interface MapMarker {
  id: string;
  label: string;
  sublabel: string;
  area: DhakaArea;
  x: number;
  y: number;
  priceText?: string;
}

interface DhakaMapProps {
  markers: MapMarker[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  title?: string;
}

export const DhakaMap: React.FC<DhakaMapProps> = ({ markers, selectedId, onSelect, title }) => {
  return (
    <div className="bg-[#F9F9F9] border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <MapPin className="w-4 h-4 text-teal-600" strokeWidth={2} />
          <span>{title || 'Dhaka Neighborhood Map'}</span>
        </div>
        <span className="text-xs text-slate-500">Area-level privacy · Exact addresses shared after booking</span>
      </div>

      <div className="relative w-full h-[340px] sm:h-[400px] bg-slate-50 select-none overflow-hidden">
        {/* Stylized Dhaka Topographic & Road Arteries SVG */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          {/* Turag & Buriganga Waterbodies */}
          <path
            d="M 0 10 Q 12 28, 10 50 T 14 95 L 0 100 Z"
            fill="#E0F2FE"
            opacity="0.7"
          />
          <path
            d="M 60 36 Q 66 44, 62 56 Q 58 63, 66 70"
            fill="none"
            stroke="#BAE6FD"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          {/* Dhanmondi Lake */}
          <path
            d="M 33 67 Q 38 71, 41 75 Q 37 78, 34 74"
            fill="none"
            stroke="#BAE6FD"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Major Dhaka Arteries: Airport Rd, Pragati Sarani, Mirpur Rd */}
          <path
            d="M 46 4 L 49 36 L 52 54 L 54 88"
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="1.1"
          />
          <path
            d="M 24 22 L 32 58 L 40 85"
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="0.9"
          />
          <path
            d="M 52 24 L 74 28 L 70 60 L 58 84"
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="0.9"
          />
          <path
            d="M 20 42 L 82 44"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="0.7"
          />
          <path
            d="M 22 68 L 76 70"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="0.7"
          />
        </svg>

        {/* Neighborhood Reference Labels */}
        {(Object.entries(DHAKA_COORDINATES) as [DhakaArea, { x: number; y: number }][]).map(
          ([area, pos]) => (
            <div
              key={area}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              <span className="text-[11px] font-medium text-slate-400 tracking-tight whitespace-nowrap">
                {area}
              </span>
            </div>
          )
        )}

        {/* Interactive Pins */}
        {markers.map((marker, idx) => {
          const isSelected = marker.id === selectedId;
          const offsetX = (idx % 3 - 1) * 1.4;
          const offsetY = Math.floor(idx / 3) * 1.2;
          return (
            <button
              key={marker.id}
              type="button"
              onClick={() => onSelect(marker.id)}
              style={{
                left: `${Math.min(90, Math.max(10, marker.x + offsetX))}%`,
                top: `${Math.min(88, Math.max(12, marker.y + offsetY))}%`,
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-transform cursor-pointer border ${
                isSelected
                  ? 'bg-teal-600 text-white border-teal-700 scale-105 shadow-md z-20'
                  : 'bg-white text-slate-900 border-slate-300 hover:border-teal-500 hover:text-teal-700 shadow-sm'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              <span className="whitespace-nowrap">{marker.priceText || marker.area}</span>
            </button>
          );
        })}

        {/* Selected Preview Strip at Bottom */}
        {selectedId && (() => {
          const current = markers.find((m) => m.id === selectedId);
          if (!current) return null;
          return (
            <div className="absolute bottom-3 left-3 right-3 bg-white border border-slate-200 rounded-lg px-4 py-2.5 shadow-sm flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{current.label}</p>
                <p className="text-xs text-slate-600 truncate">{current.sublabel}</p>
              </div>
              <span className="text-xs font-semibold text-teal-700 whitespace-nowrap shrink-0">
                {current.area}, Dhaka
              </span>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
