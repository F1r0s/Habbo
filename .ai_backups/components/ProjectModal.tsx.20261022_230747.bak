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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
    >
      <div className="relative w-full max-w-lg border-2 border-slate-700 bg-[#0B0F19] p-6 text-slate-100 shadow-2xl">
        {/* Top Colored Pixel Accent Bar */}
        <div
          className=" mb-5 h-1.5 w-full"
          style={{ backgroundColor: project.accentColor }}
        />

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 tabular-nums">
              <span>{project.category}</span>
              <span aria-hidden="true">·</span>
              <span>{project.featuredMetric}</span>
              {screenObject && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">
                    Tile ({screenObject.x}, {screenObject.y})
                  </span>
                </>
              )}
            </div>
            <h2
              id="project-modal-title"
              className="mt-1.5 text-2xl font-bold tracking-tight text-white"
            >
              {project.title}
            </h2>
            <p className="mt-1 text-sm text-slate-300">{project.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close project details"
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 border-t border-slate-800 pt-4">
          <p className="text-sm leading-relaxed text-slate-300">
            {project.description}
          </p>
        </div>

        {/* Unboxed metadata for tech stack per Zero-Pill Discipline */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4 text-xs text-slate-400">
          <Terminal className="h-3.5 w-3.5 text-slate-500" />
          <span className="font-medium text-slate-300">Stack:</span>
          {project.techStack.map((tech, idx) => (
            <React.Fragment key={tech}>
              {idx > 0 && <span aria-hidden="true">·</span>}
              <span className="font-mono text-slate-200">{tech}</span>
            </React.Fragment>
          ))}
        </div>

        {screenObject && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            <span>
              Mounted on:{' '}
              {screenObject.type === 'neon_bulletin'
                ? 'Oversized Neon Bulletin Board'
                : 'Angled Floating Screen'}{' '}
              at Grid ({screenObject.x}, {screenObject.y}, z={screenObject.z})
            </span>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-800 pt-5">
          {screenObject && onWalkToScreen && (
            <button
              type="button"
              onClick={() => {
                onWalkToScreen(screenObject.x, screenObject.y);
                onClose();
              }}
              className="inline-flex items-center gap-2 border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Navigation className="h-3.5 w-3.5" />
              Walk Avatar Here
            </button>
          )}

          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 transition-transform active:scale-95 whitespace-nowrap shrink-0"
            style={{ backgroundColor: project.accentColor }}
          >
            <span>Visit Live Project</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
