'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Music,
  ExternalLink,
  X,
  Armchair,
  Sparkles,
  KeyRound,
  Plus,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Hammer,
  RotateCcw,
  RotateCw,
  Trash2,
  MousePointerClick,
  Tv,
  Shuffle,
  User,
} from 'lucide-react';
import {
  GRID_SIZE,
  TILE_HEIGHT,
  OBJECT_CATALOG,
  DEFAULT_YOUTUBE_VIDEO_URL,
  RoomObject,
  RoomObjectType,
  ProjectLink,
  GridCoord,
  IsometricRotation,
  TimeOfDayTheme,
  FloorPatternType,
  VisitorAvatarProfile,
  computeTimeOfDayTheme,
  screenToGrid,
  gridToScreen,
  isWithinGrid,
  isTileWalkable,
  findPath,
  findSittableObjectAtTile,
  getNextRotation,
  getNextStackHeightAtTile,
  extractYouTubeVideoId,
  normalizeYouTubeEmbedUrl,
  MIN_OBJECT_SCALE,
  MAX_OBJECT_SCALE,
  HeldDrinkType,
  isDrinkDispenserType,
  resolveStaircaseTargetFloor,
  getFloorElevationAtTile,
  hitTestRoomObjectAtScreen,
  clampObjectScale,
  normalizeRotationAngle,
  angleToIsometricRotation,
  pickWalkableSpawnTile,
} from '@/lib/room-engine';
import {
  renderIsometricRoom,
  renderFurniSlotThumbnail,
  RenderedRemoteAvatar,
} from '@/lib/isometric-painter';
import { loadHabboSpriteAtlas } from '@/lib/habbo-sprites';
import { useRoomStore, pixelAudio } from '@/lib/use-room-store';
import DigitalPet from './DigitalPet';
import ProjectModal from './ProjectModal';
import AdminConsoleModal from './AdminConsoleModal';
import IsometricYoutubeTvOverlay, {
  dispatchTvControlEvent,
} from './IsometricYoutubeTvOverlay';
import IsometricWallPostersOverlay from './IsometricWallPostersOverlay';
import ComputerScreenModal from './ComputerScreenModal';

const TIME_OVERRIDE_PRESETS: Array<{ label: string; hour: number | null }> = [
  { label: 'AUTO', hour: null },
  { label: 'DAWN', hour: 7 },
  { label: 'DAY', hour: 13 },
  { label: 'SUNSET', hour: 19 },
  { label: 'NIGHT', hour: 23 },
];

const NOTIFICATION_AUTO_DISMISS_MS = 5200;

const QUICK_PLACEABLE_TYPES: RoomObjectType[] = [
  'retro_pc_desk',
  'office_chair',
  'red_sofa',
  'beanbag_chair',
  'bed_blue',
  'bed_green',
  'bookshelf',
  'wardrobe',
  'crt_tv_console',
  'pizza_box',
  'floor_lamp',
  'wall_divider',
  'lockable_door',
  'dispenser_coffee',
  'dispenser_cola',
  'dispenser_juice',
  'stairs_up',
  'stairs_down',
  'upper_floor_tile',
  'poster_raja_gb05',
  'poster_wydad_winners',
  'poster_chelsea',
  'gold_spotlight',
  'habbo_candle',
  'youtube_tv',
  'white_sofa',
  'wood_stool',
  'wood_table',
  'potted_plant',
  'building_block',
  'glass_bottle',
  'luxury_rug_pink',
  'luxury_rug_blue',
  'luxury_rug_gold',
  'royal_crown_gold',
  'royal_crown_purple',
  'water_bowl',
  'pet_cat_basket',
  'pet_dragon',
  'floating_screen',
];

const INTERACTION_FLAVOR_TEXT: Record<RoomObjectType, string> = {
  youtube_tv:
    'Window-sized 3D Isometric YouTube Television! Broadcasts live YouTube videos in 3D for everyone visiting the room.',
  white_sofa:
    'Classic Habbo Club white leather two-seater sofa. Click to walk over and sit down, or rotate in 360° (SE, SW, NW, NE).',
  wood_stool:
    'Round carved oak bar stool with cushioned pixel top. Click to sit down or rotate 360°.',
  wood_table:
    'Warm mahogany Habbo lounge table with bevelled legs. Great centerpiece for drinks and collectibles.',
  potted_plant:
    'Lush tropical indoor bamboo plant in a ceramic pot. Brings fresh pixel greenery to the suite.',
  building_block:
    'Stackable isometric Habbo Builders’ Club cube. Can be colour-tinted, rotated 360°, and stacked.',
  glass_bottle:
    'Translucent pixel beverage bottle with specular shine. Refreshing lounge prop!',
  luxury_rug_pink:
    'Woven magenta-pink Habbo floor rug with pixel fringe. Walkable floor decor.',
  luxury_rug_blue:
    'Woven sky-blue Habbo floor rug with pixel fringe. Walkable floor decor.',
  luxury_rug_gold:
    'Royal gold woven Habbo floor carpet with ornamental border. Walkable floor decor.',
  royal_crown_gold:
    'Rare sovereign golden crown set with ruby & emerald pixels on a velvet pillow.',
  royal_crown_purple:
    'Amethyst sovereign crown collectible displayed on a velvet cushion.',
  pet_dragon:
    'Draco’s enchanted dragon perch! Draco patrols the room randomly flapping his wings.',
  pet_cat_basket:
    'Cozy woven wicker cat basket with a soft red cushion while Chat & Milo roam the floor.',
  water_bowl:
    'Pixel pet dish filled with fresh water and a slice of pink salmon for the cats.',
  neon_bulletin:
    'Wall-mounted holographic project screen. Click Visit or Details to inspect the linked project.',
  floating_screen:
    'Interactive holographic project monitor. Click to inspect the linked portfolio project.',
  admin_console:
    'Owner room terminal (Higma). Allows quick-spawning items or entering the Builders’ Club studio.',
  poster_chelsea:
    'Framed 3D Wall Poster of Chelsea FC #20 in the royal blue home kit with golden FIFA Club World Cup badge & IFS sponsor.',
  poster_raja_gb05:
    'Framed 3D Wall Poster of Ultras Green Boys 05 ("Until Death") featuring the iconic Alien emblem and Raja Club Athletic crest.',
  poster_wydad_winners:
    'Framed 3D Wall Poster of Wydad & Winners featuring the Ultras Winners red beret emblem, golden stars, and Wydad AC crest.',
  gold_spotlight:
    'Authentic Habbo Hotel golden stage spotlight casting a warm vertical beam.',
  habbo_candle:
    'Authentic Open-Hotel pixel candelabra with animated flickering flame.',
  dispenser_coffee:
    'Interactive Habbo Espresso Machine! Click to walk over and grab a hot cup of coffee.',
  dispenser_cola:
    'Classic red Habbo Ice Cola Machine! Click to dispense a cold fizzy Habbo Cola cup.',
  dispenser_juice:
    'Tropical Pixel Juice Dispenser! Click to pour a fresh tropical juice glass.',
  stairs_up:
    'Multi-step isometric staircase leading up to an elevated upper floor or stage.',
  stairs_down:
    'Recessed isometric steps leading down into a sunken lounge pit.',
  upper_floor_tile:
    'Raised mezzanine building floor deck with support pillars for multi-level rooms.',
  retro_pc_desk:
    'Interactive Retro CRT Computer Desk! Click to open the programmed website or app on the CRT monitor.',
  office_chair:
    'Ergonomic wheeled swivel desk chair. Click to sit down at the computer desk!',
  red_sofa:
    'Classic crimson-red plush 3-seater lounge sofa. Click to walk over and sit down!',
  beanbag_chair:
    'Cozy gamer beanbag chair on the floor. Click to sink in and relax!',
  bed_blue:
    'Cozy wooden single bed with a striped sky-blue blanket and pillow. Click to rest!',
  bed_green:
    'Cozy wooden single bed with a striped emerald-green blanket and pillow. Click to rest!',
  bookshelf:
    'Tall wooden bookcase packed with colorful pixel books and binders.',
  wardrobe:
    'Open wooden bedroom wardrobe closet with hanging jackets, drawers, and stickers.',
  crt_tv_console:
    'Retro CRT television on a wooden media stand with classic gaming consoles & wired controllers.',
  pizza_box:
    'Open delivery box with a hot pepperoni & cheese pixel pizza!',
  floor_lamp:
    'Tall bedroom standing lamp casting a cozy warm golden light.',
  wall_divider:
    'Full-height interior room wall partition dividing the home into separate rooms.',
  lockable_door:
    'Interior room door that can be locked or unlocked by the room owner in Floor Studio.',
};

