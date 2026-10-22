'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sliders,
  X,
  Wine,
  Box,
  ArrowRight,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { RoomObject, calculateRoomClutterMetrics, getNextStackHeightAtTile } from '@/lib/room-engine';

interface AdminConsoleModalProps {
  isOpen: boolean;
  objects: RoomObject[];
  onClose: () => void;
  onQuickSpawnBottle: (x: number, y: number) => void;
  onQuickSpawnBlock: (x: number, y: number) => void;
  onResetRoom: () => void;
}

export default function AdminConsoleModal({
  isOpen,
  objects,
  onClose,
  onQuickSpawnBottle,
  onQuickSpawnBlock,
  onResetRoom,
}: AdminConsoleModalProps) {
  if (!isOpen) return null;

  const metrics = calculateRoomClutterMetrics(objects);

  // Pick a target coordinate for quick console test placement
  const pickTargetCoord = (preferredX: number, preferredY: number) => {
    const z = getNextStackHeightAtTile(preferredX, preferredY, objects);
    return { x: preferredX, y: preferredY, z };
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="console-modal-title"
    >
      <div className="relative w-full max-w-xl border-2 border-emerald-500/70 bg-[#07110E] p-6 text-slate-100 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-emerald-900/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-emerald-500/50 bg-emerald-950/80 text-emerald-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-emerald-400 tabular-nums">
                CORNER TERMINAL · TILE (1, 1) · MASTER MONITOR
              </div>
              <h2
                id="console-modal-title"
                className="text-xl font-bold tracking-tight text-white"
              >
                Master Admin Control Console
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Admin Console Monitor"
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-emerald-800 bg-emerald-950/60 text-emerald-300 hover:border-emerald-500 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          This corner hardware terminal monitors room clutter density, stacked furniture tiers, and manual inventory placement. Use the quick-dispense levers below or enter the protected{' '}
          <span className="font-mono text-emerald-300">/admin</span> dashboard for full coordinate &amp; project link control.
        </p>

        {/* Master Monitor Readout Grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 border border-emerald-900/80 bg-[#040B09] p-4 font-mono tabular-nums">
          <div>
            <div className="text-[11px] text-slate-400">CLUTTER DENSITY</div>
            <div className="mt-1 text-lg font-bold text-emerald-400">
              {metrics.clutterPercentage}%
            </div>
            <div className="text-[11px] text-slate-500">
              {metrics.walkableTiles} tiles walkable
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">GLASS BOTTLES</div>
            <div className="mt-1 text-lg font-bold text-teal-300">
              {metrics.bottlesCount}
            </div>
            <div className="text-[11px] text-slate-500">Active in room</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">BUILDING BLOCKS</div>
            <div className="mt-1 text-lg font-bold text-amber-400">
              {metrics.blocksCount}
            </div>
            <div className="text-[11px] text-slate-500">Stacked voxels</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">NEON SCREENS</div>
            <div className="mt-1 text-lg font-bold text-cyan-400">
              {metrics.projectScreensCount}
            </div>
            <div className="text-[11px] text-slate-500">Project portals</div>
          </div>
        </div>

        {/* Hardware Levers for Instant Test Dispense */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              const coord = pickTargetCoord(2, 1);
              onQuickSpawnBottle(coord.x, coord.y);
            }}
            className="flex items-center justify-between border border-emerald-700/70 bg-emerald-950/50 px-4 py-3 text-left hover:border-emerald-400 hover:bg-emerald-900/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Wine className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">
                  Dispense Glass Bottle
                </div>
                <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                  Stack at Tile (2, 1)
                </div>
              </div>
            </div>
            <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => {
              const coord = pickTargetCoord(7, 7);
              onQuickSpawnBlock(coord.x, coord.y);
            }}
            className="flex items-center justify-between border border-amber-700/70 bg-amber-950/40 px-4 py-3 text-left hover:border-amber-400 hover:bg-amber-900/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Box className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">
                  Stack Building Block
                </div>
                <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                  Stack at Tile (7, 7)
                </div>
              </div>
            </div>
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-900/60 pt-4">
          <button
            type="button"
            onClick={onResetRoom}
            className="inline-flex items-center gap-1.5 border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Room Layout
          </button>

          <Link
            href="/admin"
            className="inline-flex items-center gap-2 bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-300 transition-colors whitespace-nowrap shrink-0"
          >
            <span>Open Protected /admin Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
