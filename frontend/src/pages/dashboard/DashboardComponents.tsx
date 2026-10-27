import React from 'react';
import { Box } from '@mantine/core';

interface SparklineWaveProps {
  id: string;
  color: string;
  height?: number;
}

export const SparklineWave: React.FC<SparklineWaveProps> = ({ id, color, height = 36 }) => {
  return (
    <Box style={{ width: '100%', height, overflow: 'hidden' }}>
      <svg
        viewBox="0 0 200 40"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id={`sparkline-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="60%" stopColor={color} stopOpacity="0.08" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Soft Area Fill */}
        <path
          d="M0,28 C30,16 55,34 90,20 C125,8 155,26 200,10 L200,40 L0,40 Z"
          fill={`url(#sparkline-grad-${id})`}
        />
        {/* Crisp Line Wave */}
        <path
          d="M0,28 C30,16 55,34 90,20 C125,8 155,26 200,10"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </Box>
  );
};

export const DeveloperIllustration: React.FC<{ width?: number; height?: number }> = ({
  width = 160,
  height = 96,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 220 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
    >
      {/* Background soft ambient glows */}
      <circle cx="160" cy="50" r="45" fill="#3B82F6" fillOpacity="0.08" />
      <circle cx="80" cy="80" r="35" fill="#10B981" fillOpacity="0.06" />

      {/* Modern desk surface */}
      <rect x="20" y="104" width="180" height="6" rx="3" fill="#E2E8F0" />
      <rect x="40" y="110" width="8" height="20" rx="2" fill="#CBD5E1" />
      <rect x="172" y="110" width="8" height="20" rx="2" fill="#CBD5E1" />

      {/* Desk plant */}
      <path d="M36 104 C36 94 44 94 44 104 Z" fill="#10B981" />
      <path d="M42 98 C46 88 52 92 46 102 Z" fill="#059669" />
      <path d="M38 104 L44 104 L43 109 L39 109 Z" fill="#94A3B8" />

      {/* Laptop / Monitor */}
      <rect x="75" y="44" width="76" height="52" rx="6" fill="#1E293B" />
      <rect x="79" y="48" width="68" height="42" rx="4" fill="#0F172A" />
      {/* Code lines on screen */}
      <rect x="85" y="56" width="30" height="3" rx="1.5" fill="#38BDF8" />
      <rect x="85" y="62" width="46" height="3" rx="1.5" fill="#818CF8" />
      <rect x="85" y="68" width="38" height="3" rx="1.5" fill="#34D399" />
      <rect x="92" y="74" width="28" height="3" rx="1.5" fill="#F472B6" />
      <rect x="85" y="80" width="50" height="3" rx="1.5" fill="#60A5FA" />
      {/* Stand */}
      <rect x="108" y="96" width="10" height="8" rx="1" fill="#64748B" />
      <rect x="98" y="102" width="30" height="3" rx="1.5" fill="#94A3B8" />

      {/* Floating Cloud / Dashboard Chart Badge */}
      <g filter="drop-shadow(0px 4px 8px rgba(0,0,0,0.06))">
        <rect x="145" y="18" width="62" height="42" rx="8" fill="#FFFFFF" />
        <rect x="151" y="24" width="24" height="4" rx="2" fill="#2563EB" />
        <rect x="151" y="32" width="6" height="18" rx="2" fill="#93C5FD" />
        <rect x="161" y="28" width="6" height="22" rx="2" fill="#3B82F6" />
        <rect x="171" y="36" width="6" height="14" rx="2" fill="#60A5FA" />
        <rect x="181" y="26" width="6" height="24" rx="2" fill="#1D4ED8" />
        <rect x="191" y="34" width="6" height="16" rx="2" fill="#93C5FD" />
      </g>

      {/* Floating Gear / Security Badge */}
      <g filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.05))">
        <circle cx="58" cy="38" r="14" fill="#FFFFFF" />
        <circle cx="58" cy="38" r="10" fill="#EEF2FF" />
        <path
          d="M58 32 L60 35 L63 35 L61 37 L62 40 L58 38 L54 40 L55 37 L53 35 L56 35 Z"
          fill="#4F46E5"
        />
      </g>
    </svg>
  );
};

export const ProductivityIllustration: React.FC<{ width?: number; height?: number }> = ({
  width = 140,
  height = 80,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 180 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
    >
      <circle cx="120" cy="45" r="32" fill="#60A5FA" fillOpacity="0.15" />
      <circle cx="45" cy="55" r="28" fill="#34D399" fillOpacity="0.12" />

      {/* Desk */}
      <rect x="10" y="82" width="160" height="5" rx="2.5" fill="#BFDBFE" />

      {/* Person working at laptop */}
      <rect x="85" y="44" width="46" height="36" rx="4" fill="#2563EB" />
      <rect x="88" y="47" width="40" height="28" rx="2" fill="#DBEAFE" />
      {/* Mini charts */}
      <rect x="92" y="58" width="6" height="13" rx="1.5" fill="#3B82F6" />
      <rect x="101" y="52" width="6" height="19" rx="1.5" fill="#10B981" />
      <rect x="110" y="62" width="6" height="9" rx="1.5" fill="#F59E0B" />
      <rect x="119" y="55" width="6" height="16" rx="1.5" fill="#8B5CF6" />
      {/* Keyboard */}
      <path d="M80 82 L136 82 L131 77 L85 77 Z" fill="#93C5FD" />

      {/* Coffee mug */}
      <rect x="52" y="68" width="12" height="14" rx="2" fill="#F43F5E" />
      <path d="M64 71 C67 71 67 77 64 77" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" />

      {/* Potted plant */}
      <path d="M145 82 C145 74 152 74 152 82 Z" fill="#10B981" />
      <path d="M150 76 C155 68 160 72 154 80 Z" fill="#059669" />
      <rect x="146" y="82" width="7" height="6" fill="#64748B" rx="1" />
    </svg>
  );
};