function MiniFurniIcon({
  type,
  colorVariant,
  projects,
}: {
  type: RoomObjectType;
  colorVariant?: string;
  projects: ProjectLink[];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderFurniSlotThumbnail({
      ctx,
      width: canvas.width,
      height: canvas.height,
      type,
      colorVariant: colorVariant || OBJECT_CATALOG[type].defaultColor,
      projects,
    });
  }, [type, colorVariant, projects]);

  return (
    <canvas
      ref={canvasRef}
      width={36}
      height={36}
      className="h-8 w-8 pointer-events-none block shrink-0"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

export default function HabboRoomView() {
  const {
    objects,
    projects,
    pets,
    roomSettings,
    chatBubbles,
    chatHistory,
    avatarAction,
    heldDrink,
    remotePlayers,
    tvSync,
    isAdminAuthenticated,
    isMuted,
    isMusicPlaying,
    visitorAvatar,
    useOwnerSkin,
    addObject,
    moveObject,
    updateObjectZ,
    rotateObject,
    updateObjectTransform,
    updateObjectVideoUrl,
    broadcastLocalMove,
    randomizeVisitorAvatar,
    updateVisitorUsername,
    triggerAvatarAction,
    takeDrinkFromDispenser,
    reportLocalAvatarMotion,
    updateTvPlaybackSync,
    updateRoomSettings,
    paintManualFloorTile,
    toggleOwnerSkin,
    removeObject,
    removePet,
    clearAllPets,
    restoreDefaultPets,
    resetRoomToDefault,
    pushChatBubble,
    toggleMute,
    toggleAmbientMusic,
    ensureAmbientMusicStarted,
  } = useRoomStore();

  const activeSpeakerName = useOwnerSkin ? 'Higma' : visitorAvatar.name;
  const [chatInputText, setChatInputText] = useState<string>('');
  const [isShoutMode, setIsShoutMode] = useState<boolean>(false);
  const [isChatLogOpen, setIsChatLogOpen] = useState<boolean>(false);
  const [isRoomInfoOpen, setIsRoomInfoOpen] = useState<boolean>(false);
  const [isEditingUsername, setIsEditingUsername] = useState<boolean>(false);
  const [usernameDraft, setUsernameDraft] = useState<string>('');
  const [perfMode, setPerfMode] = useState<'auto' | 'low' | 'high'>('auto');
  const perfModeRef = useRef<'auto' | 'low' | 'high'>('auto');
  const [activeBuildFloorZ, setActiveBuildFloorZ] = useState<number>(0);
  const [isManualFloorPaintMode, setIsManualFloorPaintMode] =
    useState<boolean>(false);

  // Free Habbo Camera Pan & Zoom state (drag anywhere to pan, wheel/buttons to zoom)
  const cameraPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraZoomRef = useRef<number>(1);
  const lastSyncedMetricsRef = useRef<{
    originX: number;
    originY: number;
    scale: number;
  }>({ originX: 720, originY: 360, scale: 1 });
  const cameraDragRef = useRef<{
    isDown: boolean;
    hasMoved: boolean;
    startX: number;
    startY: number;
    initialPanX: number;
    initialPanY: number;
  }>({
    isDown: false,
    hasMoved: false,
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0,
  });

  useEffect(() => {
    perfModeRef.current = perfMode;
  }, [perfMode]);
  const [roomTvUrlDraft, setRoomTvUrlDraft] = useState<string>(
    DEFAULT_YOUTUBE_VIDEO_URL
  );
  const [roomTvUrlFeedback, setRoomTvUrlFeedback] = useState<string | null>(
    null
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Viewport projection metrics for syncing Framer Motion DigitalPet coordinates & floating popups
  const [viewportMetrics, setViewportMetrics] = useState({
    originX: 720,
    originY: 360,
    scale: 1,
  });

  // Time of Day state
  const [systemHour, setSystemHour] = useState<number>(() =>
    new Date().getHours()
  );
  const [presetIndex, setPresetIndex] = useState<number>(0);

  useEffect(() => {
    const updateClock = () => setSystemHour(new Date().getHours());
    updateClock();
    const interval = window.setInterval(updateClock, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const activePreset =
    TIME_OVERRIDE_PRESETS[presetIndex] || TIME_OVERRIDE_PRESETS[0];
  const effectiveHour =
    activePreset.hour !== null ? activePreset.hour : systemHour;
  const timeTheme: TimeOfDayTheme = computeTimeOfDayTheme(effectiveHour);

  // In-Room Interactive Furniture Placement Dock State
  const [isBuildDockOpen, setIsBuildDockOpen] = useState<boolean>(false);
  const [isPlaceOnClickActive, setIsPlaceOnClickActive] =
    useState<boolean>(false);
  const [selectedFurniType, setSelectedFurniType] =
    useState<RoomObjectType>('white_sofa');
  const [selectedFurniRotation, setSelectedFurniRotation] =
    useState<IsometricRotation>('se');
  const [selectedFurniColor, setSelectedFurniColor] =
    useState<string>('#f8fafc');
  const furniBrushRef = useRef<{
    type: RoomObjectType;
    rotation: IsometricRotation;
    color: string;
  }>({
    type: 'white_sofa',
    rotation: 'se',
    color: '#f8fafc',
  });
  const [hoveredGridTile, setHoveredGridTile] = useState<GridCoord | null>(
    null
  );

  // Classic Habbo Pop-Up Description State when clicking any furniture item
  const [inspectedObjectState, setInspectedObjectState] =
    useState<RoomObject | null>(null);
  const [interactionNoticeKey, setInteractionNoticeKey] = useState<number>(0);
  const [isTooltipHovered, setIsTooltipHovered] = useState<boolean>(false);
  const [sittingOnObjectId, setSittingOnObjectId] = useState<string | null>(
    null
  );
  const [avatarDebugState, setAvatarDebugState] = useState<{
    x: number;
    y: number;
    facing: IsometricRotation;
    walking: boolean;
  }>({ x: 4, y: 5, facing: 'sw', walking: false });

  // Optional full project modal, computer screen modal, or secret console modal
  const [activeProject, setActiveProject] = useState<{
    project: ProjectLink;
    screenObj?: RoomObject;
  } | null>(null);
  const [activePcObject, setActivePcObject] = useState<RoomObject | null>(null);
  const [isConsoleModalOpen, setIsConsoleModalOpen] = useState(false);

  // Resolve active inspected object (live from store if present, or fallback to snapshot)
  const inspectedObject: RoomObject | null = inspectedObjectState
    ? objects.find((o) => o.id === inspectedObjectState.id) ||
      inspectedObjectState
    : null;

  // Mutable simulation state stored in ref so 60Hz loop never triggers React re-renders
  const hasPickedInitialSpawnRef = useRef<boolean>(false);
  const broadcastLocalMoveRef = useRef(broadcastLocalMove);
  useEffect(() => {
    broadcastLocalMoveRef.current = broadcastLocalMove;
  }, [broadcastLocalMove]);

  const simRef = useRef({
    objects,
    projects,
    roomSettings,
    chatBubbles,
    avatarAction,
    heldDrink,
    timeTheme,
    avatarPos: { x: 4, y: 5 },
    avatarZ: 0,
    activeBuildFloorZ: 0,
    avatarFacing: 'sw' as IsometricRotation,
    isAvatarSitting: false,
    pendingSitObject: null as RoomObject | null,
    pendingStairObject: null as RoomObject | null,
    pathQueue: [] as GridCoord[],
    remoteSimMap: {} as Record<
      string,
      {
        id: string;
        name: string;
        pos: { x: number; y: number };
        z?: number;
        targetX: number;
        targetY: number;
        pathQueue: GridCoord[];
        facing: IsometricRotation;
        isSitting: boolean;
        action: 'none' | 'wave' | 'dance';
        heldDrink?: HeldDrinkType;
        visitorAvatar: VisitorAvatarProfile | null;
      }
    >,
    hoveredTile: null as GridCoord | null,
    hoveredObjectId: null as string | null,
    selectedObjectId: null as string | null,
    visitorAvatar: (useOwnerSkin ? null : visitorAvatar) as VisitorAvatarProfile | null,
    ghostObject: null as {
      type: RoomObjectType;
      label: string;
      x: number;
      y: number;
      z: number;
      rotation: IsometricRotation;
      colorVariant?: string;
      projectId?: string;
    } | null,
    tick: 0,
    originX: 720,
    originY: 360,
    canvasW: 1440,
    canvasH: 900,
    scale: 1,
  });

  // Load Open-Hotel & Habbo sprites on mount
  useEffect(() => {
    loadHabboSpriteAtlas();
  }, []);

  // Sync latest React store arrays, Time of Day theme, RoomSettings, Visitor Avatar & Ghost preview into simRef
  useEffect(() => {
    simRef.current.objects = objects;
    simRef.current.projects = projects;
    simRef.current.roomSettings = roomSettings;
    simRef.current.chatBubbles = chatBubbles;
    simRef.current.avatarAction = avatarAction;
    simRef.current.heldDrink = heldDrink;
    simRef.current.activeBuildFloorZ = activeBuildFloorZ;
    simRef.current.timeTheme = timeTheme;
    simRef.current.visitorAvatar = useOwnerSkin ? null : visitorAvatar;

    if (
      isAdminAuthenticated &&
      isBuildDockOpen &&
      isPlaceOnClickActive &&
      hoveredGridTile
    ) {
      const spec = OBJECT_CATALOG[selectedFurniType];
      const z = spec.defaultWalkable
        ? 0
        : getNextStackHeightAtTile(
            hoveredGridTile.x,
            hoveredGridTile.y,
            objects
          );
      simRef.current.ghostObject = {
        type: selectedFurniType,
        label: spec.name,
        x: hoveredGridTile.x,
        y: hoveredGridTile.y,
        z,
        rotation: selectedFurniRotation,
        colorVariant: selectedFurniColor,
      };
    } else {
      simRef.current.ghostObject = null;
    }
  }, [
    objects,
    projects,
    roomSettings,
    chatBubbles,
    avatarAction,
    heldDrink,
    timeTheme,
    visitorAvatar,
    useOwnerSkin,
    isAdminAuthenticated,
    isBuildDockOpen,
    isPlaceOnClickActive,
    hoveredGridTile,
    selectedFurniType,
    selectedFurniRotation,
    selectedFurniColor,
    activeBuildFloorZ,
  ]);

  // Auto-remove the interaction notification tooltip after NOTIFICATION_AUTO_DISMISS_MS
  useEffect(() => {
    if (!inspectedObjectState || isTooltipHovered) return;
    const timer = window.setTimeout(() => {
      setInspectedObjectState(null);
      simRef.current.selectedObjectId = null;
    }, NOTIFICATION_AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [inspectedObjectState, interactionNoticeKey, isTooltipHovered]);

  // Sync incoming remotePlayers into simRef.current.remoteSimMap with smooth pathfinding interpolation
  useEffect(() => {
    const sim = simRef.current;
    const activeGrid = sim.roomSettings?.gridSize || GRID_SIZE;

    // Pick a non-overlapping spawn tile once if another player is already standing on (4, 5)
    if (!hasPickedInitialSpawnRef.current && remotePlayers.length > 0) {
      hasPickedInitialSpawnRef.current = true;
      const someoneAtDefault = remotePlayers.some(
        (p) => Math.round(p.x) === 4 && Math.round(p.y) === 5
      );
      if (someoneAtDefault && sim.pathQueue.length === 0) {
        const spawn = pickWalkableSpawnTile(
          sim.objects,
          remotePlayers,
          activeGrid
        );
        sim.avatarPos = { x: spawn.x, y: spawn.y };
        broadcastLocalMoveRef.current({
          x: spawn.x,
          y: spawn.y,
          targetX: spawn.x,
          targetY: spawn.y,
          facing: sim.avatarFacing,
          isSitting: false,
        });
      }
    }

    const nextIds = new Set(remotePlayers.map((p) => p.id));
    Object.keys(sim.remoteSimMap).forEach((id) => {
      if (!nextIds.has(id)) {
        delete sim.remoteSimMap[id];
      }
    });

    remotePlayers.forEach((rp) => {
      const existing = sim.remoteSimMap[rp.id];
      const visProfile: VisitorAvatarProfile | null = rp.isOwner
        ? null
        : {
            ...rp.avatar,
            name: rp.name,
          };

      if (!existing) {
        const startX = Math.round(rp.x);
        const startY = Math.round(rp.y);
        const destX = Math.round(rp.targetX);
        const destY = Math.round(rp.targetY);
        const initialPath =
          startX !== destX || startY !== destY
            ? findPath(
                { x: startX, y: startY },
                { x: destX, y: destY },
                sim.objects,
                activeGrid
              )
            : [];

        sim.remoteSimMap[rp.id] = {
          id: rp.id,
          name: rp.name,
          pos: { x: rp.x, y: rp.y },
          z: rp.z || 0,
          targetX: destX,
          targetY: destY,
          pathQueue: initialPath,
          facing: rp.facing,
          isSitting: rp.isSitting && initialPath.length === 0,
          action: rp.action,
          heldDrink: rp.heldDrink,
          visitorAvatar: visProfile,
        };
      } else {
        existing.name = rp.name;
        existing.z = rp.z || 0;
        existing.action = rp.action;
        existing.heldDrink = rp.heldDrink;
        existing.visitorAvatar = visProfile;

        const destX = Math.round(rp.targetX);
        const destY = Math.round(rp.targetY);
        const curX = Math.round(existing.pos.x);
        const curY = Math.round(existing.pos.y);

        if (destX !== existing.targetX || destY !== existing.targetY) {
          existing.targetX = destX;
          existing.targetY = destY;
          existing.isSitting = false;
          const newPath = findPath(
            { x: curX, y: curY },
            { x: destX, y: destY },
            sim.objects,
            activeGrid
          );
          if (newPath.length > 0) {
            existing.pathQueue = newPath;
          } else if (Math.hypot(destX - curX, destY - curY) > 0.1) {
            existing.pathQueue = [{ x: destX, y: destY }];
          }
        } else if (existing.pathQueue.length === 0) {
          existing.facing = rp.facing;
          existing.isSitting = rp.isSitting;
        }
      }
    });
  }, [remotePlayers]);

  // Mirror playing state onto document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = 'playing';
  }, []);

  const walkAvatarTo = useCallback(
    (targetX: number, targetY: number, sitTarget?: RoomObject | null) => {
      const sim = simRef.current;
      const startX = Math.round(sim.avatarPos.x);
      const startY = Math.round(sim.avatarPos.y);

      // Stand up before walking to a new tile
      sim.isAvatarSitting = false;
      sim.pendingSitObject = sitTarget || null;
      setSittingOnObjectId(null);

      // Determine initial facing direction toward clicked target immediately
      const totalDx = targetX - sim.avatarPos.x;
      const totalDy = targetY - sim.avatarPos.y;
      if (Math.abs(totalDx) > 0.01 || Math.abs(totalDy) > 0.01) {
        if (Math.abs(totalDx) >= Math.abs(totalDy)) {
          sim.avatarFacing = totalDx >= 0 ? 'se' : 'nw';
        } else {
          sim.avatarFacing = totalDy >= 0 ? 'sw' : 'ne';
        }
      }

      // If already standing on the target sofa/stool tile, sit immediately
      if (sitTarget && startX === sitTarget.x && startY === sitTarget.y) {
        sim.avatarPos = { x: sitTarget.x, y: sitTarget.y };
        sim.avatarFacing = sitTarget.rotation;
        sim.isAvatarSitting = true;
        sim.pendingSitObject = null;
        sim.pathQueue = [];
        setSittingOnObjectId(sitTarget.id);
        setAvatarDebugState({
          x: sitTarget.x,
          y: sitTarget.y,
          facing: sitTarget.rotation,
          walking: false,
        });
        broadcastLocalMoveRef.current({
          x: sitTarget.x,
          y: sitTarget.y,
          targetX: sitTarget.x,
          targetY: sitTarget.y,
          facing: sitTarget.rotation,
          isSitting: true,
        });
        pixelAudio.playSitOnSofa();
        return;
      }

      const path = findPath(
        { x: startX, y: startY },
        { x: targetX, y: targetY },
        sim.objects,
        sim.roomSettings?.gridSize || GRID_SIZE
      );

      if (path.length > 0) {
        sim.pathQueue = path;
        const firstStep = path[0];
        const stepDx = firstStep.x - sim.avatarPos.x;
        const stepDy = firstStep.y - sim.avatarPos.y;
        if (Math.abs(stepDx) >= Math.abs(stepDy)) {
          sim.avatarFacing = stepDx >= 0 ? 'se' : 'nw';
        } else {
          sim.avatarFacing = stepDy >= 0 ? 'sw' : 'ne';
        }
        const finalStep = path[path.length - 1];
        broadcastLocalMoveRef.current({
          x: sim.avatarPos.x,
          y: sim.avatarPos.y,
          targetX: finalStep.x,
          targetY: finalStep.y,
          facing: sim.avatarFacing,
          isSitting: false,
        });
        setAvatarDebugState({
          x: startX,
          y: startY,
          facing: sim.avatarFacing,
          walking: true,
        });
      } else if (sitTarget) {
        // Snap onto the sofa cushion if surrounded by furniture
        sim.avatarPos = { x: sitTarget.x, y: sitTarget.y };
        sim.avatarFacing = sitTarget.rotation;
        sim.isAvatarSitting = true;
        sim.pendingSitObject = null;
        setSittingOnObjectId(sitTarget.id);
        setAvatarDebugState({
          x: sitTarget.x,
          y: sitTarget.y,
          facing: sitTarget.rotation,
          walking: false,
        });
        pixelAudio.playSitOnSofa();
      }
    },
    []
  );

  // Main 60Hz Canvas loop + ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const isLowEndHardware =
      typeof navigator !== 'undefined' &&
      typeof navigator.hardwareConcurrency === 'number' &&
      navigator.hardwareConcurrency <= 4;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      const mode = perfModeRef.current;
      const useEcoDpr =
        mode === 'low' || (mode === 'auto' && isLowEndHardware);
      const dpr = useEcoDpr
        ? 1
        : Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(480, Math.floor(rect.height));

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);

      const sim = simRef.current;
      sim.canvasW = w;
      sim.canvasH = h;

      const activeGrid = sim.roomSettings?.gridSize || GRID_SIZE;
      const baseRoomSpan = activeGrid * 64;
      const baseScale =
        w < baseRoomSpan + 80
          ? Math.max(0.48, (w - 24) / (baseRoomSpan + 40))
          : activeGrid > 12
            ? Math.max(0.75, 11.5 / activeGrid)
            : 1;
      const scale = Math.max(
        0.4,
        Math.min(2.2, baseScale * cameraZoomRef.current)
      );
      const originX = Math.round(w / 2 / scale + cameraPanRef.current.x);
      const roomTotalH = activeGrid * TILE_HEIGHT;
      const originY = Math.round(
        (h / scale - roomTotalH) * 0.56 + cameraPanRef.current.y
      );

      sim.scale = scale;
      sim.originX = originX;
      sim.originY = originY;

      setViewportMetrics((prev) =>
        prev.originX === originX &&
        prev.originY === originY &&
        prev.scale === scale
          ? prev
          : { originX, originY, scale }
      );
    };

    updateDimensions();
    const ro = new ResizeObserver(updateDimensions);
    ro.observe(container);

    let rafId = 0;
    let lastTime = performance.now();
    let lastDrawTime = 0;

    const renderLoop = (now: number) => {
      rafId = requestAnimationFrame(renderLoop);

      // Pause rendering when browser tab is hidden to save 100% CPU/GPU
      if (typeof document !== 'undefined' && document.hidden) {
        lastTime = now;
        return;
      }

      const sim = simRef.current;
      const mode = perfModeRef.current;
      const isEco = mode === 'low' || (mode === 'auto' && isLowEndHardware);
      // In Eco/Low-PC mode when avatar is idle, cap redraws to ~30 FPS; when walking or in High-PC mode, run at 60 FPS
      const targetFrameMs =
        isEco && sim.pathQueue.length === 0 && !sim.ghostObject ? 32 : 15;
      if (now - lastDrawTime < targetFrameMs) {
        return;
      }
      lastDrawTime = now;

      const rawDt = (now - lastTime) / 1000;
      const dt = Math.min(rawDt, 0.06);
      lastTime = now;

      sim.tick += 1;

      // Advance avatar walking interpolation along path with 4-way facing (SE, SW, NW, NE)
      if (sim.pathQueue.length > 0) {
        const nextTile = sim.pathQueue[0];
        const dx = nextTile.x - sim.avatarPos.x;
        const dy = nextTile.y - sim.avatarPos.y;
        const dist = Math.hypot(dx, dy);

        // Update 4-way isometric facing so walking up-left (NW) or up-right (NE) shows Higma's back!
        if (Math.abs(dx) > 0.02 || Math.abs(dy) > 0.02) {
          if (Math.abs(dx) >= Math.abs(dy)) {
            sim.avatarFacing = dx >= 0 ? 'se' : 'nw';
          } else {
            sim.avatarFacing = dy >= 0 ? 'sw' : 'ne';
          }
        }

        const speed = 3.8; // Smooth tiles per second so walking leg animation is clearly visible
        const step = speed * dt;
        if (dist <= step) {
          sim.avatarPos = { x: nextTile.x, y: nextTile.y };
          sim.avatarZ = getFloorElevationAtTile(
            nextTile.x,
            nextTile.y,
            sim.roomSettings,
            sim.objects
          );
          sim.pathQueue.shift();
          pixelAudio.playStep();

          // Check if avatar stepped onto a staircase (up or down) or finished path to sit
          const curTileX = Math.round(sim.avatarPos.x);
          const curTileY = Math.round(sim.avatarPos.y);
          const stairAtStep =
            (sim.pendingStairObject &&
              sim.pendingStairObject.x === curTileX &&
              sim.pendingStairObject.y === curTileY
              ? sim.pendingStairObject
              : null) ||
            sim.objects.find(
              (o) =>
                o.x === curTileX &&
                o.y === curTileY &&
                (o.type === 'stairs_up' || o.type === 'stairs_down')
            );

          if (stairAtStep && sim.pathQueue.length === 0) {
            const { landingX, landingY, targetZ } =
              resolveStaircaseTargetFloor(stairAtStep);
            sim.avatarPos = {
              x: Math.max(0, landingX),
              y: Math.max(0, landingY),
            };
            sim.avatarZ = targetZ;
            sim.avatarFacing = stairAtStep.rotation;
            sim.pendingStairObject = null;
            setActiveBuildFloorZ(targetZ);
            pixelAudio.playPlaceObject();
          }

          if (sim.pathQueue.length === 0) {
            const sitObj =
              sim.pendingSitObject ||
              findSittableObjectAtTile(
                Math.round(sim.avatarPos.x),
                Math.round(sim.avatarPos.y),
                sim.objects
              );
            if (sitObj) {
              sim.avatarPos = { x: sitObj.x, y: sitObj.y };
              sim.avatarFacing = sitObj.rotation;
              sim.isAvatarSitting = true;
              sim.pendingSitObject = null;
              setSittingOnObjectId(sitObj.id);
              pixelAudio.playSitOnSofa();
            }
            broadcastLocalMoveRef.current({
              x: Math.round(sim.avatarPos.x),
              y: Math.round(sim.avatarPos.y),
              z: sim.avatarZ,
              targetX: Math.round(sim.avatarPos.x),
              targetY: Math.round(sim.avatarPos.y),
              facing: sim.avatarFacing,
              isSitting: sim.isAvatarSitting,
            });
            setAvatarDebugState({
              x: Math.round(sim.avatarPos.x),
              y: Math.round(sim.avatarPos.y),
              facing: sim.avatarFacing,
              walking: false,
            });
          } else {
            setAvatarDebugState({
              x: Math.round(sim.avatarPos.x),
              y: Math.round(sim.avatarPos.y),
              facing: sim.avatarFacing,
              walking: true,
            });
          }
        } else {
          sim.avatarPos = {
            x: sim.avatarPos.x + (dx / dist) * step,
            y: sim.avatarPos.y + (dy / dist) * step,
          };
        }
      }

      // Advance smooth 60-FPS walking interpolation for all remote players in the room
      const remoteSpeed = 3.8;
      const remoteAvatarsList: RenderedRemoteAvatar[] = Object.values(
        sim.remoteSimMap
      ).map((ra) => {
        if (ra.pathQueue.length > 0) {
          const nextStep = ra.pathQueue[0];
          const rdx = nextStep.x - ra.pos.x;
          const rdy = nextStep.y - ra.pos.y;
          const rdist = Math.hypot(rdx, rdy);

          if (Math.abs(rdx) > 0.02 || Math.abs(rdy) > 0.02) {
            if (Math.abs(rdx) >= Math.abs(rdy)) {
              ra.facing = rdx >= 0 ? 'se' : 'nw';
            } else {
              ra.facing = rdy >= 0 ? 'sw' : 'ne';
            }
          }

          const stepDist = remoteSpeed * dt;
          if (rdist <= stepDist) {
            ra.pos = { x: nextStep.x, y: nextStep.y };
            ra.z = getFloorElevationAtTile(
              nextStep.x,
              nextStep.y,
              sim.roomSettings,
              sim.objects
            );
            ra.pathQueue.shift();
            if (ra.pathQueue.length === 0) {
              const sitAtEnd = findSittableObjectAtTile(
                Math.round(ra.pos.x),
                Math.round(ra.pos.y),
                sim.objects
              );
              if (sitAtEnd) {
                ra.facing = sitAtEnd.rotation;
                ra.isSitting = true;
              }
            }
          } else {
            ra.pos = {
              x: ra.pos.x + (rdx / rdist) * stepDist,
              y: ra.pos.y + (rdy / rdist) * stepDist,
            };
          }
        }

        return {
          id: ra.id,
          name: ra.name,
          pos: ra.pos,
          z: ra.z,
          facing: ra.facing,
          isWalking: ra.pathQueue.length > 0,
          isSitting: ra.isSitting,
          action: ra.action,
          heldDrink: ra.heldDrink,
          visitorAvatar: ra.visitorAvatar,
        };
      });

      reportLocalAvatarMotion(sim.avatarPos.x, sim.avatarPos.y);

      // Dynamically apply camera pan & zoom every frame & keep HTML overlays 100% locked in sync!
      let activeGridNow = sim.roomSettings?.gridSize || GRID_SIZE;
      for (const o of sim.objects) {
        if (o.x + 1 > activeGridNow) activeGridNow = o.x + 1;
        if (o.y + 1 > activeGridNow) activeGridNow = o.y + 1;
      }
      activeGridNow = Math.min(28, activeGridNow);

      const baseSpan = activeGridNow * 64;
      const autoScale =
        sim.canvasW < baseSpan + 80
          ? Math.max(0.48, (sim.canvasW - 24) / (baseSpan + 40))
          : activeGridNow > 12
            ? Math.max(0.75, 11.5 / activeGridNow)
            : 1;
      sim.scale = Math.max(
        0.38,
        Math.min(2.2, autoScale * cameraZoomRef.current)
      );
      sim.originX = Math.round(
        sim.canvasW / 2 / sim.scale + cameraPanRef.current.x
      );
      sim.originY = Math.round(
        (sim.canvasH / sim.scale - activeGridNow * TILE_HEIGHT) * 0.56 +
          cameraPanRef.current.y
      );

      const prevM = lastSyncedMetricsRef.current;
      if (
        prevM.originX !== sim.originX ||
        prevM.originY !== sim.originY ||
        Math.abs(prevM.scale - sim.scale) > 0.002
      ) {
        lastSyncedMetricsRef.current = {
          originX: sim.originX,
          originY: sim.originY,
          scale: sim.scale,
        };
        setViewportMetrics({
          originX: sim.originX,
          originY: sim.originY,
          scale: sim.scale,
        });
      }

      const ctx = canvas.getContext('2d', { alpha: true });
      if (ctx) {
        const dpr = canvas.width / sim.canvasW;
        ctx.save();
        ctx.scale(dpr * sim.scale, dpr * sim.scale);
        renderIsometricRoom({
          ctx,
          width: Math.ceil(sim.canvasW / sim.scale),
          height: Math.ceil(sim.canvasH / sim.scale),
          originX: sim.originX,
          originY: sim.originY,
          objects: sim.objects,
          projects: sim.projects,
          chatBubbles: [],
          avatarPos: sim.avatarPos,
          avatarZ: sim.avatarZ,
          avatarFacing: sim.avatarFacing,
          isAvatarWalking: sim.pathQueue.length > 0,
          isAvatarSitting: sim.isAvatarSitting,
          hoveredTile: sim.hoveredTile,
          hoveredObjectId: sim.hoveredObjectId,
          selectedObjectId: sim.selectedObjectId,
          tick: sim.tick,
          timeTheme: sim.timeTheme,
          showGridOverlay: Boolean(sim.ghostObject) || isManualFloorPaintMode,
          ghostObject: sim.ghostObject,
          hideStaticAnimals: true,
          visitorAvatar: sim.visitorAvatar,
          roomSettings: sim.roomSettings,
          activeBuildFloorZ: sim.activeBuildFloorZ,
          avatarAction: sim.avatarAction,
          heldDrink: sim.heldDrink,
          remoteAvatars: remoteAvatarsList,
        });
        ctx.restore();
      }
    };

    rafId = requestAnimationFrame(renderLoop);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  // Keyboard navigation (WASD / Arrow keys + M to mute + R to rotate selected + Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Escape') {
        setInspectedObjectState(null);
        setActiveProject(null);
        setIsConsoleModalOpen(false);
        setIsPlaceOnClickActive(false);
        simRef.current.selectedObjectId = null;
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        toggleMute();
        return;
      }

      const sim = simRef.current;
      const curX = Math.round(sim.avatarPos.x);
      const curY = Math.round(sim.avatarPos.y);
      let nx = curX;
      let ny = curY;
      let desiredFacing: IsometricRotation = sim.avatarFacing;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        ny -= 1;
        desiredFacing = 'ne'; // Walking up-right shows Higma's back!
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        ny += 1;
        desiredFacing = 'sw'; // Walking down-left shows Higma's front
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        nx -= 1;
        desiredFacing = 'nw'; // Walking up-left shows Higma's back!
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        nx += 1;
        desiredFacing = 'se'; // Walking down-right shows Higma's front
      } else {
        return;
      }

      e.preventDefault();
      // Always update facing immediately so pressing Up/Left shows Higma's back right away
      sim.avatarFacing = desiredFacing;

      const activeGrid = sim.roomSettings?.gridSize || GRID_SIZE;
      const sitTarget = findSittableObjectAtTile(nx, ny, sim.objects);
      if (isTileWalkable(nx, ny, sim.objects, activeGrid) || sitTarget) {
        sim.isAvatarSitting = false;
        sim.pendingSitObject = sitTarget;
        setSittingOnObjectId(null);
        sim.pathQueue = [{ x: nx, y: ny }];
        broadcastLocalMoveRef.current({
          x: curX,
          y: curY,
          targetX: nx,
          targetY: ny,
          facing: desiredFacing,
          isSitting: false,
        });
        setAvatarDebugState({
          x: nx,
          y: ny,
          facing: desiredFacing,
          walking: true,
        });
      } else {
        setAvatarDebugState({
          x: curX,
          y: curY,
          facing: desiredFacing,
          walking: false,
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMute]);

  // Convert pointer event to accurate room grid tile or hit-tested furniture object
  const resolvePointerTarget = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { tile: null, obj: null };
    const rect = canvas.getBoundingClientRect();
    const sim = simRef.current;
    const localX = (clientX - rect.left) / sim.scale;
    const localY = (clientY - rect.top) / sim.scale;

    let activeGrid = sim.roomSettings?.gridSize || GRID_SIZE;
    for (const o of sim.objects) {
      if (o.x + 1 > activeGrid) activeGrid = o.x + 1;
      if (o.y + 1 > activeGrid) activeGrid = o.y + 1;
    }

    // Check custom Top Floor (+1), Bottom Floor (-1), and Ground Floor (0) tiles under cursor
    let validGrid: GridCoord | null = null;
    for (const testZ of [1, -1, 0]) {
      const zOffsetPx = testZ * 1.35 * 18;
      const candidate = screenToGrid(
        localX,
        localY + zOffsetPx,
        sim.originX,
        sim.originY
      );
      if (testZ !== 0) {
        const hasCustomAtZ = (sim.roomSettings?.customFloorTiles || []).some(
          (t) => t.x === candidate.x && t.y === candidate.y && t.z === testZ
        );
        if (hasCustomAtZ) {
          validGrid = candidate;
          break;
        }
      } else if (
        isWithinGrid(
          candidate.x,
          candidate.y,
          activeGrid,
          sim.roomSettings?.customFloorTiles,
          sim.roomSettings?.removedBaseTiles
        )
      ) {
        validGrid = candidate;
        break;
      }
    }

    // 2. Pixel-accurate front-to-back 2D sprite bounding-box hit test for any placed furniture!
    const nonDragonObjs = sim.objects.filter((o) => o.type !== 'pet_dragon');
    const hitObj = hitTestRoomObjectAtScreen(
      localX,
      localY,
      nonDragonObjs,
      sim.originX,
      sim.originY,
      true
    );
    if (hitObj) {
      return { tile: { x: hitObj.x, y: hitObj.y }, obj: hitObj };
    }

    // 3. Fallback: if clicking a walkable floor tile (or rug), return the floor tile for walking
    if (validGrid) {
      return { tile: validGrid, obj: null };
    }

    return { tile: null, obj: null };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    cameraDragRef.current = {
      isDown: true,
      hasMoved: false,
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: cameraPanRef.current.x,
      initialPanY: cameraPanRef.current.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = cameraDragRef.current;
    const sim = simRef.current;
    if (drag.isDown) {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (Math.hypot(dx, dy) > 6) {
        drag.hasMoved = true;
        cameraPanRef.current = {
          x: drag.initialPanX + dx / sim.scale,
          y: drag.initialPanY + dy / sim.scale,
        };
        setViewportMetrics({
          originX: sim.originX,
          originY: sim.originY,
          scale: sim.scale,
        });
        return;
      }
    }

    const { tile, obj } = resolvePointerTarget(e.clientX, e.clientY);
    sim.hoveredTile = tile;
    sim.hoveredObjectId = obj ? obj.id : null;
    setHoveredGridTile((prev) => {
      if (!tile && !prev) return null;
      if (tile && prev && tile.x === prev.x && tile.y === prev.y) return prev;
      return tile;
    });
  };

  const handlePointerUp = () => {
    cameraDragRef.current.isDown = false;
  };

  const handleWheelZoom = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    cameraZoomRef.current = Math.max(
      0.5,
      Math.min(1.9, cameraZoomRef.current + delta)
    );
    const sim = simRef.current;
    setViewportMetrics({
      originX: sim.originX,
      originY: sim.originY,
      scale: sim.scale,
    });
  };

  const handlePlaceFurnitureAtTile = (targetX: number, targetY: number) => {
    if (!isAdminAuthenticated) return;
    const brush = furniBrushRef.current;
    const spec = OBJECT_CATALOG[brush.type];
    const z = spec.defaultWalkable
      ? 0
      : getNextStackHeightAtTile(targetX, targetY, objects);

    const created = addObject(
      {
        type: brush.type,
        label: spec.name,
        x: targetX,
        y: targetY,
        z,
        rotation: brush.rotation,
        colorVariant: brush.color,
        customNote: INTERACTION_FLAVOR_TEXT[brush.type],
      },
      'replace'
    );

    simRef.current.selectedObjectId = created.id;
    setInspectedObjectState(created);
    setInteractionNoticeKey((k) => k + 1);
    pushChatBubble(
      'Higma',
      `Placed ${spec.name} at (${targetX}, ${targetY})!`,
      'system'
    );
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    ensureAmbientMusicStarted();
    // If user dragged the camera, do not treat mouse-up as a tile click
    if (cameraDragRef.current.hasMoved) {
      cameraDragRef.current.hasMoved = false;
      return;
    }

    const { tile, obj } = resolvePointerTarget(e.clientX, e.clientY);
    if (!tile) return;

    if (!obj) {
      const sitAtTile = findSittableObjectAtTile(
        tile.x,
        tile.y,
        simRef.current.objects
      );
      walkAvatarTo(tile.x, tile.y, sitAtTile);
      setInspectedObjectState(null);
      simRef.current.selectedObjectId = null;
      return;
    }

    simRef.current.selectedObjectId = obj.id;
    setInspectedObjectState(obj);
    setInteractionNoticeKey((k) => k + 1);

    // 1. Sofa, Office Chair, Beanbag, Bed or Stool -> Walk to it and sit/rest on it!
    if (
      obj.type === 'white_sofa' ||
      obj.type === 'red_sofa' ||
      obj.type === 'office_chair' ||
      obj.type === 'beanbag_chair' ||
      obj.type === 'bed_blue' ||
      obj.type === 'bed_green' ||
      obj.type === 'wood_stool'
    ) {
      walkAvatarTo(obj.x, obj.y, obj);
      pushChatBubble(
        activeSpeakerName,
        obj.type === 'bed_blue' || obj.type === 'bed_green'
          ? '*relaxes on the cozy bed*'
          : '*sits down comfortably*',
        'avatar'
      );
      return;
    }

    // 1-PC. Interactive Retro PC Desk -> Walk to desk (or sit in adjacent chair) and open the CRT Computer Screen!
    if (obj.type === 'retro_pc_desk') {
      const adjacentChair = simRef.current.objects.find(
        (o) =>
          (o.type === 'office_chair' || o.type === 'wood_stool') &&
          Math.abs(o.x - obj.x) + Math.abs(o.y - obj.y) === 1
      );
      if (adjacentChair) {
        walkAvatarTo(adjacentChair.x, adjacentChair.y, adjacentChair);
      } else {
        walkAvatarTo(obj.x, obj.y, null);
      }
      setActivePcObject(obj);
      pixelAudio.playConsoleClick();
      pushChatBubble(
        activeSpeakerName,
        `*logs onto ${obj.label} 💻*`,
        'avatar'
      );
      return;
    }

    // 1-Door. Lockable Interior Door -> Check if locked or open
    if (obj.type === 'lockable_door') {
      if (obj.isDoorLocked) {
        pixelAudio.playConsoleClick();
        pushChatBubble(
          activeSpeakerName,
          '*tries the door — it is LOCKED 🔒!*',
          'avatar'
        );
      } else {
        walkAvatarTo(obj.x, obj.y, null);
      }
      return;
    }

    // 1a. Functional Staircase Up / Down -> Walk to the staircase and climb up or go down a floor!
    if (obj.type === 'stairs_up' || obj.type === 'stairs_down') {
      simRef.current.pendingStairObject = obj;
      walkAvatarTo(obj.x, obj.y, null);
      const { targetZ } = resolveStaircaseTargetFloor(obj);
      pushChatBubble(
        activeSpeakerName,
        obj.type === 'stairs_up'
          ? `*climbs up the staircase to Floor +${targetZ}!*`
          : `*walks down the staircase to Floor ${targetZ}!*`,
        'avatar'
      );
      return;
    }

    // 1b. Interactive Coffee, Cola & Juice Dispensers -> Walk over and take a cup!
    const dispenserDrink = isDrinkDispenserType(obj.type);
    if (dispenserDrink) {
      walkAvatarTo(obj.x, obj.y, null);
      takeDrinkFromDispenser(dispenserDrink);
      const drinkLabel =
        dispenserDrink === 'coffee'
          ? 'a hot cup of Espresso ☕'
          : dispenserDrink === 'cola'
            ? 'an ice-cold Habbo Cola 🥤'
            : 'a fresh Tropical Juice 🍹';
      pushChatBubble(
        activeSpeakerName,
        `*dispenses and holds ${drinkLabel}!*`,
        'avatar'
      );
      return;
    }

    if (obj.type === 'youtube_tv' && obj.videoUrl) {
      setRoomTvUrlDraft(obj.videoUrl);
      setRoomTvUrlFeedback(null);
    }

    // Walk toward other clicked objects
    walkAvatarTo(obj.x, obj.y, null);

    // 2. Digital Pet Props
    if (obj.type === 'pet_cat_basket') {
      pushChatBubble('Milo', '*purrs* My basket is so warm!', 'cat');
      return;
    }
    if (obj.type === 'water_bowl') {
      pixelAudio.playStep();
      pushChatBubble('Milo', '*laps up fresh water*', 'cat');
      return;
    }

    // 3. Corner Control Console
    if (obj.type === 'admin_console') {
      pixelAudio.playConsoleClick();
      return;
    }

    // 4. Project Screens or Other Interactive Furniture
    pixelAudio.playConsoleClick();
  };

  // Resolve related project for the currently inspected object
  const relatedProject: ProjectLink | null = inspectedObject
    ? projects.find((p) => p.id === inspectedObject.projectId) ||
      (inspectedObject.type === 'neon_bulletin' ||
      inspectedObject.type === 'floating_screen'
        ? projects[0] || null
        : null)
    : null;

  const isInspectingSofa =
    inspectedObject?.type === 'white_sofa' ||
    inspectedObject?.type === 'red_sofa' ||
    inspectedObject?.type === 'office_chair' ||
    inspectedObject?.type === 'beanbag_chair' ||
    inspectedObject?.type === 'bed_blue' ||
    inspectedObject?.type === 'bed_green' ||
    inspectedObject?.type === 'wood_stool';

  // Compute screen coordinates for the in-room floating Habbo pop-up above the clicked item
  const inspectedScreenPos = inspectedObject
    ? (() => {
        const raw = gridToScreen(
          inspectedObject.x,
          inspectedObject.y,
          inspectedObject.z,
          viewportMetrics.originX,
          viewportMetrics.originY
        );
        return {
          x: Math.round(raw.sx * viewportMetrics.scale),
          y: Math.round((raw.sy - 34) * viewportMetrics.scale),
        };
      })()
    : null;

  const renderTimePhaseIcon = () => {
    switch (timeTheme.phase) {
      case 'dawn':
        return <Sunrise className="h-3 w-3 text-amber-300" />;
      case 'day':
        return <Sun className="h-3 w-3 text-yellow-300" />;
      case 'sunset':
        return <Sunset className="h-3 w-3 text-orange-300" />;
      case 'night':
      default:
        return <Moon className="h-3 w-3 text-indigo-300" />;
    }
  };

  return (
    <main
      data-testid="habbo-room-main"
      data-time-phase={timeTheme.phase}
      data-shadow-alpha={timeTheme.shadowAlpha}
      data-avatar-pos={`${avatarDebugState.x},${avatarDebugState.y}`}
      data-avatar-facing={avatarDebugState.facing}
      data-avatar-walking={String(avatarDebugState.walking)}
      data-visitor-avatar={useOwnerSkin ? 'Higma' : visitorAvatar.name}
      style={{ background: timeTheme.backgroundGradient }}
      className="relative h-screen w-screen overflow-hidden select-none transition-[background] duration-700"
    >
      {/* Full-Viewport Authentic Habbo Hotel Isometric Canvas */}
      <div ref={containerRef} className="absolute inset-0 h-full w-full">
        <canvas
          ref={canvasRef}
          data-testid="isometric-room-canvas"
          aria-label="Isometric 2D Habbo Hotel pixel art portfolio room"
          style={{ imageRendering: 'pixelated' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheelZoom}
          onClick={handleCanvasClick}
          onDoubleClick={(e) => {
            const { obj } = resolvePointerTarget(e.clientX, e.clientY);
            if (obj?.type === 'admin_console' && isAdminAuthenticated) {
              pixelAudio.playConsoleClick();
              setIsConsoleModalOpen(true);
            }
          }}
          className="block h-full w-full touch-none cursor-grab active:cursor-grabbing"
        />

        {/* Live 3D Isometric Skewed YouTube TV Screen Overlay (Synchronized across all visitors!) */}
        <IsometricYoutubeTvOverlay
          objects={objects}
          originX={viewportMetrics.originX}
          originY={viewportMetrics.originY}
          scale={viewportMetrics.scale}
          tvSync={tvSync}
          onSyncTvPlayback={updateTvPlaybackSync}
          onSelectTv={(tv) => {
            simRef.current.selectedObjectId = tv.id;
            setInspectedObjectState(tv);
            setInteractionNoticeKey((k) => k + 1);
            if (tv.videoUrl) {
              setRoomTvUrlDraft(tv.videoUrl);
            }
            setRoomTvUrlFeedback(null);
          }}
        />

        {/* High-Visibility 3D Isometric Wall Posters Overlay */}
        <IsometricWallPostersOverlay
          objects={objects}
          originX={viewportMetrics.originX}
          originY={viewportMetrics.originY}
          scale={viewportMetrics.scale}
          selectedObjectId={inspectedObject?.id}
          onSelectPoster={(poster) => {
            ensureAmbientMusicStarted();
            simRef.current.selectedObjectId = poster.id;
            setInspectedObjectState(poster);
            setInteractionNoticeKey((k) => k + 1);
            pixelAudio.playConsoleClick();
          }}
        />

        {/* All Active Animals Walking Randomly Across the Isometric Floor */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {pets.map((petSpec) => (
            <DigitalPet
              key={petSpec.id}
              id={petSpec.id}
              name={petSpec.name}
              species={petSpec.species}
              randomWalk={true}
              colorVariant={petSpec.colorVariant}
              initialCoord={petSpec.initialCoord}
              objects={objects}
              originX={viewportMetrics.originX}
              originY={viewportMetrics.originY}
              scale={viewportMetrics.scale}
              stepIntervalMs={petSpec.stepIntervalMs}
              projectId={petSpec.projectId}
              description={petSpec.description}
              onInteract={(pet) => {
                ensureAmbientMusicStarted();
                walkAvatarTo(pet.coord.x, pet.coord.y, null);
                pushChatBubble(
                  pet.name,
                  pet.emoteText,
                  pet.species === 'cat'
                    ? 'cat'
                    : pet.species === 'dragon'
                      ? 'dragon'
                      : 'system'
                );
                setInteractionNoticeKey((k) => k + 1);
                setInspectedObjectState({
                  id: `patrol-${pet.id}`,
                  type:
                    pet.species === 'cat' ? 'pet_cat_basket' : 'pet_dragon',
                  label: `${pet.name} (${
                    pet.species === 'cat'
                      ? 'Habbo Cat'
                      : pet.species === 'dragon'
                        ? 'Habbo Dragon'
                        : 'Open-Hotel CameraBot'
                  })`,
                  x: pet.coord.x,
                  y: pet.coord.y,
                  z: 0,
                  rotation: 'sw',
                  walkable: true,
                  projectId: pet.projectId,
                  customNote: pet.description,
                  createdAt: new Date().toISOString(),
                });
              }}
            />
          ))}
        </div>

        {/* FOREGROUND SLOW-RISING HABBO CHAT BUBBLES OVERLAY (z-40: In front of TV, Posters & Pets!) */}
        <div
          data-testid="habbo-foreground-chat-layer"
          className="pointer-events-none absolute inset-0 overflow-hidden z-40"
        >
          <AnimatePresence>
            {chatBubbles.slice(-6).map((bubble, idx, arr) => {
              const newerCount = arr.length - 1 - idx;
              let tile = bubble.speakerTile || simRef.current.avatarPos;
              if (bubble.speakerType === 'cat') {
                tile = { x: 3, y: 6 };
              } else if (
                bubble.speaker.toLowerCase() !== activeSpeakerName.toLowerCase()
              ) {
                const rp = remotePlayers.find(
                  (p) => p.name.toLowerCase() === bubble.speaker.toLowerCase()
                );
                if (rp) {
                  tile = { x: rp.x, y: rp.y };
                }
              }
              const rawScreen = gridToScreen(
                tile.x,
                tile.y,
                0.2,
                viewportMetrics.originX,
                viewportMetrics.originY
              );
              const startX = Math.max(
                110,
                Math.min(
                  (simRef.current.canvasW || 1200) - 110,
                  Math.round(rawScreen.sx * viewportMetrics.scale)
                )
              );
              // Start right at the top of the character's head and rise slowly upward!
              const headTopY = Math.round(
                (rawScreen.sy - 78) * viewportMetrics.scale
              );
              const stackedY = Math.max(
                28,
                headTopY - newerCount * 26
              );

              return (
                <motion.div
                  key={bubble.id}
                  data-testid={`foreground-chat-bubble-${bubble.id}`}
                  initial={{ opacity: 0, y: headTopY + 6, scale: 0.95 }}
                  animate={{
                    opacity: 1,
                    y: Math.max(20, stackedY - 46),
                    scale: 1,
                  }}
                  exit={{ opacity: 0, y: Math.max(12, stackedY - 62) }}
                  transition={{
                    y: { duration: 3.9, ease: 'linear' },
                    opacity: { duration: 0.2 },
                  }}
                  style={{ left: `${startX}px`, top: 0 }}
                  className="pointer-events-none absolute -translate-x-1/2 flex items-center gap-1.5 rounded-[4px] border-2 border-black bg-white px-2.5 py-1 text-[10px] text-black shadow-[0_3px_0_#000,inset_0_-2px_0_#E4E4E4] whitespace-nowrap"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full border border-black shrink-0"
                    style={{
                      backgroundColor:
                        bubble.speakerType === 'cat'
                          ? '#D97706'
                          : bubble.speakerType === 'dragon'
                            ? '#7C3AED'
                            : '#16A34A',
                    }}
                  />
                  <span
                    className="font-bold text-[#000000]"
                    style={{
                      fontFamily: '"Volter", var(--font-pixel), monospace',
                    }}
                  >
                    {bubble.speaker}:
                  </span>
                  <span
                    className={
                      bubble.isShout
                        ? 'font-bold uppercase text-[#C93B2B]'
                        : 'font-medium text-[#111827]'
                    }
                    style={{
                      fontFamily: '"Volter", var(--font-pixel), monospace',
                    }}
                  >
                    {bubble.text}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Classic In-Room Floating Habbo Pop-Up Callout right above the clicked furniture item */}
        <AnimatePresence>
          {inspectedObject && inspectedScreenPos && (
            <motion.div
              key={`floating-popup-${inspectedObject.id}-${interactionNoticeKey}`}
              data-testid="habbo-floating-item-popup"
              initial={{ opacity: 0, y: 8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.92 }}
              transition={{ duration: 0.16 }}
              style={{
                left: Math.max(
                  110,
                  Math.min(
                    (simRef.current.canvasW || 1200) - 110,
                    inspectedScreenPos.x
                  )
                ),
                top: Math.max(54, inspectedScreenPos.y - 36),
              }}
              className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full w-56 rounded-[4px] border-2 border-black bg-[#FFFBEB] px-2.5 py-1.5 text-black shadow-[3px_3px_0px_#000]"
            >
              <div className="flex items-center justify-between gap-1 border-b border-black/20 pb-0.5">
                <span
                  className="truncate text-[10px] font-bold text-[#1E3A8A]"
                  style={{ fontFamily: '"Volter", var(--font-pixel), monospace' }}
                >
                  {inspectedObject.label}
                </span>
                <span className="shrink-0 rounded border border-black/40 bg-amber-200 px-1 text-[8px] font-bold uppercase">
                  {inspectedObject.rotation.toUpperCase()}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-slate-800">
                {inspectedObject.customNote ||
                  INTERACTION_FLAVOR_TEXT[inspectedObject.type] ||
                  OBJECT_CATALOG[inspectedObject.type]?.description}
              </p>
              {/* Classic Habbo Speech Pointer Triangle */}
              <div className=" -bottom-1.5 left-1/2 -translate-x-1/2 absolute h-2.5 w-2.5 rotate-45 border-r-2 border-b-2 border-black bg-[#FFFBEB]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Top-Left Classic Habbo Window: Visitor Identity & BC Furni Dock */}
      <div className="fixed top-2.5 left-2.5 z-30 flex flex-col items-start gap-2">
        <div
          data-testid="visitor-avatar-hud"
          className="flex flex-wrap items-center gap-1.5 rounded-[4px] border-2 border-black bg-[#E2E2DE] px-2 py-1 text-[10px] font-bold text-[#1E1E1E] shadow-[0_2px_0_#000,inset_0_1px_0_#FFF]"
          style={{ fontFamily: '"Volter", var(--font-pixel), monospace' }}
        >
          <span className="flex items-center gap-1 rounded-[2px] border border-[#8E8E8A] bg-white px-1.5 py-0.5">
            <User className="h-3 w-3 text-[#D4912A]" />
            <span data-testid="visitor-avatar-name" className="text-black">
              {useOwnerSkin ? 'Higma' : visitorAvatar.name}
            </span>
          </span>

          {/* Inline Username Editor Trigger */}
          {!isEditingUsername ? (
            <button
              type="button"
              data-testid="edit-username-button"
              onClick={() => {
                setUsernameDraft(useOwnerSkin ? 'Higma' : visitorAvatar.name);
                setIsEditingUsername(true);
              }}
              title="Change your Habbo username"
              className="rounded-[2px] border border-black bg-[#3B6E8C] px-1.5 py-0.5 text-[9px] font-bold text-white hover:bg-[#4A85A8] shadow-[inset_0_1px_0_#6BA7C9]"
            >
              Edit Name
            </button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (usernameDraft.trim()) {
                  updateVisitorUsername(usernameDraft);
                  pushChatBubble(
                    usernameDraft.trim(),
                    '*updated username!*',
                    'avatar'
                  );
                }
                setIsEditingUsername(false);
              }}
              className="flex items-center gap-1"
            >
              <input
                type="text"
                data-testid="username-input"
                value={usernameDraft}
                onChange={(e) => setUsernameDraft(e.target.value)}
                placeholder="Enter name..."
                maxLength={20}
                autoFocus
                className="w-24 rounded-[2px] border border-black bg-white px-1.5 py-0.5 text-[10px] text-black focus:outline-none"
              />
              <button
                type="submit"
                data-testid="save-username-button"
                className="rounded-[2px] border border-black bg-[#15803D] px-1.5 py-0.5 text-[9px] font-bold text-white hover:bg-[#16A34A]"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => setIsEditingUsername(false)}
                className="rounded-[2px] border border-black bg-[#C93B2B] px-1 py-0.5 text-[9px] font-bold text-white"
              >
                ×
              </button>
            </form>
          )}

          <button
            type="button"
            data-testid="randomize-avatar-button"
            onClick={() => {
              const fresh = randomizeVisitorAvatar();
              pushChatBubble(
                fresh.name,
                `*changed outfit (${fresh.accessory})!*`,
                'avatar'
              );
            }}
            title="Randomize your Habbo outfit colors"
            className="inline-flex items-center gap-1 rounded-[2px] border border-black bg-[#D4912A] px-1.5 py-0.5 text-[9px] font-bold text-white hover:bg-[#E5A23B] shadow-[inset_0_1px_0_#F2C166]"
          >
            <Shuffle className="h-2.5 w-2.5" />
            <span>New Look</span>
          </button>

          {isAdminAuthenticated && (
            <button
              type="button"
              data-testid="toggle-owner-skin-button"
              onClick={toggleOwnerSkin}
              className="rounded-[2px] border border-black bg-[#2B2827] px-1.5 py-0.5 text-[9px] font-bold text-[#FACC15] hover:bg-black"
            >
              {useOwnerSkin ? 'Visitor' : 'Higma'}
            </button>
          )}
        </div>

        {isAdminAuthenticated && (
          <div className="flex items-center gap-1.5">
            <Link
              href="/admin"
              className="flex h-6 items-center gap-1 rounded-[3px] border-2 border-black bg-[#15803D] px-2.5 text-[10px] font-bold text-white hover:bg-[#16A34A] shadow-[inset_0_1px_0_#4ADE80]"
              style={{ fontFamily: '"Volter", var(--font-pixel), monospace' }}
            >
              <span>Floor Studio (/admin)</span>
            </Link>
          </div>
        )}
        {false && (
          <AnimatePresence>
            {isBuildDockOpen && (
              <motion.div
                data-testid="room-furniture-dock"
                initial={{ opacity: 0, y: -10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.16 }}
                className="w-[330px] sm:w-[366px] rounded-[5px] border-2 border-black bg-[#E2E2DE] text-[#1E1E1E] shadow-[4px_4px_0px_#000] overflow-hidden"
              >
                {/* Gold Habbo Header */}
                <div className="flex items-center justify-between bg-[#D4912A] border-b-2 border-[#8C5A0E] px-2.5 py-1 text-white">
                  <span
                    className="text-[11px] font-bold drop-shadow-[0_1px_0_rgba(0,0,0,0.6)]"
                    style={{
                      fontFamily: '"Volter", var(--font-pixel), monospace',
                    }}
                  >
                    Admin Furni · Place &amp; Manage Room
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBuildDockOpen(false);
                      setIsPlaceOnClickActive(false);
                    }}
                    aria-label="Close furniture dock"
                    className="flex h-4 w-4 items-center justify-center rounded-[2px] border border-black bg-[#C93B2B] text-white hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>

                <div className="p-2 space-y-2">
                  {/* Mode & 360° Rotation Bar */}
                  <div className="flex items-center justify-between gap-1.5 rounded border border-[#8E8E8A] bg-[#D6D6D2] px-2 py-1">
                    <button
                      type="button"
                      data-testid="room-place-mode-toggle"
                      onClick={() => setIsPlaceOnClickActive((prev) => !prev)}
                      className={`inline-flex items-center gap-1 rounded-[3px] border border-black px-2 py-0.5 text-[10px] font-bold ${
                        isPlaceOnClickActive
                          ? 'bg-[#00748C] text-white'
                          : 'bg-white text-black hover:bg-amber-100'
                      }`}
                    >
                      <MousePointerClick className="h-3 w-3" />
                      <span>
                        {isPlaceOnClickActive
                          ? 'Click a Tile: ON'
                          : 'Enable Grid Placement'}
                      </span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        data-testid="room-dock-rotate-360"
                        onClick={() =>
                          setSelectedFurniRotation((prev) => {
                            const next = getNextRotation(prev, 1);
                            furniBrushRef.current.rotation = next;
                            return next;
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-[3px] border border-black bg-[#D49A2A] px-2 py-0.5 text-[10px] font-bold text-white hover:bg-[#E5AA3A]"
                        title="Rotate furniture 360° (SE, SW, NW, NE)"
                      >
                        <RotateCw className="h-3 w-3" />
                        <span>{selectedFurniRotation.toUpperCase()}</span>
                      </button>
                    </div>
                  </div>

                  {/* Furniture Icon Grid */}
                  <div className="grid grid-cols-5 gap-1 rounded border border-[#8E8E8A] bg-[#CCCCCC] p-1.5 max-h-[140px] overflow-y-auto">
                    {QUICK_PLACEABLE_TYPES.map((type) => {
                      const spec = OBJECT_CATALOG[type];
                      const isSelected = selectedFurniType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          data-testid={`room-furni-option-${type}`}
                          onClick={() => {
                            furniBrushRef.current = {
                              type,
                              rotation: furniBrushRef.current.rotation,
                              color: spec.defaultColor,
                            };
                            setSelectedFurniType(type);
                            setSelectedFurniColor(spec.defaultColor);
                            setIsPlaceOnClickActive(true);
                          }}
                          title={spec.name}
                          className={`flex flex-col items-center justify-center rounded-[3px] p-1 transition-all ${
                            isSelected
                              ? 'border-2 border-[#E59400] bg-white shadow'
                              : 'border border-[#8E8E8A] bg-[#E2E2DE] hover:bg-white'
                          }`}
                        >
                          <MiniFurniIcon
                            type={type}
                            colorVariant={
                              isSelected
                                ? selectedFurniColor
                                : spec.defaultColor
                            }
                            projects={projects}
                          />
                          <span className="mt-0.5 w-full truncate text-center text-[8px] font-bold text-[#222222]">
                            {spec.name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Item Description & Quick Place Button */}
                  <div className="flex items-center justify-between gap-2 rounded border border-[#8E8E8A] bg-[#EEEEEE] px-2 py-1.5 text-[10px]">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-black truncate">
                        {OBJECT_CATALOG[selectedFurniType].name} (
                        {selectedFurniRotation.toUpperCase()})
                      </div>
                      <div className="truncate text-[9px] text-[#555555]">
                        {isPlaceOnClickActive
                          ? 'Click any floor tile to place this item!'
                          : OBJECT_CATALOG[selectedFurniType].description}
                      </div>
                    </div>
                    <button
                      type="button"
                      data-testid="room-quick-place-btn"
                      onClick={() => {
                        const target = hoveredGridTile || { x: 4, y: 4 };
                        handlePlaceFurnitureAtTile(target.x, target.y);
                      }}
                      className="shrink-0 rounded-[3px] border border-black bg-[#15803D] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#16A34A]"
                    >
                      Place Here
                    </button>
                  </div>

                  {/* In-Room Manual Floor Builder (Minecraft-Style Border Expansion + Granite & Multi-Story Levels) */}
                  <div className="rounded border border-[#8E8E8A] bg-[#D6D6D2] px-2 py-1.5 space-y-1.5 text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1E1E1E]">
                        Build Floor &amp; Stairs Level:
                      </span>
                      <button
                        type="button"
                        data-testid="room-manual-floor-toggle"
                        onClick={() => {
                          setIsManualFloorPaintMode((prev) => {
                            const next = !prev;
                            if (next) setIsPlaceOnClickActive(false);
                            return next;
                          });
                        }}
                        className={`rounded-[2px] border border-black px-2 py-0.5 text-[9px] font-bold ${
                          isManualFloorPaintMode
                            ? 'bg-[#15803D] text-white'
                            : 'bg-white text-black hover:bg-amber-100'
                        }`}
                      >
                        {isManualFloorPaintMode
                          ? 'Paint Floor: ON (Click Border)'
                          : '+ Build Floor Tiles'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-bold text-[#444444]">
                        Story:
                      </span>
                      <div className="flex items-center gap-1">
                        {[
                          { z: -1, label: 'Down (-1)' },
                          { z: 0, label: 'Ground (0)' },
                          { z: 1, label: 'Up (+1)' },
                          { z: 2, label: 'Top (+2)' },
                        ].map((lv) => (
                          <button
                            key={lv.z}
                            type="button"
                            onClick={() => setActiveBuildFloorZ(lv.z)}
                            className={`rounded border px-1.5 py-0.5 text-[8px] font-bold ${
                              activeBuildFloorZ === lv.z
                                ? 'border-black bg-[#D4912A] text-white'
                                : 'border-[#7A7A76] bg-white text-black'
                            }`}
                          >
                            {lv.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      {(
                        [
                          { id: 'granite_tile', label: 'Granite', col: '#64748B' },
                          { id: 'carrara_marble', label: 'Marble', col: '#E2E8F0' },
                          { id: 'oak_planks', label: 'Oak', col: '#DFC184' },
                          { id: 'marble_checkers', label: 'Checkers', col: '#D6BC8B' },
                          { id: 'zellige_mosaic', label: 'Zellige', col: '#0D9488' },
                          { id: 'diamond_steel', label: 'Steel', col: '#475569' },
                        ] as Array<{
                          id: FloorPatternType;
                          label: string;
                          col: string;
                        }>
                      ).map((fp) => (
                        <button
                          key={fp.id}
                          type="button"
                          onClick={() =>
                            updateRoomSettings({
                              floorPattern: fp.id,
                              floorColor: fp.col,
                            })
                          }
                          className={`rounded border px-1.5 py-0.5 text-[8px] font-bold ${
                            roomSettings.floorPattern === fp.id
                              ? 'border-black bg-[#00748C] text-white'
                              : 'border-[#7A7A76] bg-white text-black hover:bg-amber-50'
                          }`}
                        >
                          {fp.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Admin Active Animals Manager inside Dock */}
                  <div className="rounded border border-[#8E8E8A] bg-[#D6D6D2] px-2 py-1.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#222222]">
                        Active Animals ({pets.length})
                      </span>
                      <div className="flex items-center gap-1">
                        {pets.length > 0 && (
                          <button
                            type="button"
                            onClick={() => clearAllPets()}
                            className="rounded-[2px] border border-black bg-[#C93B2B] px-1.5 py-0.5 text-[9px] font-bold text-white hover:bg-red-600"
                          >
                            Remove All
                          </button>
                        )}
                        {pets.length < 4 && (
                          <button
                            type="button"
                            onClick={() => restoreDefaultPets()}
                            className="rounded-[2px] border border-black bg-[#00748C] px-1.5 py-0.5 text-[9px] font-bold text-white hover:bg-[#0089A6]"
                          >
                            Restore Pets
                          </button>
                        )}
                      </div>
                    </div>
                    {pets.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {pets.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => removePet(p.id)}
                            title={`Remove ${p.name}`}
                            className="inline-flex items-center gap-1 rounded-[2px] border border-black bg-white px-1.5 py-0.5 text-[9px] font-bold text-black hover:bg-red-100"
                          >
                            <span>{p.name}</span>
                            <Trash2 className="h-2.5 w-2.5 text-[#C93B2B]" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[9px] text-[#555555]">
                        All animals removed from room.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Classic Habbo Furniture Pop-Up Inspector Window (Bottom-Right) */}
      <AnimatePresence mode="wait">
        {inspectedObject && (
          <motion.aside
            key={`${inspectedObject.id}-${interactionNoticeKey}`}
            data-testid="habbo-object-tooltip"
            aria-label={`Selected object: ${inspectedObject.label}`}
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            onMouseEnter={() => setIsTooltipHovered(true)}
            onMouseLeave={() => setIsTooltipHovered(false)}
            className="fixed right-3 bottom-14 z-30 w-72 sm:w-80 overflow-hidden rounded-[5px] border-2 border-black bg-[#E2E2DE] text-black shadow-[0_6px_20px_rgba(0,0,0,0.85),inset_0_1px_0_#FFF]"
          >
            {/* Classic Habbo Window Title Bar */}
            <div className="flex items-center justify-between border-b-2 border-black bg-[#3B6E8C] px-2.5 py-1 text-white">
              <span
                className="truncate text-[10px] font-bold tracking-wide"
                style={{ fontFamily: '"Volter", var(--font-pixel), monospace' }}
              >
                {inspectedObject.label}
              </span>
              <button
                type="button"
                onClick={() => {
                  setInspectedObjectState(null);
                  simRef.current.selectedObjectId = null;
                }}
                aria-label="Close object info"
                className="flex h-4 w-4 items-center justify-center border border-black bg-[#D9534F] text-white hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            <div className="p-2.5 space-y-2 text-xs">
              {/* Thumbnail + Category + Pop-up Description Header */}
              <div className="flex items-start gap-2.5 border border-black/30 bg-[#F5F5EE] p-2">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-black bg-[#D9D9CE]">
                  <MiniFurniIcon
                    type={inspectedObject.type}
                    colorVariant={inspectedObject.colorVariant}
                    projects={projects}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold uppercase text-[#3B6E8C]">
                      {OBJECT_CATALOG[inspectedObject.type]?.category || 'Furni'}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-600">
                      ({inspectedObject.x},{inspectedObject.y}) ·{' '}
                      {inspectedObject.rotation.toUpperCase()}
                    </span>
                  </div>
                  <p
                    data-testid="habbo-object-description"
                    className="mt-0.5 text-[11px] leading-snug text-slate-800"
                  >
                    {inspectedObject.customNote ||
                      INTERACTION_FLAVOR_TEXT[inspectedObject.type] ||
                      OBJECT_CATALOG[inspectedObject.type]?.description ||
                      'Interactive Habbo furniture item inside the isometric portfolio suite.'}
                  </p>
                </div>
              </div>

              {/* Public Room Visitor Interaction Controls (Editing is strictly inside /admin Floor Studio) */}
              {!inspectedObject.id.startsWith('patrol-') ? (
                <div className="flex items-center justify-between gap-1.5 border border-black bg-[#D9D9CE] px-2 py-1.5">
                  {isInspectingSofa ? (
                    <button
                      type="button"
                      data-testid="tooltip-use-item"
                      onClick={() => {
                        const sim = simRef.current;
                        sim.avatarPos = {
                          x: inspectedObject.x,
                          y: inspectedObject.y,
                        };
                        sim.avatarFacing = inspectedObject.rotation;
                        sim.isAvatarSitting = true;
                        sim.pathQueue = [];
                        setSittingOnObjectId(inspectedObject.id);
                        pixelAudio.playSitOnSofa();
                      }}
                      className="inline-flex items-center gap-1 border border-black bg-amber-300 px-2 py-0.5 text-[10px] font-bold text-black hover:bg-amber-200"
                    >
                      <Armchair className="h-3 w-3" />
                      <span>
                        {sittingOnObjectId === inspectedObject.id
                          ? 'Seated'
                          : 'Sit Here'}
                      </span>
                    </button>
                  ) : inspectedObject.type === 'stairs_up' ||
                    inspectedObject.type === 'stairs_down' ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        data-testid="tooltip-use-item"
                        onClick={() => {
                          simRef.current.pendingStairObject = inspectedObject;
                          walkAvatarTo(
                            inspectedObject.x,
                            inspectedObject.y,
                            null
                          );
                        }}
                        className="inline-flex items-center gap-1 border border-black bg-[#D4912A] px-2 py-0.5 text-[10px] font-bold text-white hover:bg-[#E5A23B]"
                      >
                        <span>
                          {inspectedObject.type === 'stairs_up'
                            ? 'Climb Up ▲'
                            : 'Go Down ▼'}
                        </span>
                      </button>
                      </div>
                  ) : inspectedObject.type === 'retro_pc_desk' ? (
                    <button
                      type="button"
                      data-testid="tooltip-open-pc-screen"
                      onClick={() => {
                        setActivePcObject(inspectedObject);
                        pixelAudio.playConsoleClick();
                      }}
                      className="inline-flex items-center gap-1 border border-black bg-[#00748C] px-2.5 py-0.5 text-[10px] font-bold text-white hover:bg-[#0089A6]"
                    >
                      <span>Open PC Screen 💻</span>
                    </button>
                  ) : isDrinkDispenserType(inspectedObject.type) ? (
                    <button
                      type="button"
                      data-testid="tooltip-use-item"
                      onClick={() => {
                        const drink = isDrinkDispenserType(
                          inspectedObject.type
                        )!;
                        walkAvatarTo(
                          inspectedObject.x,
                          inspectedObject.y,
                          null
                        );
                        takeDrinkFromDispenser(drink);
                        pushChatBubble(
                          activeSpeakerName,
                          `*takes a cup of ${drink.toUpperCase()}!*`,
                          'avatar'
                        );
                      }}
                      className="inline-flex items-center gap-1 border border-black bg-[#15803D] px-2 py-0.5 text-[10px] font-bold text-white hover:bg-[#16A34A]"
                    >
                      <span>Take Cup ☕</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-testid="tooltip-use-item"
                      onClick={() => {
                        walkAvatarTo(inspectedObject.x, inspectedObject.y, null);
                        pushChatBubble(
                          activeSpeakerName,
                          `*inspects ${inspectedObject.label}*`,
                          'avatar'
                        );
                      }}
                      className="inline-flex items-center gap-1 border border-black bg-white px-2 py-0.5 text-[10px] font-bold text-black hover:bg-amber-100"
                    >
                      <span>Interact</span>
                    </button>
                  )}

                  </div>
              ) : (
                /* Roaming Animal Inspector Controls */
                <div className="flex items-center justify-between gap-1.5 border border-black bg-[#D9D9CE] px-2 py-1.5">
                  <button
                    type="button"
                    data-testid="tooltip-use-item"
                    onClick={() => {
                      walkAvatarTo(inspectedObject.x, inspectedObject.y, null);
                      pushChatBubble(
                        activeSpeakerName,
                        `*pets ${inspectedObject.label}*`,
                        'avatar'
                      );
                    }}
                    className="inline-flex items-center gap-1 border border-black bg-white px-2 py-0.5 text-[10px] font-bold text-black hover:bg-amber-100"
                  >
                    <span>Pet Animal</span>
                  </button>
                </div>
              )}

              {isAdminAuthenticated &&
                inspectedObject &&
              Boolean(false) &&
                !inspectedObject.id.startsWith('patrol-') && (
                  <div
                    data-testid="tooltip-admin-transform-sliders"
                    className="border border-black bg-[#D9D9CE] px-2 py-1.5 space-y-1.5 text-[10px]"
                  >
                    <div className="flex items-center justify-between gap-1 border-b border-black/20 pb-1">
                      <span className="font-bold text-slate-900">
                        Move / Elevate:
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            moveObject(
                              inspectedObject.id,
                              Math.max(0, inspectedObject.x - 1),
                              inspectedObject.y,
                              'stack'
                            )
                          }
                          className="rounded border border-black bg-white px-1.5 py-0.5 font-bold hover:bg-amber-100"
                          title="Move X-1"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            moveObject(
                              inspectedObject.id,
                              inspectedObject.x,
                              Math.max(0, inspectedObject.y - 1),
                              'stack'
                            )
                          }
                          className="rounded border border-black bg-white px-1.5 py-0.5 font-bold hover:bg-amber-100"
                          title="Move Y-1"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            moveObject(
                              inspectedObject.id,
                              inspectedObject.x,
                              Math.min(
                                (roomSettings.gridSize || 10) - 1,
                                inspectedObject.y + 1
                              ),
                              'stack'
                            )
                          }
                          className="rounded border border-black bg-white px-1.5 py-0.5 font-bold hover:bg-amber-100"
                          title="Move Y+1"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            moveObject(
                              inspectedObject.id,
                              Math.min(
                                (roomSettings.gridSize || 10) - 1,
                                inspectedObject.x + 1
                              ),
                              inspectedObject.y,
                              'stack'
                            )
                          }
                          className="rounded border border-black bg-white px-1.5 py-0.5 font-bold hover:bg-amber-100"
                          title="Move X+1"
                        >
                          →
                        </button>
                        <button
                          type="button"
                          onClick={() => updateObjectZ(inspectedObject.id, -1)}
                          className="rounded border border-black bg-[#4A4745] px-1.5 py-0.5 font-bold text-white"
                        >
                          Z-
                        </button>
                        <button
                          type="button"
                          onClick={() => updateObjectZ(inspectedObject.id, 1)}
                          className="rounded border border-black bg-[#4A4745] px-1.5 py-0.5 font-bold text-white"
                        >
                          Z+
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-11 font-bold text-slate-900">
                        Scale:
                      </span>
                      <input
                        type="range"
                        min={MIN_OBJECT_SCALE}
                        max={MAX_OBJECT_SCALE}
                        step={0.05}
                        value={clampObjectScale(inspectedObject.scale)}
                        onChange={(e) =>
                          updateObjectTransform(inspectedObject.id, {
                            scale: Number(e.target.value),
                          })
                        }
                        className="h-1.5 flex-1 accent-[#D97706] cursor-pointer"
                      />
                      <span className="w-9 text-right font-mono font-bold text-slate-900">
                        {clampObjectScale(inspectedObject.scale).toFixed(2)}x
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-11 font-bold text-slate-900">
                        Rotate:
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={359}
                        step={1}
                        value={normalizeRotationAngle(
                          inspectedObject.rotationAngle,
                          inspectedObject.rotation
                        )}
                        onChange={(e) => {
                          const deg = normalizeRotationAngle(
                            Number(e.target.value)
                          );
                          updateObjectTransform(inspectedObject.id, {
                            rotation: angleToIsometricRotation(deg),
                            rotationAngle: deg,
                          });
                        }}
                        className="h-1.5 flex-1 accent-[#00748C] cursor-pointer"
                      />
                      <span className="w-9 text-right font-mono font-bold text-slate-900">
                        {normalizeRotationAngle(
                          inspectedObject.rotationAngle,
                          inspectedObject.rotation
                        )}
                        °
                      </span>
                    </div>
                  </div>
                )}

              {/* 3D YouTube TV Inspector & Admin URL Programmer */}
              {inspectedObject.type === 'youtube_tv' && (
                <div
                  data-testid="room-tv-inspector-panel"
                  className="border border-black bg-[#F5F5EE] p-2 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="inline-flex items-center gap-1 font-bold text-[#C93B2B]">
                      <Tv className="h-3 w-3" />
                      <span>
                        3D YouTube Broadcast (
                        {
                          normalizeYouTubeEmbedUrl(inspectedObject.videoUrl)
                            .videoId
                        }
                        )
                      </span>
                    </span>
                    <a
                      href={
                        normalizeYouTubeEmbedUrl(inspectedObject.videoUrl)
                          .watchUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 font-bold text-[#1E3A8A] hover:underline"
                    >
                      <span>YouTube</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>

                  {/* Quick Playback & Volume Optimization Controls */}
                  <div
                    data-testid="room-tv-playback-controls"
                    className="flex flex-wrap items-center justify-between gap-1.5 border border-black bg-[#18181B] px-2 py-1.5 text-white"
                  >
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        data-testid="inspector-tv-seek-backward"
                        onClick={() =>
                          dispatchTvControlEvent({
                            tvId: inspectedObject.id,
                            action: 'seek',
                            deltaSeconds: -10,
                          })
                        }
                        className="inline-flex items-center gap-0.5 rounded-[2px] border border-slate-600 bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                      >
                        <RotateCcw className="h-2.5 w-2.5" />
                        <span>-10s</span>
                      </button>
                      <button
                        type="button"
                        data-testid="inspector-tv-play-pause"
                        onClick={() =>
                          dispatchTvControlEvent({
                            tvId: inspectedObject.id,
                            action: 'togglePlay',
                          })
                        }
                        className="inline-flex items-center gap-0.5 rounded-[2px] border border-slate-600 bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                      >
                        <span>Play/Pause</span>
                      </button>
                      <button
                        type="button"
                        data-testid="inspector-tv-seek-forward"
                        onClick={() =>
                          dispatchTvControlEvent({
                            tvId: inspectedObject.id,
                            action: 'seek',
                            deltaSeconds: 10,
                          })
                        }
                        className="inline-flex items-center gap-0.5 rounded-[2px] border border-slate-600 bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                      >
                        <span>+10s</span>
                        <RotateCw className="h-2.5 w-2.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        data-testid="inspector-tv-mute-toggle"
                        onClick={() =>
                          dispatchTvControlEvent({
                            tvId: inspectedObject.id,
                            action: 'toggleMute',
                          })
                        }
                        className="inline-flex items-center gap-0.5 rounded-[2px] border border-slate-600 bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 hover:bg-slate-700 cursor-pointer"
                      >
                        <Volume2 className="h-2.5 w-2.5" />
                        <span>Audio</span>
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        defaultValue={80}
                        data-testid="inspector-tv-volume-slider"
                        aria-label="Optimize TV Volume"
                        onChange={(e) =>
                          dispatchTvControlEvent({
                            tvId: inspectedObject.id,
                            action: 'volume',
                            volume: Number(e.target.value),
                          })
                        }
                        className="h-1.5 w-16 accent-amber-400 cursor-pointer"
                      />
                    </div>
                  </div>

                  {false ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const vidId = extractYouTubeVideoId(roomTvUrlDraft);
                        if (!vidId) {
                          setRoomTvUrlFeedback(
                            'Please enter a valid YouTube link or 11-char ID.'
                          );
                          return;
                        }
                        const canonical = `https://www.youtube.com/watch?v=${vidId}`;
                        updateObjectVideoUrl(inspectedObject!.id, canonical);
                        setRoomTvUrlDraft(canonical);
                        setRoomTvUrlFeedback(
                          `Broadcasting (${vidId}) to all visitors!`
                        );
                        pushChatBubble(
                          activeSpeakerName,
                          `Changed 3D TV channel to YouTube (${vidId})!`,
                          'system'
                        );
                      }}
                      className="space-y-1"
                    >
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          data-testid="room-tv-url-input"
                          value={roomTvUrlDraft}
                          onChange={(e) => {
                            setRoomTvUrlDraft(e.target.value);
                            setRoomTvUrlFeedback(null);
                          }}
                          placeholder="Paste YouTube URL..."
                          className="flex-1 min-w-0 border border-black bg-white px-1.5 py-1 text-[10px] text-black focus:outline-none"
                        />
                        <button
                          type="submit"
                          data-testid="room-tv-url-submit"
                          className="shrink-0 border border-black bg-[#C93B2B] px-2 py-1 text-[10px] font-bold text-white hover:bg-red-700"
                        >
                          Program TV
                        </button>
                      </div>
                      {roomTvUrlFeedback && (
                        <div
                          data-testid="room-tv-url-feedback"
                          className="text-[9px] font-bold text-emerald-800"
                        >
                          {roomTvUrlFeedback}
                        </div>
                      )}
                    </form>
                  ) : (
                    <div className="text-[10px] text-slate-700">
                      Synced live with the room owner&apos;s broadcast.
                    </div>
                  )}
                </div>
              )}

              {/* Secret Console Controls (Admin-only quick spawn; discreet Owner Key link to /admin) */}
              {inspectedObject.type === 'admin_console' && (
                <div className="flex items-center justify-between gap-1.5 border border-black bg-[#D9D9CE] p-1.5">
                  {isAdminAuthenticated ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          addObject({
                            type: 'glass_bottle',
                            label: 'Console Glass Bottle',
                            x: 4,
                            y: 5,
                            colorVariant: '#34d399',
                          });
                        }}
                        className="inline-flex items-center gap-1 border border-black bg-emerald-300 px-1.5 py-0.5 text-[10px] font-bold text-black hover:bg-emerald-200"
                      >
                        <Plus className="h-2.5 w-2.5" />
                        <span>Bottle</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          addObject({
                            type: 'building_block',
                            label: 'Console Building Block',
                            x: 5,
                            y: 4,
                            colorVariant: '#f59e0b',
                          });
                        }}
                        className="inline-flex items-center gap-1 border border-black bg-amber-300 px-1.5 py-0.5 text-[10px] font-bold text-black hover:bg-amber-200"
                      >
                        <Plus className="h-2.5 w-2.5" />
                        <span>Block</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-700">
                      Owner Terminal (Admin Only)
                    </span>
                  )}

                  {/* Discreet Secret Owner Key to /admin */}
                  <div className="flex items-center gap-1">
                    {isAdminAuthenticated && (
                      <button
                        type="button"
                        onClick={() => setIsConsoleModalOpen(true)}
                        className="border border-black bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold hover:bg-white"
                      >
                        Deck
                      </button>
                    )}
                    <Link
                      href="/admin"
                      title="Secret Room Owner Console"
                      aria-label="Secret Room Owner Console"
                      className="flex h-5 w-5 items-center justify-center border border-black bg-slate-800 text-amber-300 hover:bg-black"
                    >
                      <KeyRound className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Related Project Link Action */}
              {relatedProject && (
                <div className="border border-black bg-white p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Related Project
                      </div>
                      <div className="truncate text-xs font-bold text-slate-950">
                        {relatedProject.title}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          pixelAudio.playLinkOpen();
                          setActiveProject({
                            project: relatedProject,
                            screenObj: inspectedObject,
                          });
                        }}
                        className="inline-flex items-center gap-1 border border-black bg-[#FACC15] px-2 py-1 text-[10px] font-bold text-black hover:bg-amber-300"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Details</span>
                      </button>
                      <a
                        href={relatedProject.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => pixelAudio.playLinkOpen()}
                        className="inline-flex items-center gap-1 border border-black bg-[#3B6E8C] px-2 py-1 text-[10px] font-bold text-white hover:bg-[#2c546b]"
                      >
                        <span>Visit</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Auto-dismiss countdown progress bar */}
            {!isTooltipHovered && (
              <div className="h-1 w-full bg-[#D9D9CE] border-t border-black/30 overflow-hidden">
                <motion.div
                  key={`timer-${inspectedObject.id}-${interactionNoticeKey}`}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{
                    duration: NOTIFICATION_AUTO_DISMISS_MS / 1000,
                    ease: 'linear',
                  }}
                  className="h-full bg-[#3B6E8C]"
                />
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Classic Habbo Room Info Window (Bottom-Left above Toolbar when toggled) */}
      <AnimatePresence>
        {isRoomInfoOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed left-3 bottom-14 z-30 w-64 rounded-[5px] border-2 border-black bg-[#E2E2DE] text-[#1E1E1E] shadow-[0_6px_20px_rgba(0,0,0,0.85)] overflow-hidden"
          >
            <div className="flex items-center justify-between border-b-2 border-[#24475B] bg-[#3B6E8C] px-2.5 py-1 text-white shadow-[inset_0_1px_0_#6BA7C9]">
              <span
                className="text-[10px] font-bold"
                style={{ fontFamily: '"Volter", var(--font-pixel), monospace' }}
              >
                Room Info · Navigator
              </span>
              <button
                type="button"
                onClick={() => setIsRoomInfoOpen(false)}
                className="flex h-4 w-4 items-center justify-center rounded-[2px] border border-black bg-[#C93B2B] text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="p-2.5 space-y-1.5 text-[11px]">
              <div className="font-bold text-black">
                {roomSettings.roomTitle}
              </div>
              <div className="text-[10px] text-[#444444]">
                {roomSettings.roomDescription}
              </div>
              <div className="rounded border border-[#8E8E8A] bg-[#D6D6D2] px-2 py-1 text-[10px] space-y-0.5">
                <div>
                  <span className="font-bold">Owner:</span> Higma
                </div>
                <div>
                  <span className="font-bold text-[#D97706]">Music:</span>{' '}
                  Original Instrumental Created by Higma 🎸
                </div>
                <div>
                  <span className="font-bold">Floor Space:</span>{' '}
                  {roomSettings.gridSize}×{roomSettings.gridSize} +{' '}
                  {(roomSettings.customFloorTiles || []).length} custom tiles
                </div>
                <div>
                  <span className="font-bold">Furni Count:</span>{' '}
                  {objects.length} items
                </div>
                <div>
                  <span className="font-bold text-[#15803D]">
                    Players Online:
                  </span>{' '}
                  <span className="font-bold">{1 + remotePlayers.length}</span>
                </div>
              </div>

              {/* Live List of Players Currently Inside the Room */}
              <div className="rounded border border-[#8E8E8A] bg-white p-1.5 space-y-1 max-h-28 overflow-y-auto">
                <div className="text-[9px] font-bold uppercase text-[#3B6E8C]">
                  Who&apos;s in this Room ({1 + remotePlayers.length})
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-black">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 border border-black" />
                    <span>{activeSpeakerName} (You)</span>
                  </span>
                </div>
                {remotePlayers.map((rp) => (
                  <div
                    key={rp.id}
                    className="flex items-center justify-between text-[10px] text-[#222222]"
                  >
                    <span className="flex items-center gap-1 truncate">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 border border-black shrink-0" />
                      <span className="font-bold truncate">{rp.name}</span>
                      <span className="text-[9px] text-[#666666]">
                        ({Math.round(rp.x)},{Math.round(rp.y)})
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        triggerAvatarAction('wave');
                        pushChatBubble(
                          activeSpeakerName,
                          `o/ Hey ${rp.name}!`,
                          'avatar'
                        );
                      }}
                      className="rounded border border-black bg-[#FACC15] px-1 py-0.5 text-[8px] font-bold text-black hover:bg-amber-300 shrink-0"
                    >
                      Wave o/
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-1">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1 rounded-[3px] border border-black bg-[#D4912A] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#E5A23B] shadow-[inset_0_1px_0_#F2C166]"
                >
                  <KeyRound className="h-3 w-3" />
                  <span>Open /admin Studio</span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Multi-Visitor Chat History Log Window (Above Chat Bar when toggled) */}
      <AnimatePresence>
        {isChatLogOpen && (
          <motion.div
            data-testid="habbo-chat-history-modal"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed left-1/2 -translate-x-1/2 bottom-14 z-30 w-[92vw] max-w-[460px] rounded-[5px] border-2 border-black bg-[#E2E2DE] text-[#1E1E1E] shadow-[0_8px_24px_rgba(0,0,0,0.9)] overflow-hidden"
          >
            <div className="flex items-center justify-between border-b-2 border-[#8C5A0E] bg-[#D4912A] px-3 py-1 text-white shadow-[inset_0_1px_0_#F2C166]">
              <span
                className="text-[10px] font-bold"
                style={{ fontFamily: '"Volter", var(--font-pixel), monospace' }}
              >
                Room Chat History ({chatHistory.length})
              </span>
              <button
                type="button"
                onClick={() => setIsChatLogOpen(false)}
                className="flex h-4 w-4 items-center justify-center rounded-[2px] border border-black bg-[#C93B2B] text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="max-h-44 overflow-y-auto bg-white p-2 space-y-1 text-[11px] border-b border-[#8E8E8A]">
              {chatHistory.length > 0 ? (
                chatHistory.map((msg) => (
                  <div key={msg.id} className="leading-snug">
                    <span className="font-bold text-[#1E3A8A]">
                      {msg.speaker}:{' '}
                    </span>
                    <span className={msg.isShout ? 'font-bold text-black' : 'text-[#222222]'}>
                      {msg.text}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-[10px] text-[#777777] py-4">
                  No chat messages yet. Say hello in the chat bar below!
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ICONIC HABBO.COM BOTTOM TOOLBAR & LIVE CHAT BAR (Inside the Bottom Center Area) */}
      <footer
        data-testid="habbo-bottom-toolbar"
        className="fixed inset-x-0 bottom-0 z-30 flex h-[46px] items-center justify-between gap-2 border-t-2 border-[#4A4745] bg-[#2B2827] px-2 sm:px-4 shadow-[0_-2px_0_#000000]"
        style={{ fontFamily: '"Volter", var(--font-pixel), monospace' }}
      >
        {/* Left Habbo Dock Icons: Room Info, Wave (o/), Dance */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            data-testid="habbo-room-info-toggle"
            onClick={() => setIsRoomInfoOpen((prev) => !prev)}
            title="Room Info & Online Players in Room"
            className={`flex h-[32px] items-center gap-1.5 rounded-[3px] border-2 border-black px-2 text-[10px] font-bold transition-colors ${
              isRoomInfoOpen
                ? 'bg-[#3B6E8C] text-white shadow-[inset_0_1px_0_#6BA7C9]'
                : 'bg-[#4A4745] text-[#E2E2DE] hover:bg-[#5C5856] shadow-[inset_0_1px_0_#7A7674]'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 border border-black" />
            <span>Room ({1 + remotePlayers.length})</span>
          </button>

          <button
            type="button"
            data-testid="habbo-wave-button"
            onClick={() => {
              triggerAvatarAction('wave');
              pushChatBubble(activeSpeakerName, 'o/ *waves*', 'avatar');
            }}
            title="Wave to everyone in the room (o/)"
            className={`flex h-[32px] items-center gap-1 rounded-[3px] border-2 border-black px-2 text-[10px] font-bold transition-colors ${
              avatarAction === 'wave'
                ? 'bg-[#D4912A] text-white shadow-[inset_0_1px_0_#F2C166]'
                : 'bg-[#4A4745] text-[#FACC15] hover:bg-[#5C5856] shadow-[inset_0_1px_0_#7A7674]'
            }`}
          >
            <span>Wave o/</span>
          </button>

          <button
            type="button"
            data-testid="habbo-dance-button"
            onClick={() => {
              triggerAvatarAction('dance');
              if (avatarAction !== 'dance') {
                pushChatBubble(
                  activeSpeakerName,
                  '*starts dancing on the floor!*',
                  'avatar'
                );
              }
            }}
            title="Toggle Habbo Club Dance"
            className={`hidden sm:flex h-[32px] items-center gap-1 rounded-[3px] border-2 border-black px-2 text-[10px] font-bold transition-colors ${
              avatarAction === 'dance'
                ? 'bg-[#15803D] text-white shadow-[inset_0_1px_0_#4ADE80]'
                : 'bg-[#4A4745] text-[#E2E2DE] hover:bg-[#5C5856] shadow-[inset_0_1px_0_#7A7674]'
            }`}
          >
            <span>{avatarAction === 'dance' ? 'Stop Dance' : 'Dance'}</span>
          </button>
        </div>

        {/* Center Recessed Habbo.com Chat Input Capsule */}
        <form
          data-testid="habbo-chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            const text = chatInputText.trim();
            if (!text) return;
            ensureAmbientMusicStarted();
            if (text.toLowerCase() === 'o/' || text.toLowerCase() === '/wave') {
              triggerAvatarAction('wave');
            } else if (text.toLowerCase() === '/dance') {
              triggerAvatarAction('dance');
            }
            pushChatBubble(
              activeSpeakerName,
              isShoutMode ? text.toUpperCase() : text,
              'avatar',
              isShoutMode
            );
            setChatInputText('');
          }}
          className="flex flex-1 max-w-[540px] h-[32px] items-center rounded-[4px] border-2 border-black bg-white pl-1.5 pr-1 shadow-[inset_0_2px_0_#D6D6D2]"
        >
          {/* Speaker Badge Inside Chat Bar */}
          <button
            type="button"
            onClick={() => {
              setUsernameDraft(activeSpeakerName);
              setIsEditingUsername(true);
            }}
            title="Click to edit your username"
            className="flex items-center gap-1 rounded-[2px] border border-[#8E8E8A] bg-[#E2E2DE] px-1.5 py-0.5 text-[9px] font-bold text-[#1E1E1E] hover:bg-[#D4912A] hover:text-white shrink-0 mr-1.5"
          >
            <span
              className="inline-block h-2 w-2 rounded-full border border-black"
              style={{
                backgroundColor: useOwnerSkin
                  ? '#65772C'
                  : visitorAvatar.shirtColor,
              }}
            />
            <span className="max-w-[85px] truncate">{activeSpeakerName}</span>
          </button>

          <input
            type="text"
            data-testid="habbo-chat-input"
            value={chatInputText}
            onChange={(e) => setChatInputText(e.target.value)}
            placeholder="Click here to chat with everyone in the room..."
            maxLength={120}
            className="flex-1 min-w-0 bg-transparent text-[11px] font-bold text-black placeholder:text-[#7A7A76] focus:outline-none"
          />

          {/* Say vs Shout Mode Button */}
          <button
            type="button"
            data-testid="habbo-chat-shout-toggle"
            onClick={() => setIsShoutMode((prev) => !prev)}
            title="Switch between Say and Shout (Bold)"
            className={`mr-1 rounded-[2px] border border-black px-1.5 py-0.5 text-[9px] font-bold shrink-0 ${
              isShoutMode
                ? 'bg-[#C93B2B] text-white'
                : 'bg-[#D6D6D2] text-[#222222] hover:bg-[#CCCCCC]'
            }`}
          >
            {isShoutMode ? 'Shout!' : 'Say'}
          </button>

          <button
            type="submit"
            data-testid="habbo-chat-submit"
            className="rounded-[2px] border border-black bg-[#D4912A] px-2.5 py-0.5 text-[10px] font-bold text-white hover:bg-[#E5A23B] shadow-[inset_0_1px_0_#F2C166] shrink-0"
          >
            Send
          </button>
        </form>

        {/* Right Habbo Utility Dock: Performance Mode, Chat Log, Time/Lighting, BGM, Sound */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            data-testid="habbo-perf-mode-toggle"
            onClick={() => {
              setPerfMode((prev) =>
                prev === 'auto' ? 'low' : prev === 'low' ? 'high' : 'auto'
              );
              pixelAudio.playConsoleClick();
            }}
            title="Switch Performance Mode: AUTO / ECO (Low PC) / HIGH (60 FPS)"
            className={`hidden md:flex h-[32px] items-center gap-1 rounded-[3px] border-2 border-black px-2 text-[10px] font-bold ${
              perfMode === 'low'
                ? 'bg-[#15803D] text-white'
                : perfMode === 'high'
                  ? 'bg-[#3B6E8C] text-white'
                  : 'bg-[#4A4745] text-[#E2E2DE] hover:bg-[#5C5856]'
            }`}
          >
            <span>
              {perfMode === 'low'
                ? 'PC: ECO'
                : perfMode === 'high'
                  ? 'PC: HIGH'
                  : 'PC: AUTO'}
            </span>
          </button>

          <button
            type="button"
            data-testid="habbo-chat-log-toggle"
            onClick={() => setIsChatLogOpen((prev) => !prev)}
            title="Open Room Chat History"
            className={`flex h-[32px] items-center gap-1 rounded-[3px] border-2 border-black px-2 text-[10px] font-bold ${
              isChatLogOpen
                ? 'bg-[#D4912A] text-white'
                : 'bg-[#4A4745] text-[#E2E2DE] hover:bg-[#5C5856]'
            }`}
          >
            <span>Log ({chatHistory.length})</span>
          </button>

          <button
            type="button"
            data-testid="time-of-day-button"
            onClick={(e) => {
              pixelAudio.playConsoleClick();
              setPresetIndex(
                (prev) => (prev + 1) % TIME_OVERRIDE_PRESETS.length
              );
              e.currentTarget.blur();
            }}
            aria-label={`Time of Day: ${timeTheme.label}. Click to cycle lighting phase.`}
            title={`Room Lighting (${timeTheme.label})`}
            className="flex h-[32px] items-center gap-1 rounded-[3px] border-2 border-black bg-[#4A4745] px-2 text-[10px] font-bold text-[#E2E2DE] hover:bg-[#5C5856] shadow-[inset_0_1px_0_#7A7674]"
          >
            {renderTimePhaseIcon()}
            <span className="hidden md:inline">
              {activePreset.hour === null
                ? timeTheme.phase.toUpperCase()
                : activePreset.label}
            </span>
          </button>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => {
                cameraZoomRef.current = Math.max(
                  0.5,
                  cameraZoomRef.current - 0.15
                );
                pixelAudio.playConsoleClick();
              }}
              title="Zoom Out (-)"
              className="flex h-[32px] w-[24px] items-center justify-center rounded-l-[3px] border-2 border-black bg-[#4A4745] text-[12px] font-bold text-[#E2E2DE] hover:bg-[#5C5856]"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => {
                cameraPanRef.current = { x: 0, y: 0 };
                cameraZoomRef.current = 1;
                pixelAudio.playConsoleClick();
              }}
              title="Recenter Camera (Drag anywhere on room to move camera)"
              className="flex h-[32px] items-center border-y-2 border-black bg-[#4A4745] px-1.5 text-[9px] font-bold text-[#E2E2DE] hover:bg-[#5C5856]"
            >
              Cam
            </button>
            <button
              type="button"
              onClick={() => {
                cameraZoomRef.current = Math.min(
                  1.9,
                  cameraZoomRef.current + 0.15
                );
                pixelAudio.playConsoleClick();
              }}
              title="Zoom In (+)"
              className="flex h-[32px] w-[24px] items-center justify-center rounded-r-[3px] border-2 border-black bg-[#4A4745] text-[12px] font-bold text-[#E2E2DE] hover:bg-[#5C5856]"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              toggleMute();
              e.currentTarget.blur();
            }}
            aria-label={isMuted ? 'Unmute volume' : 'Mute volume'}
            title={
              isMuted
                ? 'Volume Muted (M) · Original Music by Higma'
                : 'Volume Active (M) · Original Music by Higma'
            }
            className="flex h-[32px] w-[32px] items-center justify-center rounded-[3px] border-2 border-black bg-[#4A4745] text-[#E2E2DE] hover:bg-[#5C5856]"
          >
            {isMuted ? (
              <VolumeX className="h-3.5 w-3.5 text-rose-400" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
            )}
          </button>
        </div>
      </footer>

      {/* Interactive CRT Computer Screen Modal (Opens when clicking any Retro PC Desk!) */}
      <ComputerScreenModal
        pcObject={activePcObject}
        onClose={() => setActivePcObject(null)}
      />

      {/* Optional Project Details Modal */}
      <ProjectModal
        project={activeProject?.project || null}
        screenObject={activeProject?.screenObj || null}
        onClose={() => setActiveProject(null)}
        onWalkToScreen={(x, y) => walkAvatarTo(x, y)}
      />

      {/* Secret Corner Admin Control Console Modal */}
      <AdminConsoleModal
        isOpen={isConsoleModalOpen}
        objects={objects}
        onClose={() => setIsConsoleModalOpen(false)}
        onQuickSpawnBottle={(x, y) => {
          addObject({
            type: 'glass_bottle',
            label: 'Console Glass Bottle',
            x,
            y,
            colorVariant: '#34d399',
          });
          pushChatBubble(
            'Higma',
            `Spawned Glass Bottle at (${x}, ${y})!`,
            'system'
          );
        }}
        onQuickSpawnBlock={(x, y) => {
          addObject({
            type: 'building_block',
            label: 'Console Building Block',
            x,
            y,
            colorVariant: '#f59e0b',
          });
          pushChatBubble(
            'Higma',
            `Stacked Building Block at (${x}, ${y})!`,
            'system'
          );
        }}
        onResetRoom={() => {
          resetRoomToDefault();
          pushChatBubble(
            'Higma',
            'Room layout restored to default clutter!',
            'system'
          );
        }}
      />
    </main>
  );
}
