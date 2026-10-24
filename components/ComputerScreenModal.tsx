'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  RotateCw,
  Maximize2,
  Minimize2,
  Monitor,
  Globe,
} from 'lucide-react';
import { RoomObject, normalizeComputerUrl } from '@/lib/room-engine';

interface ComputerScreenModalProps {
  pcObject: RoomObject | null;
  onClose: () => void;
}

export default function ComputerScreenModal({
  pcObject,
  onClose,
}: ComputerScreenModalProps) {
  const [customNavUrl, setCustomNavUrl] = useState<string>('');
  const [activeUrlInput, setActiveUrlInput] = useState<string>('');
  const [fitMode, setFitMode] = useState<'responsive' | 'scaled'>('responsive');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);

  useEffect(() => {
    if (pcObject) {
      const norm = normalizeComputerUrl(pcObject.pcUrl);
      setCustomNavUrl(norm.url);
      setActiveUrlInput(norm.url);
    }
  }, [pcObject]);

  if (!pcObject) return null;

  const resolved = normalizeComputerUrl(customNavUrl || pcObject.pcUrl);

  return (
    <div
      data-testid="habbo-computer-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pc-modal-title"
    >
      {/* Retro 90s Beige CRT Computer Monitor Outer Casing */}
      <div
        className={`relative flex flex-col rounded-[10px] border-4 border-black bg-[#D6D5C9] p-2.5 sm:p-4 text-[#1E1E1E] shadow-[0_16px_50px_rgba(0,0,0,0.95),inset_0_2px_0_#F5F5EE] transition-all ${
          isFullscreen
            ? 'h-[94vh] w-[96vw]'
            : 'h-[82vh] max-h-[680px] w-full max-w-[920px]'
        }`}
      >
        {/* Top Monitor Brand Bezel */}
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded border border-black bg-[#00748C] text-white">
              <Monitor className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2
                id="pc-modal-title"
                className="text-xs font-bold text-[#1E1E1E] leading-none"
                style={{ fontFamily: '"Volter", var(--font-pixel), monospace' }}
              >
                {pcObject.label} · HabboOS Web Terminal
              </h2>
              <span className="text-[10px] font-mono text-[#555550]">
                Connected to: {resolved.hostname}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setFitMode((m) =>
                  m === 'responsive' ? 'scaled' : 'responsive'
                )
              }
              title="Switch between Responsive View and Scaled Desktop View"
              className="rounded-[3px] border border-black bg-[#E5E5DC] px-2 py-1 text-[10px] font-bold text-black hover:bg-white"
            >
              {fitMode === 'responsive' ? 'Fit: Auto' : 'Fit: Desktop'}
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen((f) => !f)}
              title="Toggle Monitor Fullscreen"
              className="flex h-6 w-6 items-center justify-center rounded-[3px] border border-black bg-[#E5E5DC] text-black hover:bg-white"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close computer screen"
              className="flex h-6 w-6 items-center justify-center rounded-[3px] border border-black bg-[#C93B2B] text-white hover:bg-[#E04836]"
            >
              <X className="h-3.5 w-3.5 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Browser Address Bar inside CRT Bezel */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (activeUrlInput.trim()) {
              setCustomNavUrl(activeUrlInput.trim());
              setIframeKey((k) => k + 1);
            }
          }}
          className="mb-2 flex items-center gap-1.5 rounded-[4px] border-2 border-black bg-[#2B2827] p-1 text-xs"
        >
          <button
            type="button"
            onClick={() => setIframeKey((k) => k + 1)}
            title="Reload page"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[2px] border border-black bg-[#4A4745] text-white hover:bg-[#666260]"
          >
            <RotateCw className="h-3 w-3" />
          </button>

          <div className="flex flex-1 items-center gap-1.5 rounded-[2px] border border-black bg-white px-2 py-1">
            <Globe className="h-3.5 w-3.5 shrink-0 text-[#00748C]" />
            <input
              type="text"
              data-testid="pc-browser-url-bar"
              value={activeUrlInput}
              onChange={(e) => setActiveUrlInput(e.target.value)}
              placeholder="Enter any website URL (https://...)"
              className="w-full bg-transparent font-mono text-[11px] font-bold text-black focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="shrink-0 rounded-[2px] border border-black bg-[#D4912A] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#E3A836]"
          >
            Go
          </button>

          <a
            href={resolved.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open link in a new browser tab"
            className="inline-flex shrink-0 items-center gap-1 rounded-[2px] border border-black bg-[#15803D] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#16A34A]"
          >
            <span className="hidden sm:inline">Open Tab</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </form>

        {/* Recessed Inner CRT Glass Screen Viewport */}
        <div className="relative flex-1 w-full overflow-hidden rounded-[6px] border-4 border-[#1E293B] bg-[#0B0F19] shadow-[inset_0_0_24px_rgba(0,0,0,0.9)]">
          {resolved.canEmbedDirectly ? (
            <div className="relative h-full w-full overflow-hidden bg-white">
              <iframe
                key={`${resolved.embedUrl}-${iframeKey}`}
                data-testid="pc-monitor-iframe"
                src={resolved.embedUrl}
                title={pcObject.label}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                style={
                  fitMode === 'scaled'
                    ? {
                        width: '133.33%',
                        height: '133.33%',
                        transform: 'scale(0.75)',
                        transformOrigin: 'top left',
                      }
                    : { width: '100%', height: '100%' }
                }
                className="border-0 block"
              />
            </div>
          ) : (
            /* Smart Fallback Terminal Screen for websites that block IFrame embedding */
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#0F172A] to-[#020617] p-6 text-center text-white">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.35)]">
                <Globe className="h-8 w-8" />
              </div>
              <div
                className="mt-4 text-sm font-bold text-amber-300"
                style={{ fontFamily: '"Volter", var(--font-pixel), monospace' }}
              >
                {resolved.hostname.toUpperCase()} · EXTERNAL WEB PORTAL
              </div>
              <p className="mt-2 max-w-md font-mono text-xs text-slate-300 break-all">
                {resolved.url}
              </p>
              <p className="mt-2 max-w-sm text-[11px] text-slate-400">
                This website requires a direct browser window for security.
                Click below to launch it immediately!
              </p>
              <a
                href={resolved.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-[4px] border-2 border-black bg-[#D4912A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#E5A23B] shadow-[0_4px_0_#000,inset_0_1px_0_#F2C166]"
              >
                <span>Launch {resolved.hostname} in New Window</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>

        {/* Bottom CRT Monitor Power LED & Status Footer */}
        <div className="mt-2 flex items-center justify-between px-2 text-[10px] font-bold text-[#4A4745]">
          <span className="truncate max-w-[70%]">
            Tip: If a site blocks embedded view, click &ldquo;Open Tab&rdquo;
            in the top-right of the monitor.
          </span>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-black bg-emerald-500 shadow-[0_0_6px_#10B981]" />
            <span className="font-mono text-[9px]">CRT POWER ON</span>
          </div>
        </div>
      </div>
    </div>
  );
}