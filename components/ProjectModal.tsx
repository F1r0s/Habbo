'use client';

import React from 'react';
import { ExternalLink, X, Terminal, Navigation, Layers } from 'lucide-react';
import { ProjectLink, RoomObject } from '@/lib/room-engine';

interface ProjectModalProps {
  project: ProjectLink | null;
  screenObject?: RoomObject | null;
  onClose: () => void;
  onWalkToScreen?: (x: number, y: number) => void;
}

export default function ProjectModal({
  project,
  screenObject,
  onClose,
  onWalkToScreen,
}: ProjectModalProps) {
  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
    >
      <div className="relative w-full max-w-md rounded-[6px] border-2 border-black bg-[#E2E2DE] text-[#1E1E1E] shadow-[0_12px_40px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Classic Habbo Teal Title Bar */}
        <div className="flex items-center justify-between border-b-2 border-[#24475B] bg-[#3B6E8C] px-3 py-1.5 text-white shadow-[inset_0_1px_0_#6BA7C9]">
          <span
            id="project-modal-title"
            className="text-xs font-bold drop-shadow-[0_1px_0_rgba(0,0,0,0.6)]"
            style={{ fontFamily: '"Volter", var(--font-pixel), monospace' }}
          >
            {project.title} · {project.category}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close project details"
            className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[2px] border border-black bg-[#C93B2B] text-white hover:bg-[#E04836]"
          >
            <X className="h-3 w-3 stroke-[3]" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="rounded-[3px] border border-[#8E8E8A] bg-white p-3 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#3B6E8C]">
              <span>{project.subtitle}</span>
              <span className="rounded border border-black/30 bg-[#FEF08A] px-1.5 py-0.5 text-[10px] text-black">
                {project.featuredMetric}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#222222]">
              {project.description}
            </p>
          </div>

          <div className="rounded-[3px] border border-[#8E8E8A] bg-[#D6D6D2] px-3 py-2 text-xs text-[#222222]">
            <div className="flex flex-wrap items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-[#D97706]" />
              <span className="font-bold">Tech Stack:</span>
              {project.techStack.map((tech, idx) => (
                <React.Fragment key={tech}>
                  {idx > 0 && <span aria-hidden="true">·</span>}
                  <span className="font-mono font-bold text-black">{tech}</span>
                </React.Fragment>
              ))}
            </div>
            {screenObject && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#444444]">
                <Layers className="h-3 w-3 text-[#3B6E8C]" />
                <span>
                  Tile ({screenObject.x}, {screenObject.y}, z={screenObject.z})
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            {screenObject && onWalkToScreen && (
              <button
                type="button"
                onClick={() => {
                  onWalkToScreen(screenObject.x, screenObject.y);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-[3px] border-2 border-black bg-[#CCCCCC] px-3 py-1.5 text-xs font-bold text-[#1E1E1E] hover:bg-white shadow-[inset_0_1px_0_#FFFFFF]"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>Walk Here</span>
              </button>
            )}

            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-[3px] border-2 border-black bg-[#D4912A] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#E5A23B] shadow-[inset_0_1px_0_#F2C166]"
            >
              <span>Visit Live Project</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
