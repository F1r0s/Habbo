'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GridCoord,
  RoomObject,
  PatrolDirection,
  TILE_HEIGHT,
  gridToScreen,
  computeNextPatrolTile,
  computeRandomPatrolTile,
} from '@/lib/room-engine';

export interface DigitalPetProps {
  id: string;
  name: string;
  species: 'cat' | 'dragon' | 'camerabot';
  initialCoord: GridCoord;
  waypoints?: GridCoord[];
  randomWalk?: boolean;
  colorVariant?: string;
  objects: RoomObject[];
  originX: number;
  originY: number;
  scale: number;
  stepIntervalMs?: number;
  projectId: string;
  description: string;
  onInteract?: (pet: {
    id: string;
    name: string;
    species: 'cat' | 'dragon' | 'camerabot';
    coord: GridCoord;
    projectId: string;
    description: string;
    emoteText: string;
  }) => void;
}

const CAT_EMOTES = [
  '*meow!*',
  '*looks for salmon*',
  '*purrs happily*',
  '*sniffs the rug*',
];

const DRAGON_EMOTES = [
  '*sparks a tiny flame*',
  '*flaps wings*',
  '*glides across the grid*',
  '*guards the lounge*',
];

const BOT_EMOTES = [
  '*beep boop*',
  '*scan iso-grid*',
  '*patrols floor*',
  '*camera flash*',
];

