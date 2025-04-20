'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

interface DocumentSealProps {
  status: string;
  date?: Date | string | number; // Kept for backward compatibility
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export const DocumentSeal: React.FC<DocumentSealProps> = ({
  status,
  date: _, // Unused but kept for backward compatibility
  className = '',
  size = 'medium',
}) => {
  // Normalize status
  const normalizedStatus =
    typeof status === 'string' ? status.toLowerCase() : '';

  // Determine if document is verified or rejected
  const isVerified =
    normalizedStatus === 'verified' ||
    normalizedStatus === '0' ||
    normalizedStatus === '2'; // In some places '2' is verified

  const isRejected =
    normalizedStatus === 'rejected' || normalizedStatus === '3';

  // If neither verified nor rejected, don't render a seal
  if (!isVerified && !isRejected) {
    return null;
  }

  // We'll use "Authentico" text instead of the date
  const brandText = 'Authentico';

  // Size mapping
  const sizeMap = {
    small: {
      width: 100,
      height: 100,
      fontSize: 13,
      dateFontSize: 10,
      iconSize: 20,
      borderWidth: 3,
      inkDropSize: 3,
    },
    medium: {
      width: 130,
      height: 130,
      fontSize: 16,
      dateFontSize: 12,
      iconSize: 26,
      borderWidth: 4,
      inkDropSize: 4,
    },
    large: {
      width: 160,
      height: 160,
      fontSize: 18,
      dateFontSize: 14,
      iconSize: 32,
      borderWidth: 5,
      inkDropSize: 5,
    },
  };

  const {
    width,
    height,
    fontSize,
    dateFontSize,
    iconSize,
    borderWidth,
    inkDropSize,
  } = sizeMap[size];

  // Seal colors and text based on status
  const sealConfig = isVerified
    ? {
        outerColor: '#1B4332', // deep-moss
        innerColor: '#2E7D32', // forest-green
        accentColor: '#4CAF50', // lighter green for accents
        textColor: '#FFFFFF', // white
        text: 'VERIFIED',
        icon: <Check size={iconSize} strokeWidth={3} />,
        patternOpacity: 1,
        glowColor: 'rgba(46, 125, 50, 0.8)', // forest-green glow
        inkColor: '#2E7D32', // forest-green for ink
      }
    : {
        outerColor: '#B44C43', // burnt-sienna
        innerColor: '#9B2C2C', // darker red
        accentColor: '#E57373', // lighter red for accents
        textColor: '#FFFFFF', // white
        text: 'REJECTED',
        icon: <X size={iconSize} strokeWidth={3} />,
        patternOpacity: 1,
        glowColor: 'rgba(180, 76, 67, 0.8)', // burnt-sienna glow
        inkColor: '#9B2C2C', // darker red for ink
      };

  // Calculate dimensions for hexagon pattern
  const hexSize = width * 0.09;
  const hexRadius = width * 0.32; // Radius for hexagon placement

  // Generate points for a hexagon
  const generateHexagonPoints = (
    centerX: number,
    centerY: number,
    size: number
  ) => {
    let points = '';
    for (let i = 0; i < 6; i++) {
      const angleDeg = 60 * i - 30;
      const angleRad = (Math.PI / 180) * angleDeg;
      const x = centerX + size * Math.cos(angleRad);
      const y = centerY + size * Math.sin(angleRad);
      points += `${x},${y} `;
    }
    return points.trim();
  };

  // Generate ink drip paths
  const generateInkDrips = () => {
    const drips: React.ReactNode[] = [];
    const numDrips = 8;
    const radius = width / 2 - borderWidth / 2;

    for (let i = 0; i < numDrips; i++) {
      // Random angle for each drip
      const angle = (Math.PI * 2 * i) / numDrips + Math.random() * 0.3;
      // Random length for each drip
      const dripLength = inkDropSize * (2 + Math.random() * 3);
      // Random width for each drip
      const dripWidth = inkDropSize * (0.5 + Math.random() * 0.8);

      const startX = width / 2 + radius * Math.cos(angle);
      const startY = height / 2 + radius * Math.sin(angle);

      const endX = startX + dripLength * Math.cos(angle);
      const endY = startY + dripLength * Math.sin(angle);

      // Control points for the bezier curve to create a drip effect
      const ctrl1X =
        startX +
        dripLength * 0.5 * Math.cos(angle) +
        dripWidth * Math.cos(angle + Math.PI / 2);
      const ctrl1Y =
        startY +
        dripLength * 0.5 * Math.sin(angle) +
        dripWidth * Math.sin(angle + Math.PI / 2);

      const ctrl2X =
        startX +
        dripLength * 0.5 * Math.cos(angle) -
        dripWidth * Math.cos(angle + Math.PI / 2);
      const ctrl2Y =
        startY +
        dripLength * 0.5 * Math.sin(angle) -
        dripWidth * Math.sin(angle + Math.PI / 2);

      // Create a drip path
      const path = `M ${startX} ${startY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${endX} ${endY}`;

      drips.push(
        <path
          key={`drip-${i}`}
          d={path}
          stroke={sealConfig.inkColor}
          strokeWidth={inkDropSize * 0.5}
          fill="none"
          opacity={0.7 + Math.random() * 0.3}
        />
      );

      // Add a drop at the end of some drips
      if (Math.random() > 0.4) {
        drips.push(
          <circle
            key={`drop-${i}`}
            cx={endX}
            cy={endY}
            r={inkDropSize * (0.5 + Math.random() * 0.5)}
            fill={sealConfig.inkColor}
            opacity={0.7 + Math.random() * 0.3}
          />
        );
      }
    }

    return drips;
  };

  return (
    <div
      className={`relative ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: 'rotate(12deg)',
        filter: `drop-shadow(0px 0px 10px ${sealConfig.glowColor})`,
      }}
    >
      {/* SVG Seal with transparent background */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial gradient for subtle background */}
          <radialGradient
            id={`sealGradient-${isVerified ? 'verified' : 'rejected'}`}
            cx="50%"
            cy="50%"
            r="50%"
            fx="50%"
            fy="50%"
          >
            <stop
              offset="0%"
              stopColor={sealConfig.innerColor}
              stopOpacity="0.2"
            />
            <stop
              offset="70%"
              stopColor={sealConfig.innerColor}
              stopOpacity="0.05"
            />
            <stop
              offset="100%"
              stopColor={sealConfig.innerColor}
              stopOpacity="0"
            />
          </radialGradient>

          {/* Filter for the glow effect */}
          <filter
            id={`glow-${isVerified ? 'verified' : 'rejected'}`}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Filter for the ink texture */}
          <filter
            id={`ink-texture-${isVerified ? 'verified' : 'rejected'}`}
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.05"
              numOctaves="2"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="5"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        {/* Ink drips */}
        <g>{generateInkDrips()}</g>

        {/* Outer ring with blockchain-inspired segments */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={width / 2 - borderWidth}
          fill="none"
          stroke={sealConfig.outerColor}
          strokeWidth={borderWidth}
          strokeDasharray={`${width * 0.05} ${width * 0.02}`}
          filter={`url(#ink-texture-${isVerified ? 'verified' : 'rejected'})`}
        />

        {/* Inner ring */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={width / 2 - borderWidth * 3}
          fill="none"
          stroke={sealConfig.outerColor}
          strokeWidth={borderWidth / 2}
          strokeOpacity="0.9"
        />

        {/* Hexagon pattern - web3/blockchain inspired */}
        <g>
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const x = width / 2 + hexRadius * Math.cos((angle * Math.PI) / 180);
            const y =
              height / 2 + hexRadius * Math.sin((angle * Math.PI) / 180);
            return (
              <polygon
                key={i}
                points={generateHexagonPoints(x, y, hexSize)}
                fill="none"
                stroke={sealConfig.accentColor}
                strokeWidth="1.5"
                strokeOpacity={sealConfig.patternOpacity}
              />
            );
          })}
        </g>

        {/* Central hexagon */}
        <polygon
          points={generateHexagonPoints(width / 2, height / 2, hexSize * 1.8)}
          fill="none"
          stroke={sealConfig.accentColor}
          strokeWidth="2"
          strokeOpacity="1"
        />

        {/* Connection lines between hexagons - blockchain network effect */}
        <g
          strokeOpacity="0.8"
          stroke={sealConfig.accentColor}
          strokeWidth="1.2"
        >
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const x = width / 2 + hexRadius * Math.cos((angle * Math.PI) / 180);
            const y =
              height / 2 + hexRadius * Math.sin((angle * Math.PI) / 180);
            return (
              <line
                key={i}
                x1={width / 2}
                y1={height / 2}
                x2={x}
                y2={y}
                strokeDasharray="3 2"
              />
            );
          })}
        </g>

        {/* Digital circuit pattern */}
        <g strokeOpacity="0.8" stroke={sealConfig.accentColor} strokeWidth="1">
          {[30, 90, 150, 210, 270, 330].map((angle, i) => {
            const radius = width * 0.25;
            const x1 = width / 2 + radius * Math.cos((angle * Math.PI) / 180);
            const y1 = height / 2 + radius * Math.sin((angle * Math.PI) / 180);
            const x2 =
              width / 2 +
              radius * 1.2 * Math.cos(((angle + 15) * Math.PI) / 180);
            const y2 =
              height / 2 +
              radius * 1.2 * Math.sin(((angle + 15) * Math.PI) / 180);
            return (
              <React.Fragment key={`circuit-${i}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} />
                <circle cx={x2} cy={y2} r="1.5" fill={sealConfig.accentColor} />
              </React.Fragment>
            );
          })}
        </g>
      </svg>

      {/* Text overlay with improved contrast */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ transform: 'rotate(-12deg)' }}
      >
        {/* Status badge with modern styling */}
        <div
          className="flex items-center justify-center text-center font-black px-4 py-1.5 rounded-full"
          style={{
            backgroundColor: `${sealConfig.outerColor}E6`, // More visible but still transparent
            color: sealConfig.textColor,
            boxShadow: `0 0 12px ${sealConfig.glowColor}`,
            backdropFilter: 'blur(1px)',
            border: `1px solid ${sealConfig.accentColor}80`,
          }}
        >
          <span className="mr-1.5">{sealConfig.icon}</span>
          <span style={{ fontSize: `${fontSize}px`, letterSpacing: '0.5px' }}>
            {sealConfig.text}
          </span>
        </div>

        {/* Brand text with improved visibility */}
        <div
          className="text-center mt-2.5 font-bold"
          style={{
            fontSize: `${dateFontSize}px`,
            color: sealConfig.outerColor,
            textShadow: `0 0 5px rgba(255, 255, 255, 0.9)`,
            letterSpacing: '1px',
          }}
        >
          {brandText}
        </div>
      </div>
    </div>
  );
};
