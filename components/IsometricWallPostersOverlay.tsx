'use client';

import React from 'react';
import {
  RoomObject,
  DEFAULT_POSTER_IMAGES,
  isWallPosterType,
  clampObjectScale,
  normalizeRotationAngle,
  angleToIsometricRotation,
  rotationToAngle,
} from '@/lib/room-engine';
import {
  POSTER_BASE_WIDTH_PX,
  POSTER_BASE_HEIGHT_PX,
  POSTER_WALL_OFFSET_Y,
  getWallPosterScreenAnchor,
} from '@/lib/isometric-painter';

interface IsometricWallPostersOverlayProps {
  objects: RoomObject[];
  originX: number;
  originY: number;
  scale: number;
  selectedObjectId?: string | null;
  onSelectPoster?: (posterObj: RoomObject) => void;
}

export default function IsometricWallPostersOverlay({
  objects,
  originX,
  originY,
  scale,
  selectedObjectId,
  onSelectPoster,
}: IsometricWallPostersOverlayProps) {
  const posterObjects = objects.filter((o) => isWallPosterType(o.type));

  if (posterObjects.length === 0) return null;

  return (
    <div
      data-testid="isometric-wall-posters-layer"
      className="pointer-events-none absolute inset-0 overflow-hidden z-10"
    >
      {posterObjects.map((poster) => {
        const { sx, sy } = getWallPosterScreenAnchor(poster, originX, originY);
        const objScale = clampObjectScale(poster.scale);
        const combinedScale = scale * objScale;

        const centerX = sx * scale;
        const centerY = (sy + POSTER_WALL_OFFSET_Y) * scale;
        const posterW = Math.round(POSTER_BASE_WIDTH_PX * combinedScale);
        const posterH = Math.round(POSTER_BASE_HEIGHT_PX * combinedScale);

        const effectiveRot =
          typeof poster.rotationAngle === 'number'
            ? angleToIsometricRotation(poster.rotationAngle)
            : poster.rotation;
        const isRightWallAligned =
          effectiveRot === 'se' || effectiveRot === 'nw';
        const baseSkew = isRightWallAligned ? 26.56505 : -26.56505;
        const cardinalDeg = rotationToAngle(effectiveRot);
        const rawDeg = normalizeRotationAngle(
          poster.rotationAngle,
          effectiveRot
        );
        const fineTilt = ((rawDeg - cardinalDeg + 540) % 360) - 180;
        const skewDeg = baseSkew + fineTilt * 0.45;

        const imgSrc =
          poster.imageUrl ||
          DEFAULT_POSTER_IMAGES[
            poster.type as keyof typeof DEFAULT_POSTER_IMAGES
          ];
        const borderCol =
          poster.colorVariant ||
          (poster.type === 'poster_chelsea'
            ? '#1D4ED8'
            : poster.type === 'poster_raja_gb05'
              ? '#16A34A'
              : '#DC2626');
        const isSelected = selectedObjectId === poster.id;

        return (
          <div
            key={poster.id}
            data-testid={`isometric-wall-poster-${poster.id}`}
            data-poster-type={poster.type}
            style={{
              left: `${centerX}px`,
              top: `${centerY}px`,
            }}
            className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 select-none group"
          >
            {/* Skewed 3D Isometric Wall Poster Frame */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSelectPoster?.(poster);
              }}
              style={{
                width: `${posterW}px`,
                height: `${posterH}px`,
                transform: `skewY(${skewDeg}deg)`,
                borderColor: isSelected ? '#FACC15' : borderCol,
                boxShadow: isSelected
                  ? '0 0 18px rgba(250, 204, 21, 0.8), 3px 4px 0px #000'
                  : `0 0 14px ${borderCol}66, 3px 4px 0px #000`,
              }}
              title={`${poster.label} · Click to inspect or customize`}
              className="relative cursor-pointer overflow-hidden rounded-[2px] border-[3px] bg-black transition-shadow duration-150 hover:brightness-110"
            >
              {/* High-Definition Poster Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc}
                alt={poster.label}
                draggable={false}
                className="h-full w-full object-cover block pointer-events-none"
              />

              {/* Subtle Glossy Poster Sheen & 4 Golden Pin-Tacks */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/15"
              />
              <span className="pointer-events-none absolute top-1 left-1 h-1.5 w-1.5 rounded-full border border-black bg-amber-300 shadow" />
              <span className="pointer-events-none absolute top-1 right-1 h-1.5 w-1.5 rounded-full border border-black bg-amber-300 shadow" />
              <span className="pointer-events-none absolute bottom-1 left-1 h-1.5 w-1.5 rounded-full border border-black bg-amber-300 shadow" />
              <span className="pointer-events-none absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full border border-black bg-amber-300 shadow" />

              {/* Bottom Caption Strip */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/80 px-1 py-0.5 text-center">
                <span
                  className="block truncate text-[7px] font-bold uppercase tracking-wider text-white"
                  style={{ fontFamily: '"Volter", var(--font-pixel), monospace' }}
                >
                  {poster.label}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}