export default function DigitalPet({
  id,
  name,
  species,
  initialCoord,
  waypoints = [],
  randomWalk = true,
  colorVariant,
  objects,
  originX,
  originY,
  scale,
  stepIntervalMs = 1900,
  projectId,
  description,
  onInteract,
}: DigitalPetProps) {
  const [coord, setCoord] = useState<GridCoord>(initialCoord);
  const [direction, setDirection] = useState<PatrolDirection>('sw');
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [stepFrame, setStepFrame] = useState<number>(0);
  const [emote, setEmote] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const spriteCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraBotImgRef = useRef<HTMLImageElement | null>(null);
  const dragonImgRef = useRef<HTMLImageElement | null>(null);
  const stateRef = useRef({
    coord: initialCoord,
    prevCoord: null as GridCoord | null,
    waypointIdx: 0,
    objects,
    waypoints,
    stepCount: 0,
  });

  useEffect(() => {
    stateRef.current.objects = objects;
    stateRef.current.waypoints = waypoints;
  }, [objects, waypoints]);

  // Load Open-Hotel CameraBot or Dragon sprite sheet
  useEffect(() => {
    if (species === 'camerabot') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        cameraBotImgRef.current = img;
      };
      img.src = '/resources/sprites/CameraBot.png';
    } else if (species === 'dragon') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        dragonImgRef.current = img;
      };
      img.src = '/resources/sprites/Dragon.png';
    }
  }, [species]);

  // Autonomous isometric grid random walk / patrol timer
  useEffect(() => {
    let moveTimeout: number | null = null;
    let emoteTimeout: number | null = null;

    const timer = window.setInterval(() => {
      const st = stateRef.current;
      let nextCoord: GridCoord;
      let nextDir: PatrolDirection;

      if (randomWalk || st.waypoints.length === 0) {
        const res = computeRandomPatrolTile(
          st.coord,
          st.objects,
          st.prevCoord
        );
        nextCoord = res.nextCoord;
        nextDir = res.direction;
      } else {
        const res = computeNextPatrolTile(
          st.coord,
          st.waypoints,
          st.waypointIdx,
          st.objects
        );
        nextCoord = res.nextCoord;
        st.waypointIdx = res.nextWaypointIndex;
        nextDir = res.direction;
      }

      st.prevCoord = st.coord;
      st.coord = nextCoord;
      st.stepCount += 1;

      setDirection(nextDir);
      setCoord(nextCoord);
      setIsMoving(true);

      if (moveTimeout) window.clearTimeout(moveTimeout);
      moveTimeout = window.setTimeout(() => {
        setIsMoving(false);
      }, Math.round(stepIntervalMs * 0.68));

      // Every 4th step, show a brief pixel emote tag
      if (st.stepCount % 4 === 0) {
        const pool =
          species === 'cat'
            ? CAT_EMOTES
            : species === 'dragon'
              ? DRAGON_EMOTES
              : BOT_EMOTES;
        const msg = pool[(st.stepCount / 4) % pool.length];
        setEmote(msg);
        if (emoteTimeout) window.clearTimeout(emoteTimeout);
        emoteTimeout = window.setTimeout(() => {
          setEmote(null);
        }, 1600);
      }
    }, stepIntervalMs);

    return () => {
      window.clearInterval(timer);
      if (moveTimeout) window.clearTimeout(moveTimeout);
      if (emoteTimeout) window.clearTimeout(emoteTimeout);
    };
  }, [species, stepIntervalMs, randomWalk]);

  // Pixel walk-cycle / wing-flap frame ticker
  useEffect(() => {
    const intervalMs = species === 'dragon' ? 150 : 160;
    if (!isMoving && species !== 'dragon') {
      setStepFrame(0);
      return;
    }
    const anim = window.setInterval(() => {
      setStepFrame((f) => (f + 1) % 4);
    }, intervalMs);
    return () => window.clearInterval(anim);
  }, [isMoving, species]);

  // Render crisp pixel-art pet sprite onto the 48x48 canvas
  useEffect(() => {
    const canvas = spriteCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    // 1. Isometric floor shadow diamond
    ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
    ctx.beginPath();
    ctx.moveTo(24, 35);
    ctx.lineTo(38, 41);
    ctx.lineTo(24, 47);
    ctx.lineTo(10, 41);
    ctx.closePath();
    ctx.fill();

    const pxRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      fill: string,
      outline = true
    ) => {
      if (outline) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
      }
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, w, h);
    };

    if (species === 'camerabot' && cameraBotImgRef.current) {
      const sy =
        direction === 'se'
          ? 396
          : direction === 'sw'
            ? 449
            : direction === 'ne'
              ? 231
              : 286;
      ctx.drawImage(cameraBotImgRef.current, 0, sy, 56, 52, 2, 2, 44, 41);
      return;
    }

    if (species === 'dragon') {
      // 2. Winged Habbo Dragon ('Draco') with 4-way orientation and flapping wings
      ctx.save();
      const flipX = direction === 'se' || direction === 'ne';
      if (flipX) {
        ctx.translate(48, 0);
        ctx.scale(-1, 1);
      }

      const wingLift = stepFrame % 2 === 0 ? -3 : 1;
      const clawStep = isMoving ? (stepFrame % 2 === 0 ? -2 : 2) : 0;
      const isBack = direction === 'nw' || direction === 'ne';

      // Dragon tail with spiked tip
      pxRect(31, 27 - wingLift, 8, 4, '#6D28D9');
      pxRect(37, 24 - wingLift, 4, 4, '#F43F5E');

      // Back wing
      pxRect(22, 9 + wingLift, 11, 12, '#7C3AED');
      ctx.fillStyle = '#C084FC';
      ctx.fillRect(24, 11 + wingLift, 7, 8);

      // Feet / claws
      pxRect(24, 34 - clawStep, 6, 5, '#5B21B6');
      pxRect(15, 35 + clawStep, 6, 5, '#6D28D9');

      // Plump dragon torso
      pxRect(15, 21, 16, 14, '#7C3AED');
      if (!isBack) {
        // Golden ribbed belly in front views (SW / SE)
        ctx.fillStyle = '#FDE047';
        ctx.fillRect(16, 23, 8, 10);
        ctx.fillStyle = '#CA8A04';
        ctx.fillRect(16, 25, 8, 1);
        ctx.fillRect(16, 28, 8, 1);
        ctx.fillRect(16, 31, 8, 1);
      } else {
        // Dorsal spine spikes in back views (NW / NE)
        pxRect(24, 19, 3, 12, '#F43F5E', false);
      }

      // Front wing
      pxRect(18, 11 - wingLift, 12, 13, '#8B5CF6');
      ctx.fillStyle = '#DDD6FE';
      ctx.fillRect(20, 13 - wingLift, 8, 9);

      // Dragon head & horns
      pxRect(9, 12, 13, 10, '#8B5CF6');
      pxRect(11, 7, 3, 5, '#FACC15');
      pxRect(17, 7, 3, 5, '#FACC15');

      if (!isBack) {
        // Glowing ruby eyes & snout nostrils
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(11, 15, 3, 3);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(11, 16, 2, 2);
        // Tiny flame puff on stepFrame === 1
        if (stepFrame === 1) {
          pxRect(4, 17, 4, 3, '#FB923C', false);
          pxRect(5, 18, 2, 2, '#FEF08A', false);
        }
      } else {
        // Back of head crest
        pxRect(14, 11, 5, 8, '#6D28D9', false);
      }

      ctx.restore();
      return;
    }

    // 3. Pixel-Art Patrolling Habbo Cat ('Milo' / 'Chat') with 4-way orientation
    ctx.save();
    const flipX = direction === 'se' || direction === 'ne';
    if (flipX) {
      ctx.translate(48, 0);
      ctx.scale(-1, 1);
    }

    const isBack = direction === 'nw' || direction === 'ne';
    const primaryCoat = colorVariant || '#64748B';
    const secondaryCoat = colorVariant ? '#FDE68A' : '#94A3B8';
    const stripeCoat = colorVariant ? '#B45309' : '#334155';

    const pawOffset = isMoving ? (stepFrame % 2 === 0 ? -2 : 2) : 0;
    const tailSwing = isMoving ? (stepFrame % 2 === 0 ? -2 : 2) : 0;

    // Animated upright pixel tail at rear-right
    pxRect(31, 18 + tailSwing, 4, 10, primaryCoat);
    pxRect(33, 14 + tailSwing, 4, 5, secondaryCoat);

    // Back paws
    pxRect(26, 33 - pawOffset, 5, 5, '#E2E8F0');
    pxRect(20, 35 + pawOffset, 5, 5, '#CBD5E1');

    // Plump tabby cat body
    pxRect(15, 22, 18, 12, primaryCoat);
    ctx.fillStyle = secondaryCoat;
    ctx.fillRect(16, 23, 14, 5);
    ctx.fillStyle = stripeCoat;
    ctx.fillRect(20, 23, 2, 6);
    ctx.fillRect(25, 23, 2, 6);
    ctx.fillRect(17, 30, 12, 3);

    // Front paws
    pxRect(13, 33 + pawOffset, 5, 5, '#F8FAFC');
    pxRect(17, 35 - pawOffset, 5, 5, '#E2E8F0');

    // Red Habbo pixel collar
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(13, 24, 8, 3);
    if (!isBack) {
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(14, 26, 3, 3);
    }

    // Cat head
    pxRect(9, 13, 13, 11, secondaryCoat);
    // Pointed ears
    pxRect(9, 9, 4, 4, primaryCoat);
    pxRect(17, 9, 4, 4, primaryCoat);

    if (!isBack) {
      // Pink inner ears
      ctx.fillStyle = '#F472B6';
      ctx.fillRect(10, 10, 2, 2);
      ctx.fillRect(18, 10, 2, 2);

      // Expressive pixel eyes & pink nose
      ctx.fillStyle = '#000000';
      ctx.fillRect(11, 17, 2, 3);
      ctx.fillRect(16, 17, 2, 3);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(11, 17, 1, 1);
      ctx.fillRect(16, 17, 1, 1);
      ctx.fillStyle = '#FB7185';
      ctx.fillRect(12, 20, 3, 2);
    } else {
      // Back of head stripes when walking away (NW / NE)
      ctx.fillStyle = primaryCoat;
      ctx.fillRect(10, 14, 11, 9);
      ctx.fillStyle = stripeCoat;
      ctx.fillRect(13, 15, 5, 2);
      ctx.fillRect(14, 18, 3, 2);
    }

    ctx.restore();
  }, [species, direction, isMoving, stepFrame, colorVariant]);

  // Convert current isometric grid coordinate to scaled viewport pixel position
  const rawScreen = gridToScreen(coord.x, coord.y, 0, originX, originY);
  const screenX = Math.round(rawScreen.sx * scale - 24 * scale);
  const screenY = Math.round((rawScreen.sy + TILE_HEIGHT - 44) * scale);

  const moveDurationSec = (stepIntervalMs * 0.68) / 1000;

  return (
    <motion.div
      data-testid={`digital-pet-${id}`}
      data-pet-coord={`${coord.x},${coord.y}`}
      data-pet-direction={direction}
      initial={false}
      animate={{
        x: screenX,
        y: screenY,
      }}
      transition={{
        duration: moveDurationSec,
        ease: 'linear',
      }}
      style={{
        width: Math.round(48 * scale),
        height: Math.round(48 * scale),
        zIndex: 15,
      }}
      className="pointer-events-auto absolute top-0 left-0 cursor-pointer select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        const pool =
          species === 'cat'
            ? CAT_EMOTES
            : species === 'dragon'
              ? DRAGON_EMOTES
              : BOT_EMOTES;
        const chosenEmote = pool[Math.floor(Math.random() * pool.length)];
        setEmote(chosenEmote);
        onInteract?.({
          id,
          name,
          species,
          coord,
          projectId,
          description,
          emoteText: chosenEmote,
        });
      }}
    >
      {/* Floating Volter Pixel Emote / Name Tag */}
      <AnimatePresence>
        {(emote || isHovered) && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: -4 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap border border-black bg-white px-1.5 py-0.5 text-[9px] font-bold text-black shadow-[1px_1px_0px_#000]"
            style={{ fontFamily: '"Volter", var(--font-pixel), monospace' }}
          >
            <span className="text-[#3B6E8C]">{name}:</span>{' '}
            <span>{emote || `(${coord.x},${coord.y})`}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Framer Motion Walking Bob & Pixel Sprite Canvas */}
      <motion.div
        animate={
          species === 'dragon'
            ? { y: [0, -5 * scale, 0] }
            : isMoving
              ? { y: [0, -3.5 * scale, 0, -2.5 * scale, 0] }
              : { y: [0, -1 * scale, 0] }
        }
        transition={{
          duration: species === 'dragon' ? 0.85 : isMoving ? 0.45 : 1.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="h-full w-full"
      >
        <canvas
          ref={spriteCanvasRef}
          width={48}
          height={48}
          aria-label={`Patrolling digital pet ${name}`}
          className="h-full w-full block"
          style={{ imageRendering: 'pixelated' }}
        />
      </motion.div>
    </motion.div>
  );
}
