export type RoomObjectType =
  | 'admin_console'
  | 'white_sofa'
  | 'luxury_rug_pink'
  | 'luxury_rug_blue'
  | 'luxury_rug_gold'
  | 'royal_crown_purple'
  | 'royal_crown_gold'
  | 'pet_cat_basket'
  | 'pet_dragon'
  | 'water_bowl'
  | 'neon_bulletin'
  | 'floating_screen'
  | 'glass_bottle'
  | 'building_block'
  | 'wood_table'
  | 'wood_stool'
  | 'potted_plant'
  | 'youtube_tv';

export type ObjectCategory =
  | 'console'
  | 'project_display'
  | 'bottles_blocks'
  | 'furniture'
  | 'pets_crowns';

export interface ProjectLink {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  category: string;
  techStack: string[];
  accentColor: string;
  featuredMetric: string;
  description: string;
}

export type IsometricRotation = 'se' | 'sw' | 'nw' | 'ne';

export const ROTATION_ORDER: IsometricRotation[] = ['se', 'sw', 'nw', 'ne'];

export function getNextRotation(
  current: IsometricRotation,
  step: 1 | -1 = 1
): IsometricRotation {
  const idx = ROTATION_ORDER.indexOf(current);
  const safeIdx = idx === -1 ? 0 : idx;
  return ROTATION_ORDER[(safeIdx + step + ROTATION_ORDER.length) % ROTATION_ORDER.length];
}

export interface RoomObject {
  id: string;
  type: RoomObjectType;
  label: string;
  x: number; // 0 to GRID_SIZE - 1
  y: number; // 0 to GRID_SIZE - 1
  z: number; // elevation level (0 = floor, 1 = stacked tier 1, 2 = stacked tier 2, etc.)
  rotation: IsometricRotation; // 360-degree isometric orientation ('se' | 'sw' | 'nw' | 'ne')
  colorVariant?: string;
  walkable: boolean;
  sittable?: boolean; // true for sofas & stools so avatar can sit on them!
  projectId?: string; // Linked ProjectLink ID
  videoUrl?: string; // Programmed YouTube URL or video ID for youtube_tv
  customNote?: string;
  createdAt: string;
}

export interface ChatBubble {
  id: string;
  speaker: string;
  speakerType: 'cat' | 'dragon' | 'avatar' | 'system';
  text: string;
  offsetY: number; // rising float offset in pixels
  createdAt: number;
}

export interface GridCoord {
  x: number;
  y: number;
}

export interface ScreenCoord {
  sx: number;
  sy: number;
}

export const GRID_SIZE = 10;
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const Z_HEIGHT_PX = 18;
export const DEMO_ADMIN_PASSCODE = 'HABBO-ADMIN-2026';

export const OBJECT_CATALOG: Record<
  RoomObjectType,
  {
    type: RoomObjectType;
    name: string;
    category: ObjectCategory;
    defaultWalkable: boolean;
    defaultSittable?: boolean;
    stackHeight: number;
    description: string;
    defaultColor: string;
  }
> = {
  glass_bottle: {
    type: 'glass_bottle',
    name: 'Habbo Pixel Elixir Bottle',
    category: 'bottles_blocks',
    defaultWalkable: false,
    stackHeight: 1,
    description: 'Authentic pixel-art soda & potion bottle from the room inventory.',
    defaultColor: '#34d399',
  },
  building_block: {
    type: 'building_block',
    name: 'Battle Banzai Pixel Block',
    category: 'bottles_blocks',
    defaultWalkable: false,
    stackHeight: 1,
    description: 'Stackable modular Habbo pixel block for room elevation & optimization.',
    defaultColor: '#f59e0b',
  },
  white_sofa: {
    type: 'white_sofa',
    name: 'Modern White Club Sofa',
    category: 'furniture',
    defaultWalkable: false,
    defaultSittable: true,
    stackHeight: 1,
    description: 'Classic Habbo white leather sofa with dithered charcoal cushion. Click to sit down!',
    defaultColor: '#f8fafc',
  },
  luxury_rug_pink: {
    type: 'luxury_rug_pink',
    name: 'Luxury Rose Dithered Rug',
    category: 'furniture',
    defaultWalkable: true,
    stackHeight: 0,
    description: 'Plush rose-pink woven Habbo floor rug with pixel fringe border.',
    defaultColor: '#f472b6',
  },
  luxury_rug_blue: {
    type: 'luxury_rug_blue',
    name: 'Luxury Sky Dithered Rug',
    category: 'furniture',
    defaultWalkable: true,
    stackHeight: 0,
    description: 'Plush sky-blue woven Habbo floor rug with pixel fringe border.',
    defaultColor: '#38bdf8',
  },
  luxury_rug_gold: {
    type: 'luxury_rug_gold',
    name: 'Imperial Gold Woven Rug',
    category: 'furniture',
    defaultWalkable: true,
    stackHeight: 0,
    description: 'Regal golden floor runner with pixel-stitched border.',
    defaultColor: '#fbbf24',
  },
  royal_crown_purple: {
    type: 'royal_crown_purple',
    name: 'Royal Amethyst Crown Bust',
    category: 'pets_crowns',
    defaultWalkable: false,
    stackHeight: 2,
    description: 'White marble pedestal bust topped with a jeweled purple velvet sovereign crown.',
    defaultColor: '#a855f7',
  },
  royal_crown_gold: {
    type: 'royal_crown_gold',
    name: 'Stacked Golden Sovereign Crown',
    category: 'pets_crowns',
    defaultWalkable: false,
    stackHeight: 2,
    description: 'Double-stacked golden filigree crowns resting on a porcelain bust column.',
    defaultColor: '#facc15',
  },
  pet_cat_basket: {
    type: 'pet_cat_basket',
    name: 'Sleeping Pixel Cat Basket',
    category: 'pets_crowns',
    defaultWalkable: false,
    stackHeight: 1,
    description: 'Resting grey tabby digital pet curled inside a woven wicker basket (*wants fresh salmon*).',
    defaultColor: '#94a3b8',
  },
  pet_dragon: {
    type: 'pet_dragon',
    name: 'Draco the Digital Dragon',
    category: 'pets_crowns',
    defaultWalkable: false,
    stackHeight: 1,
    description: 'Resting purple-winged Habbo dragon companion guarding the central rug.',
    defaultColor: '#818cf8',
  },
  water_bowl: {
    type: 'water_bowl',
    name: 'Ceramic Pet Water Bowl',
    category: 'pets_crowns',
    defaultWalkable: false,
    stackHeight: 1,
    description: 'Glossy blue pixel pet dish filled with fresh water & salmon treats.',
    defaultColor: '#0ea5e9',
  },
  neon_bulletin: {
    type: 'neon_bulletin',
    name: 'Habbo Wall Bulletin Screen',
    category: 'project_display',
    defaultWalkable: false,
    stackHeight: 2,
    description: 'Wall-mounted pixel bulletin board displaying a live portfolio project link.',
    defaultColor: '#22d3ee',
  },
  floating_screen: {
    type: 'floating_screen',
    name: 'Habbo Holo Project Monitor',
    category: 'project_display',
    defaultWalkable: false,
    stackHeight: 2,
    description: 'Isometric pixel CRT/LCD monitor angled toward the viewer as a project portal.',
    defaultColor: '#f472b6',
  },
  wood_table: {
    type: 'wood_table',
    name: 'Mahogany Lounge Table',
    category: 'furniture',
    defaultWalkable: false,
    stackHeight: 1,
    description: 'Beveled brown Habbo café table with tubular chrome legs.',
    defaultColor: '#9a5b3e',
  },
  wood_stool: {
    type: 'wood_stool',
    name: 'Bistro Folding Stool',
    category: 'furniture',
    defaultWalkable: false,
    defaultSittable: true,
    stackHeight: 1,
    description: 'Compact wooden Habbo seat with crossed steel legs. Click to sit!',
    defaultColor: '#b06d4b',
  },
  potted_plant: {
    type: 'potted_plant',
    name: 'Twisted Bamboo Planter',
    category: 'furniture',
    defaultWalkable: false,
    stackHeight: 1,
    description: 'Authentic Open-Hotel spiral green bamboo plant in a square terracotta pot.',
    defaultColor: '#22c55e',
  },
  admin_console: {
    type: 'admin_console',
    name: 'Corner Control Console',
    category: 'console',
    defaultWalkable: false,
    stackHeight: 2,
    description: 'Tactile hardware unit with glowing buttons, levers, and inventory monitor.',
    defaultColor: '#10b981',
  },
  youtube_tv: {
    type: 'youtube_tv',
    name: '3D YouTube Wall TV',
    category: 'project_display',
    defaultWalkable: false,
    stackHeight: 2,
    description:
      'Window-sized 3D isometric television that streams any programmed YouTube video for everyone in the room.',
    defaultColor: '#ef4444',
  },
};

export const DEFAULT_YOUTUBE_VIDEO_ID = 'M7lc1UVf-VE';
export const DEFAULT_YOUTUBE_VIDEO_URL =
  'https://www.youtube.com/watch?v=M7lc1UVf-VE';

/**
 * Extracts a canonical 11-character YouTube video ID from any standard YouTube link
 * (watch?v=, youtu.be/, embed/, shorts/, live/) or raw 11-character ID.
 */
export function extractYouTubeVideoId(
  rawInput: string | null | undefined
): string | null {
  if (!rawInput || typeof rawInput !== 'string') return null;
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  // Direct 11-character YouTube ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Standard regex patterns covering watch?v=, youtu.be/, embed/, shorts/, live/, v/
  const patterns = [
    /(?:youtube\.com\/watch\?(?:[^#&]*&)*v=)([a-zA-Z0-9_-]{11})/i,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
    /(?:youtube\.com\/(?:embed|shorts|live|v)\/)([a-zA-Z0-9_-]{11})/i,
  ];
  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Normalizes a YouTube URL or ID into a watch URL, embed URL, and videoId.
 */
export function normalizeYouTubeEmbedUrl(
  rawInput?: string | null
): {
  videoId: string;
  watchUrl: string;
  embedUrl: string;
} {
  const videoId =
    extractYouTubeVideoId(rawInput) || DEFAULT_YOUTUBE_VIDEO_ID;
  return {
    videoId,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&mute=1&playsinline=1&controls=1&rel=0&modestbranding=1`,
  };
}

/**
 * Updates the programmed YouTube video URL on a specific `youtube_tv` object (or all TVs if targetId === 'all').
 */
export function updateRoomObjectVideoUrl(
  objects: RoomObject[],
  targetId: string,
  rawVideoUrl: string
): RoomObject[] {
  const videoId = extractYouTubeVideoId(rawVideoUrl);
  if (!videoId) return objects;
  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return objects.map((obj) => {
    if (obj.type !== 'youtube_tv') return obj;
    if (targetId !== 'all' && obj.id !== targetId) return obj;
    return {
      ...obj,
      videoUrl: canonicalUrl,
      customNote: `Now playing YouTube video (${videoId}) in 3D for all visitors in the room.`,
    };
  });
}

export interface VisitorAvatarProfile {
  id: string;
  name: string;
  skinColor: string;
  hairColor: string;
  shirtColor: string;
  pantsColor: string;
  shoeColor: string;
  accessory: 'none' | 'cap' | 'visor' | 'headphones' | 'crown';
  createdAt: string;
}

const VISITOR_NAME_PREFIXES = [
  'PixelGuest',
  'HabboVoyager',
  'RetroNomad',
  'ClubWalker',
  'VoxelExplorer',
  'LoungeVisitor',
  'NeonCitizen',
  'IsoTraveler',
];

const VISITOR_SKIN_COLORS = [
  '#F5CBA7',
  '#FAD7A0',
  '#E59866',
  '#D35400',
  '#8D5524',
  '#FDEBD0',
];

const VISITOR_HAIR_COLORS = [
  '#2C1810',
  '#D4AC0D',
  '#922B21',
  '#5D6D7E',
  '#1F618D',
  '#7D3C98',
  '#117864',
  '#6E2C00',
];

const VISITOR_SHIRT_COLORS = [
  '#E11D48',
  '#2563EB',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#06B6D4',
  '#EC4899',
  '#EA580C',
];

const VISITOR_PANTS_COLORS = [
  '#1E293B',
  '#1E3A8A',
  '#374151',
  '#451A03',
  '#312E81',
  '#064E3B',
];

const VISITOR_SHOE_COLORS = [
  '#F8FAFC',
  '#FACC15',
  '#EF4444',
  '#38BDF8',
  '#E2E8F0',
];

const VISITOR_ACCESSORIES: VisitorAvatarProfile['accessory'][] = [
  'none',
  'cap',
  'visor',
  'headphones',
  'crown',
];

/**
 * Generates a random Habbo-style visitor avatar profile whenever a random visitor enters the website.
 */
export function generateRandomVisitorAvatar(
  rng: () => number = Math.random
): VisitorAvatarProfile {
  const pick = <T,>(arr: T[]): T =>
    arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
  const badgeNum = Math.floor(100 + rng() * 899);
  const prefix = pick(VISITOR_NAME_PREFIXES);

  return {
    id: `visitor-${ badgeNum }-${Math.floor(rng() * 10000)}`,
    name: `${prefix}_${badgeNum}`,
    skinColor: pick(VISITOR_SKIN_COLORS),
    hairColor: pick(VISITOR_HAIR_COLORS),
    shirtColor: pick(VISITOR_SHIRT_COLORS),
    pantsColor: pick(VISITOR_PANTS_COLORS),
    shoeColor: pick(VISITOR_SHOE_COLORS),
    accessory: pick(VISITOR_ACCESSORIES),
    createdAt: new Date().toISOString(),
  };
}

export const DEFAULT_PROJECT_LINKS: ProjectLink[] = [
  {
    id: 'proj-pixel-engine',
    title: 'IsoCanvas Voxel Engine',
    subtitle: 'Zero-dependency 2D isometric renderer & A* pathfinder',
    url: 'https://github.com/open-hotel/open-hotel-client',
    category: 'Graphics & Game Tech',
    techStack: ['TypeScript', 'HTML5 Canvas', 'Volter Font'],
    accentColor: '#22d3ee',
    featuredMetric: '60 FPS · Pixel-Perfect',
    description:
      'A deterministic 2:1 isometric pixel-art engine supporting multi-tier z-stacking, painter-algorithm depth sorting, and sofa sitting states.',
  },
  {
    id: 'proj-synth-cloud',
    title: 'ChronoGrid Distributed KV',
    subtitle: 'Low-latency edge state store with CRDT replication',
    url: 'https://github.com/open-hotel/orion-emulator',
    category: 'Distributed Systems',
    techStack: ['TypeScript', 'WebSockets', 'Next.js'],
    accentColor: '#f472b6',
    featuredMetric: '1.8ms P99 Read Latency',
    description:
      'Multi-region state synchronization engine built for collaborative virtual hotel rooms, real-time inventory ledgers, and avatar presence.',
  },
  {
    id: 'proj-neural-synth',
    title: 'BitChime FM Audio Lounge',
    subtitle: 'Browser-native 16-bit chiptune & Habbo lobby music synth',
    url: 'https://github.com/open-hotel/pixel-ui',
    category: 'Creative Audio',
    techStack: ['Web Audio API', 'React 19', 'MP3 SFX'],
    accentColor: '#facc15',
    featuredMetric: 'Real-Time Bossa Synth',
    description:
      'Interactive retro sound synthesizer generating ambient Habbo Hotel lobby chords, chat pops, and furniture interaction audio.',
  },
  {
    id: 'proj-habbo-dex',
    title: 'FurniVault Asset Indexer',
    subtitle: 'Visual catalog & bounding-box inspector for isometric sprites',
    url: 'https://github.com/open-hotel/open-hotel-resources',
    category: 'Developer Tooling',
    techStack: ['Next.js', 'Canvas2D', 'TexturePacker'],
    accentColor: '#a855f7',
    featuredMetric: '1,420+ Indexed Sprites',
    description:
      'Automated sprite-sheet slicer and color-keyed isometric footprint extractor for classic virtual world furniture, bottles, and blocks.',
  },
  {
    id: 'proj-draco-ai',
    title: 'PetMind Autonomous Agents',
    subtitle: 'Behavior-tree state machine for digital pets (Chat & Draco)',
    url: 'https://github.com/open-hotel/vancouver-cms',
    category: 'Simulation',
    techStack: ['TypeScript', 'Statecharts', 'Node:Test'],
    accentColor: '#34d399',
    featuredMetric: '14 Autonomous Mood States',
    description:
      'Lightweight finite-state simulation driving digital pets that nap in wicker baskets, request salmon treats, and greet visitors.',
  },
];

export const DEFAULT_ROOM_OBJECTS: RoomObject[] = [
  // 1. Secret Corner Control Console at (1, 1)
  {
    id: 'obj-admin-console',
    type: 'admin_console',
    label: 'Corner Control Console',
    x: 1,
    y: 1,
    z: 0,
    rotation: 'se',
    colorVariant: '#10b981',
    walkable: false,
    projectId: 'proj-habbo-dex',
    customNote: 'Hardware console with glowing buttons, levers & bottle/block monitor.',
    createdAt: '2026-10-20T09:00:00Z',
  },

  // 2. Luxury Dithered Floor Rugs (Walkable! Placed like the reference image)
  {
    id: 'obj-rug-pink-1',
    type: 'luxury_rug_pink',
    label: 'Luxury Rose Dithered Rug',
    x: 4,
    y: 5,
    z: 0,
    rotation: 'se',
    colorVariant: '#f472b6',
    walkable: true,
    projectId: 'proj-pixel-engine',
    createdAt: '2026-10-20T09:05:00Z',
  },
  {
    id: 'obj-rug-blue-1',
    type: 'luxury_rug_blue',
    label: 'Luxury Sky Dithered Rug',
    x: 7,
    y: 5,
    z: 0,
    rotation: 'sw',
    colorVariant: '#38bdf8',
    walkable: true,
    projectId: 'proj-synth-cloud',
    createdAt: '2026-10-20T09:06:00Z',
  },

  // 3. Royal Crowns on White Marble Bust Pedestals (Exact reference placement + project links)
  {
    id: 'obj-crown-purple',
    type: 'royal_crown_purple',
    label: 'Royal Amethyst Crown Bust',
    x: 2,
    y: 2,
    z: 0,
    rotation: 'se',
    colorVariant: '#a855f7',
    walkable: false,
    projectId: 'proj-habbo-dex',
    customNote: 'Sovereign amethyst velvet crown mounted on a carved marble bust.',
    createdAt: '2026-10-20T09:10:00Z',
  },
  {
    id: 'obj-crown-gold',
    type: 'royal_crown_gold',
    label: 'Stacked Golden Sovereign Crown',
    x: 6,
    y: 1,
    z: 0,
    rotation: 'sw',
    colorVariant: '#facc15',
    walkable: false,
    projectId: 'proj-neural-synth',
    customNote: 'Double-stacked golden sovereign crowns near the right window.',
    createdAt: '2026-10-20T09:11:00Z',
  },

  // 4. Resting Digital Pets along Left Wall (Cat in basket, second basket, blue bowl, Draco dragon)
  {
    id: 'obj-pet-cat-1',
    type: 'pet_cat_basket',
    label: 'Sleeping Pixel Cat (*ZZZZZZZZZZ*)',
    x: 1,
    y: 8,
    z: 0,
    rotation: 'se',
    colorVariant: '#94a3b8',
    walkable: false,
    projectId: 'proj-draco-ai',
    customNote: 'Sleeping grey pixel cat dreaming of fresh salmon (*wants fresh salmon*).',
    createdAt: '2026-10-20T09:15:00Z',
  },
  {
    id: 'obj-pet-cat-2',
    type: 'pet_cat_basket',
    label: 'Woven Wicker Pet Basket',
    x: 1,
    y: 6,
    z: 0,
    rotation: 'se',
    colorVariant: '#d97706',
    walkable: false,
    projectId: 'proj-draco-ai',
    customNote: 'Cozy spare wicker basket along the red brick wall.',
    createdAt: '2026-10-20T09:16:00Z',
  },
  {
    id: 'obj-water-bowl',
    type: 'water_bowl',
    label: 'Blue Ceramic Pet Bowl',
    x: 2,
    y: 7,
    z: 0,
    rotation: 'se',
    colorVariant: '#38bdf8',
    walkable: false,
    projectId: 'proj-draco-ai',
    createdAt: '2026-10-20T09:17:00Z',
  },
  {
    id: 'obj-pet-dragon',
    type: 'pet_dragon',
    label: 'Draco (Winged Dragon Pet)',
    x: 3,
    y: 5,
    z: 0,
    rotation: 'se',
    colorVariant: '#818cf8',
    walkable: false,
    projectId: 'proj-draco-ai',
    customNote: 'Autonomous winged dragon companion resting on the rose rug.',
    createdAt: '2026-10-20T09:18:00Z',
  },

  // 5. Modern White Club Sofas (Sittable! Click any sofa to sit on it!)
  {
    id: 'obj-sofa-1',
    type: 'white_sofa',
    label: 'Modern White Club Sofa (West)',
    x: 3,
    y: 8,
    z: 0,
    rotation: 'se',
    colorVariant: '#f8fafc',
    walkable: false,
    sittable: true,
    projectId: 'proj-pixel-engine',
    customNote: 'Click to walk over and sit down on this classic white Habbo Club Sofa!',
    createdAt: '2026-10-20T09:20:00Z',
  },
  {
    id: 'obj-sofa-2',
    type: 'white_sofa',
    label: 'Modern White Club Sofa (East)',
    x: 6,
    y: 8,
    z: 0,
    rotation: 'sw',
    colorVariant: '#f8fafc',
    walkable: false,
    sittable: true,
    projectId: 'proj-synth-cloud',
    customNote: 'Click to sit down and relax on this white leather Habbo sofa!',
    createdAt: '2026-10-20T09:21:00Z',
  },
  {
    id: 'obj-sofa-3-stack',
    type: 'white_sofa',
    label: 'Stacked VIP White Club Sofa (Lower)',
    x: 1,
    y: 4,
    z: 0,
    rotation: 'se',
    colorVariant: '#f8fafc',
    walkable: false,
    sittable: true,
    projectId: 'proj-pixel-engine',
    customNote: 'Stacked modern white sofa tucked beside the brick doorway.',
    createdAt: '2026-10-20T09:22:00Z',
  },
  {
    id: 'obj-sofa-4-stack-upper',
    type: 'white_sofa',
    label: 'Stacked VIP White Club Sofa (Upper Tier)',
    x: 1,
    y: 4,
    z: 1,
    rotation: 'se',
    colorVariant: '#f8fafc',
    walkable: false,
    sittable: true,
    projectId: 'proj-habbo-dex',
    customNote: 'Double-stacked Habbo Club Sofa! Click to climb up and sit on the top tier.',
    createdAt: '2026-10-20T09:22:30Z',
  },
  {
    id: 'obj-sofa-5-center',
    type: 'white_sofa',
    label: 'Lounge White Club Sofa (Center-Left)',
    x: 4,
    y: 7,
    z: 0,
    rotation: 'se',
    colorVariant: '#f8fafc',
    walkable: false,
    sittable: true,
    projectId: 'proj-neural-synth',
    customNote: 'Plush white Habbo Club Sofa bordering the rose dithered carpet.',
    createdAt: '2026-10-20T09:23:00Z',
  },

  // 6. Mahogany Lounge Table, Bistro Stools & Twisted Bamboo Plant (like reference!)
  {
    id: 'obj-wood-table',
    type: 'wood_table',
    label: 'Mahogany Lounge Table',
    x: 6,
    y: 4,
    z: 0,
    rotation: 'sw',
    colorVariant: '#9a5b3e',
    walkable: false,
    projectId: 'proj-synth-cloud',
    customNote: 'Polished wooden Habbo table overlooking the sky-blue rug.',
    createdAt: '2026-10-20T09:25:00Z',
  },
  {
    id: 'obj-wood-stool-1',
    type: 'wood_stool',
    label: 'Bistro Folding Stool I',
    x: 7,
    y: 5,
    z: 0,
    rotation: 'sw',
    colorVariant: '#b06d4b',
    walkable: false,
    sittable: true,
    projectId: 'proj-synth-cloud',
    customNote: 'Click to sit at the mahogany lounge table!',
    createdAt: '2026-10-20T09:26:00Z',
  },
  {
    id: 'obj-wood-stool-2',
    type: 'wood_stool',
    label: 'Bistro Folding Stool II',
    x: 8,
    y: 4,
    z: 0,
    rotation: 'sw',
    colorVariant: '#b06d4b',
    walkable: false,
    sittable: true,
    projectId: 'proj-neural-synth',
    customNote: 'Click to sit by the window lounge table!',
    createdAt: '2026-10-20T09:26:30Z',
  },
  {
    id: 'obj-plant-front',
    type: 'potted_plant',
    label: 'Twisted Spiral Bamboo Plant',
    x: 5,
    y: 9,
    z: 0,
    rotation: 'se',
    colorVariant: '#22c55e',
    walkable: false,
    projectId: 'proj-pixel-engine',
    customNote: 'Imported directly from open-hotel-client (4_noob_plant_64).',
    createdAt: '2026-10-20T09:27:00Z',
  },

  // 7. Wall Bulletin Boards & Floating Project Screens (Integrated smoothly into walls/corners)
  {
    id: 'obj-screen-1',
    type: 'neon_bulletin',
    label: 'IsoCanvas Voxel Engine',
    x: 0,
    y: 3,
    z: 0,
    rotation: 'se',
    colorVariant: '#22d3ee',
    walkable: false,
    projectId: 'proj-pixel-engine',
    createdAt: '2026-10-20T09:30:00Z',
  },
  {
    id: 'obj-screen-2',
    type: 'floating_screen',
    label: 'ChronoGrid Distributed KV',
    x: 0,
    y: 5,
    z: 0,
    rotation: 'se',
    colorVariant: '#f472b6',
    walkable: false,
    projectId: 'proj-synth-cloud',
    createdAt: '2026-10-20T09:31:00Z',
  },
  {
    id: 'obj-youtube-tv-1',
    type: 'youtube_tv',
    label: '3D YouTube Wall TV',
    x: 5,
    y: 0,
    z: 0,
    rotation: 'se',
    colorVariant: '#f59e0b',
    walkable: false,
    videoUrl: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
    customNote:
      'Giant 3D YouTube Cinema Wall Screen broadcasting live across the room for all visitors.',
    createdAt: '2026-10-20T09:31:30Z',
  },
  {
    id: 'obj-screen-3',
    type: 'neon_bulletin',
    label: 'BitChime FM Audio Lounge',
    x: 0,
    y: 8,
    z: 0,
    rotation: 'se',
    colorVariant: '#facc15',
    walkable: false,
    projectId: 'proj-neural-synth',
    createdAt: '2026-10-20T09:32:00Z',
  },
  {
    id: 'obj-screen-4',
    type: 'floating_screen',
    label: 'FurniVault Asset Indexer',
    x: 9,
    y: 7,
    z: 0,
    rotation: 'sw',
    colorVariant: '#a855f7',
    walkable: false,
    projectId: 'proj-habbo-dex',
    createdAt: '2026-10-20T09:33:00Z',
  },

  // 8. Glass Bottles & Building Blocks (Admin Console Optimization Props)
  {
    id: 'obj-bottle-1',
    type: 'glass_bottle',
    label: 'DubbelFrisss Pixel Bottle',
    x: 6,
    y: 4,
    z: 1, // On top of the Mahogany Lounge Table!
    rotation: 'se',
    colorVariant: '#34d399',
    walkable: false,
    projectId: 'proj-habbo-dex',
    createdAt: '2026-10-20T09:40:00Z',
  },
  {
    id: 'obj-bottle-2',
    type: 'glass_bottle',
    label: 'Amber Vintage Elixir Bottle',
    x: 3,
    y: 1,
    z: 0,
    rotation: 'se',
    colorVariant: '#f59e0b',
    walkable: false,
    projectId: 'proj-neural-synth',
    createdAt: '2026-10-20T09:41:00Z',
  },
  {
    id: 'obj-block-1',
    type: 'building_block',
    label: 'Battle Banzai Crimson Block',
    x: 8,
    y: 2,
    z: 0,
    rotation: 'se',
    colorVariant: '#ef4444',
    walkable: false,
    projectId: 'proj-pixel-engine',
    createdAt: '2026-10-20T09:42:00Z',
  },
  {
    id: 'obj-block-2',
    type: 'building_block',
    label: 'Battle Banzai Sky Block (Tier 2)',
    x: 8,
    y: 2,
    z: 1,
    rotation: 'se',
    colorVariant: '#38bdf8',
    walkable: false,
    projectId: 'proj-synth-cloud',
    createdAt: '2026-10-20T09:42:30Z',
  },
];

export interface RoomPet {
  id: string;
  name: string;
  species: 'cat' | 'dragon' | 'camerabot';
  initialCoord: GridCoord;
  colorVariant?: string;
  stepIntervalMs: number;
  projectId: string;
  description: string;
}

export const DEFAULT_ROOM_PETS: RoomPet[] = [
  {
    id: 'milo-cat',
    name: 'Milo',
    species: 'cat',
    initialCoord: { x: 4, y: 6 },
    stepIntervalMs: 1750,
    projectId: 'proj-draco-ai',
    description:
      'Milo the Habbo tabby cat wandering randomly across the isometric floor tiles.',
  },
  {
    id: 'chat-ginger',
    name: 'Ginger',
    species: 'cat',
    colorVariant: '#D97706',
    initialCoord: { x: 3, y: 6 },
    stepIntervalMs: 1950,
    projectId: 'proj-pixel-engine',
    description:
      'Ginger the warm orange Habbo cat exploring the room tiles randomly in search of salmon.',
  },
  {
    id: 'draco-dragon',
    name: 'Draco',
    species: 'dragon',
    initialCoord: { x: 3, y: 4 },
    stepIntervalMs: 1650,
    projectId: 'proj-draco-ai',
    description:
      'Draco, the winged purple Habbo dragon patrolling randomly across the room.',
  },
  {
    id: 'rover-bot',
    name: 'Rover',
    species: 'camerabot',
    initialCoord: { x: 4, y: 2 },
    stepIntervalMs: 2100,
    projectId: 'proj-habbo-dex',
    description:
      'Open-Hotel directional CameraBot rover patrolling the oak floor tiles randomly.',
  },
];

export function removeRoomPet(pets: RoomPet[], petId: string): RoomPet[] {
  return pets.filter((pet) => pet.id !== petId);
}

export function canModifyRoom(isAdminAuthenticated: boolean): boolean {
  return isAdminAuthenticated === true;
}

export const INITIAL_CHAT_BUBBLES: ChatBubble[] = [
  {
    id: 'chat-1',
    speaker: 'Milo',
    speakerType: 'cat',
    text: 'Hey there!',
    offsetY: 162,
    createdAt: 1000,
  },
  {
    id: 'chat-2',
    speaker: 'Ginger',
    speakerType: 'cat',
    text: '*wants fresh salmon*',
    offsetY: 132,
    createdAt: 2000,
  },
  {
    id: 'chat-3',
    speaker: 'Higma',
    speakerType: 'avatar',
    text: 'Welcome to the room!',
    offsetY: 102,
    createdAt: 3000,
  },
  {
    id: 'chat-4',
    speaker: 'Draco',
    speakerType: 'dragon',
    text: '*flaps wings across the grid*',
    offsetY: 72,
    createdAt: 4000,
  },
  {
    id: 'chat-5',
    speaker: 'Milo',
    speakerType: 'cat',
    text: '*ZZZZZZZZZZ*',
    offsetY: 36,
    createdAt: 5000,
  },
  {
    id: 'chat-6',
    speaker: 'Ginger',
    speakerType: 'cat',
    text: '*purrs happily*',
    offsetY: 6,
    createdAt: 6000,
  },
];

/**
 * Converts isometric grid coordinates (x, y, z) to screen pixel coordinates (sx, sy)
 * relative to the top-center origin (originX, originY) of tile (0, 0).
 */
export function gridToScreen(
  x: number,
  y: number,
  z: number = 0,
  originX: number = 0,
  originY: number = 0
): ScreenCoord {
  const sx = originX + (x - y) * (TILE_WIDTH / 2);
  const sy = originY + (x + y) * (TILE_HEIGHT / 2) - z * Z_HEIGHT_PX;
  return { sx, sy };
}

/**
 * Converts screen pixel coordinates (sx, sy) back to integer grid coordinates (x, y)
 * assuming z = 0 floor plane.
 */
export function screenToGrid(
  sx: number,
  sy: number,
  originX: number = 0,
  originY: number = 0
): GridCoord {
  const dx = sx - originX;
  const dy = sy - originY;
  const halfW = TILE_WIDTH / 2;
  const halfH = TILE_HEIGHT / 2;

  const rawX = (dx / halfW + dy / halfH) / 2;
  const rawY = (dy / halfH - dx / halfW) / 2;

  return {
    x: Math.floor(rawX),
    y: Math.floor(rawY),
  };
}

/**
 * Checks if a coordinate is inside the 10x10 room bounds.
 */
export function isWithinGrid(
  x: number,
  y: number,
  gridSize: number = GRID_SIZE
): boolean {
  return x >= 0 && x < gridSize && y >= 0 && y < gridSize;
}

/**
 * Checks if a tile has a sittable object (like a Modern White Club Sofa or Stool).
 */
export function findSittableObjectAtTile(
  x: number,
  y: number,
  objects: RoomObject[]
): RoomObject | null {
  const match = objects.find(
    (o) =>
      o.x === x &&
      o.y === y &&
      (o.sittable === true || o.type === 'white_sofa' || o.type === 'wood_stool')
  );
  return match || null;
}

/**
 * Determines if a tile (x, y) is walkable by the avatar.
 * A tile is walkable if it is within bounds and has NO non-walkable object at (x, y).
 */
export function isTileWalkable(
  x: number,
  y: number,
  objects: RoomObject[],
  gridSize: number = GRID_SIZE
): boolean {
  if (!isWithinGrid(x, y, gridSize)) return false;
  for (const obj of objects) {
    if (obj.x === x && obj.y === y && !obj.walkable) {
      return false;
    }
  }
  return true;
}

/**
 * Sorts room objects using the isometric Painter's Algorithm so objects further back
 * (lower x + y), flat floor rugs, and lower z-tiers render before foreground/higher objects.
 */
export function sortObjectsForRender(objects: RoomObject[]): RoomObject[] {
  return [...objects].sort((a, b) => {
    const aIsRug = a.walkable && a.z === 0 ? 0 : 1;
    const bIsRug = b.walkable && b.z === 0 ? 0 : 1;
    if (aIsRug !== bIsRug) return aIsRug - bIsRug;

    const depthA = a.x + a.y;
    const depthB = b.x + b.y;
    if (depthA !== depthB) return depthA - depthB;

    if (a.x !== b.x) return a.x - b.x;
    if (a.z !== b.z) return a.z - b.z;

    return a.id.localeCompare(b.id);
  });
}

/**
 * Finds the shortest walkable path from start to goal using Breadth-First Search.
 * If the goal is a solid furniture object, walks to the closest reachable adjacent walkable tile.
 * If the goal is a sittable sofa/stool, walks to the adjacent walkable tile and steps onto the seat!
 */
export function findPath(
  start: GridCoord,
  goal: GridCoord,
  objects: RoomObject[],
  gridSize: number = GRID_SIZE
): GridCoord[] {
  if (!isWithinGrid(goal.x, goal.y, gridSize)) return [];
  if (start.x === goal.x && start.y === goal.y) return [];

  const sittableGoal = findSittableObjectAtTile(goal.x, goal.y, objects);

  const queue: GridCoord[] = [start];
  const visited = new Set<string>([`${start.x},${start.y}`]);
  const parentMap = new Map<string, GridCoord>();
  const reachableTiles: GridCoord[] = [start];

  // 4 cardinal directions first (classic crisp isometric steps), plus 4 diagonals if not corner-blocked
  const cardinalDirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];
  const diagDirs = [
    { dx: 1, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 1 },
    { dx: -1, dy: -1 },
  ];

  while (queue.length > 0) {
    const curr = queue.shift()!;

    for (const { dx, dy } of cardinalDirs) {
      const nx = curr.x + dx;
      const ny = curr.y + dy;
      const key = `${nx},${ny}`;
      if (!visited.has(key) && isTileWalkable(nx, ny, objects, gridSize)) {
        visited.add(key);
        parentMap.set(key, curr);
        const node = { x: nx, y: ny };
        queue.push(node);
        reachableTiles.push(node);
      }
    }

    for (const { dx, dy } of diagDirs) {
      const nx = curr.x + dx;
      const ny = curr.y + dy;
      const key = `${nx},${ny}`;
      if (
        !visited.has(key) &&
        isTileWalkable(nx, ny, objects, gridSize) &&
        (isTileWalkable(curr.x + dx, curr.y, objects, gridSize) ||
          isTileWalkable(curr.x, curr.y + dy, objects, gridSize))
      ) {
        visited.add(key);
        parentMap.set(key, curr);
        const node = { x: nx, y: ny };
        queue.push(node);
        reachableTiles.push(node);
      }
    }
  }

  const buildPathTo = (target: GridCoord): GridCoord[] => {
    const path: GridCoord[] = [];
    let trace: GridCoord | undefined = target;
    while (trace && !(trace.x === start.x && trace.y === start.y)) {
      path.unshift(trace);
      trace = parentMap.get(`${trace.x},${trace.y}`);
    }
    return path;
  };

  // Case 1: Goal itself is walkable and reachable
  if (visited.has(`${goal.x},${goal.y}`)) {
    return buildPathTo(goal);
  }

  // Case 2: Goal is a solid object or blocked tile -> find closest reachable tile to goal
  // Prefer 4-cardinal neighbors (manhattan === 1) first so unit tests & interactions land orthogonally adjacent
  const candidates = reachableTiles.filter(
    (t) => !(t.x === start.x && t.y === start.y && reachableTiles.length > 1)
  );
  if (candidates.length === 0) {
    return sittableGoal ? [goal] : [];
  }

  candidates.sort((a, b) => {
    const manA = Math.abs(a.x - goal.x) + Math.abs(a.y - goal.y);
    const manB = Math.abs(b.x - goal.x) + Math.abs(b.y - goal.y);
    const isCardA = manA === 1 ? 0 : 1;
    const isCardB = manB === 1 ? 0 : 1;
    if (isCardA !== isCardB) return isCardA - isCardB;
    if (manA !== manB) return manA - manB;
    return (
      Math.hypot(a.x - start.x, a.y - start.y) -
      Math.hypot(b.x - start.x, b.y - start.y)
    );
  });

  const bestTarget = candidates[0];
  const path = buildPathTo(bestTarget);
  if (sittableGoal && (bestTarget.x !== goal.x || bestTarget.y !== goal.y)) {
    path.push(goal);
  }
  return path;
}

/**
 * Calculates room clutter metrics for the Admin Console.
 */
export function calculateRoomClutterMetrics(
  objects: RoomObject[],
  gridSize: number = GRID_SIZE
): {
  totalTiles: number;
  occupiedTiles: number;
  walkableTiles: number;
  clutterPercentage: number;
  bottlesCount: number;
  blocksCount: number;
  projectScreensCount: number;
  stackedObjectsCount: number;
} {
  const totalTiles = gridSize * gridSize;
  let walkableTiles = 0;

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      if (isTileWalkable(x, y, objects, gridSize)) {
        walkableTiles++;
      }
    }
  }

  const occupiedTiles = totalTiles - walkableTiles;
  const clutterPercentage = Math.round((occupiedTiles / totalTiles) * 100);
  const bottlesCount = objects.filter((o) => o.type === 'glass_bottle').length;
  const blocksCount = objects.filter((o) => o.type === 'building_block').length;
  const projectScreensCount = objects.filter(
    (o) => o.type === 'neon_bulletin' || o.type === 'floating_screen'
  ).length;
  const stackedObjectsCount = objects.filter((o) => o.z > 0).length;

  return {
    totalTiles,
    occupiedTiles,
    walkableTiles,
    clutterPercentage,
    bottlesCount,
    blocksCount,
    projectScreensCount,
    stackedObjectsCount,
  };
}

/**
 * Computes the next available vertical stack elevation z at tile (x, y).
 */
export function getNextStackHeightAtTile(
  x: number,
  y: number,
  objects: RoomObject[]
): number {
  const tileObjects = objects.filter(
    (o) => o.x === x && o.y === y && !o.walkable
  );
  if (tileObjects.length === 0) return 0;
  const maxZ = Math.max(...tileObjects.map((o) => o.z));
  return Math.min(maxZ + 1, 5);
}

/**
 * Validates input for manually adding a new RoomObject in /admin.
 */
export function validateNewRoomObject(input: {
  type?: string;
  label?: string;
  x?: number;
  y?: number;
  z?: number;
}): { valid: boolean; error?: string } {
  if (!input.type || !(input.type in OBJECT_CATALOG)) {
    return { valid: false, error: 'Please select a valid room object type.' };
  }
  const trimmedLabel = (input.label ?? '').trim();
  if (trimmedLabel.length < 2) {
    return {
      valid: false,
      error: 'Object label must be at least 2 characters long.',
    };
  }
  if (
    typeof input.x !== 'number' ||
    Number.isNaN(input.x) ||
    input.x < 0 ||
    input.x >= GRID_SIZE
  ) {
    return {
      valid: false,
      error: `Grid X coordinate must be an integer between 0 and ${GRID_SIZE - 1}.`,
    };
  }
  if (
    typeof input.y !== 'number' ||
    Number.isNaN(input.y) ||
    input.y < 0 ||
    input.y >= GRID_SIZE
  ) {
    return {
      valid: false,
      error: `Grid Y coordinate must be an integer between 0 and ${GRID_SIZE - 1}.`,
    };
  }
  if (
    typeof input.z === 'number' &&
    (Number.isNaN(input.z) || input.z < 0 || input.z > 6)
  ) {
    return {
      valid: false,
      error: 'Stack height Z must be between 0 and 6.',
    };
  }
  return { valid: true };
}

/**
 * Validates a new or updated ProjectLink in /admin.
 */
export function validateProjectLink(input: {
  title?: string;
  url?: string;
  category?: string;
}): { valid: boolean; error?: string } {
  if (!input.title || input.title.trim().length < 2) {
    return { valid: false, error: 'Project title is required (min 2 chars).' };
  }
  if (!input.url || !/^https?:\/\/.+/i.test(input.url.trim())) {
    return {
      valid: false,
      error: 'Project URL must start with http:// or https://.',
    };
  }
  if (!input.category || input.category.trim().length < 2) {
    return { valid: false, error: 'Project category is required.' };
  }
  return { valid: true };
}

export const OWNER_EMAIL = 'contesalim69@gmail.com';
export const OWNER_SECRET_KEY = 'HIGMA-777';

/**
 * Verifies the /admin passcode or owner identity.
 */
export function verifyAdminPasscode(code: string): boolean {
  const normalized = code.trim();
  const lower = normalized.toLowerCase();
  return (
    normalized === DEMO_ADMIN_PASSCODE ||
    normalized.toUpperCase() === OWNER_SECRET_KEY ||
    lower === OWNER_EMAIL.toLowerCase() ||
    lower === 'habbo' ||
    normalized === '1337'
  );
}

export interface DragFurniturePayload {
  type: RoomObjectType;
  label: string;
  colorVariant: string;
  rotation: IsometricRotation;
  projectId?: string;
  videoUrl?: string;
}

/**
 * Serializes a draggable furniture item payload for HTML5 DataTransfer.
 */
export function serializeDragFurniturePayload(
  payload: DragFurniturePayload
): string {
  return JSON.stringify(payload);
}

/**
 * Parses and validates a dragged furniture payload from HTML5 DataTransfer.
 */
export function parseDragFurniturePayload(
  raw: string | null | undefined
): DragFurniturePayload | null {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DragFurniturePayload>;
    if (!parsed || typeof parsed.type !== 'string') return null;
    if (!(parsed.type in OBJECT_CATALOG)) return null;
    const spec = OBJECT_CATALOG[parsed.type as RoomObjectType];
    const rotation: IsometricRotation =
      parsed.rotation === 'sw' ||
      parsed.rotation === 'nw' ||
      parsed.rotation === 'ne'
        ? parsed.rotation
        : 'se';
    return {
      type: spec.type,
      label:
        typeof parsed.label === 'string' && parsed.label.trim().length >= 2
          ? parsed.label.trim()
          : spec.name,
      colorVariant:
        typeof parsed.colorVariant === 'string' &&
        parsed.colorVariant.trim().length > 0
          ? parsed.colorVariant.trim()
          : spec.defaultColor,
      rotation,
      projectId:
        typeof parsed.projectId === 'string' && parsed.projectId.trim().length > 0
          ? parsed.projectId.trim()
          : undefined,
      videoUrl:
        typeof parsed.videoUrl === 'string' && parsed.videoUrl.trim().length > 0
          ? parsed.videoUrl.trim()
          : spec.type === 'youtube_tv'
            ? DEFAULT_YOUTUBE_VIDEO_URL
            : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Maps a pointer/drop coordinate (clientX, clientY) over a scaled isometric canvas
 * to a valid (x, y) room floor grid coordinate, or null if outside the 10x10 floor.
 */
export function resolveCanvasDropTile(params: {
  clientX: number;
  clientY: number;
  rectLeft: number;
  rectTop: number;
  rectWidth: number;
  rectHeight: number;
  logicalWidth: number;
  logicalHeight: number;
  originX: number;
  originY: number;
}): GridCoord | null {
  const {
    clientX,
    clientY,
    rectLeft,
    rectTop,
    rectWidth,
    rectHeight,
    logicalWidth,
    logicalHeight,
    originX,
    originY,
  } = params;

  if (rectWidth <= 0 || rectHeight <= 0) return null;
  const relX = ((clientX - rectLeft) / rectWidth) * logicalWidth;
  const relY = ((clientY - rectTop) / rectHeight) * logicalHeight;
  const grid = screenToGrid(relX, relY, originX, originY);
  if (!isWithinGrid(grid.x, grid.y)) return null;
  return grid;
}

export type PatrolDirection = IsometricRotation;

/**
 * Resolves the 4-way isometric facing direction when moving from `from` to `to`.
 * - +x (down-right on screen) => 'se'
 * - +y (down-left on screen) => 'sw'
 * - -y (up-right on screen) => 'ne'
 * - -x (up-left on screen) => 'nw'
 */
export function resolveIsometricDirection(
  from: GridCoord,
  to: GridCoord,
  fallback: PatrolDirection = 'sw'
): PatrolDirection {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) return fallback;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0 ? 'se' : 'nw';
  }
  return dy > 0 ? 'sw' : 'ne';
}

/**
 * Computes the next walkable grid coordinate and waypoint index for an autonomous patrolling DigitalPet.
 */
export function computeNextPatrolTile(
  current: GridCoord,
  waypoints: GridCoord[],
  waypointIndex: number,
  objects: RoomObject[]
): {
  nextCoord: GridCoord;
  nextWaypointIndex: number;
  direction: PatrolDirection;
} {
  if (waypoints.length === 0) {
    return {
      nextCoord: current,
      nextWaypointIndex: 0,
      direction: 'sw',
    };
  }

  let idx = waypointIndex % waypoints.length;
  let target = waypoints[idx];

  // If already at current waypoint, advance to the next waypoint in the patrol loop
  if (current.x === target.x && current.y === target.y) {
    idx = (idx + 1) % waypoints.length;
    target = waypoints[idx];
  }

  const path = findPath(current, target, objects);
  if (path.length > 0) {
    const nextStep = path[0];
    const reachedTarget = nextStep.x === target.x && nextStep.y === target.y;
    return {
      nextCoord: nextStep,
      nextWaypointIndex: reachedTarget ? (idx + 1) % waypoints.length : idx,
      direction: resolveIsometricDirection(current, nextStep),
    };
  }

  // Fallback: pick any adjacent walkable tile so the pet never gets stuck
  const neighbors: GridCoord[] = [
    { x: current.x + 1, y: current.y },
    { x: current.x, y: current.y + 1 },
    { x: current.x - 1, y: current.y },
    { x: current.x, y: current.y - 1 },
  ].filter((n) => isTileWalkable(n.x, n.y, objects));

  if (neighbors.length > 0) {
    const chosen = neighbors[idx % neighbors.length];
    return {
      nextCoord: chosen,
      nextWaypointIndex: (idx + 1) % waypoints.length,
      direction: resolveIsometricDirection(current, chosen),
    };
  }

  return {
    nextCoord: current,
    nextWaypointIndex: (idx + 1) % waypoints.length,
    direction: 'sw',
  };
}

/**
 * Computes a random next walkable step across the 10x10 floor for free-roaming animals.
 * Avoids immediately stepping back to `previousCoord` unless it is the only exit.
 */
export function computeRandomPatrolTile(
  current: GridCoord,
  objects: RoomObject[],
  previousCoord?: GridCoord | null,
  rng: () => number = Math.random
): {
  nextCoord: GridCoord;
  direction: PatrolDirection;
} {
  const candidates: GridCoord[] = [
    { x: current.x + 1, y: current.y },
    { x: current.x, y: current.y + 1 },
    { x: current.x - 1, y: current.y },
    { x: current.x, y: current.y - 1 },
    { x: current.x + 1, y: current.y + 1 },
    { x: current.x - 1, y: current.y - 1 },
    { x: current.x + 1, y: current.y - 1 },
    { x: current.x - 1, y: current.y + 1 },
  ].filter(
    (n) =>
      n.x >= 1 &&
      n.x < GRID_SIZE - 1 &&
      n.y >= 1 &&
      n.y < GRID_SIZE - 1 &&
      isTileWalkable(n.x, n.y, objects)
  );

  // If inner room is blocked, allow perimeter walkable tiles
  const pool =
    candidates.length > 0
      ? candidates
      : [
          { x: current.x + 1, y: current.y },
          { x: current.x, y: current.y + 1 },
          { x: current.x - 1, y: current.y },
          { x: current.x, y: current.y - 1 },
        ].filter((n) => isTileWalkable(n.x, n.y, objects));

  if (pool.length === 0) {
    return { nextCoord: current, direction: 'sw' };
  }

  const nonBacktrack = previousCoord
    ? pool.filter((n) => !(n.x === previousCoord.x && n.y === previousCoord.y))
    : pool;
  const finalPool = nonBacktrack.length > 0 ? nonBacktrack : pool;
  const pickIdx = Math.min(
    finalPool.length - 1,
    Math.floor(rng() * finalPool.length)
  );
  const chosen = finalPool[pickIdx];
  return {
    nextCoord: chosen,
    direction: resolveIsometricDirection(current, chosen),
  };
}

export type TimeOfDayPhase = 'dawn' | 'day' | 'sunset' | 'night';

export interface TimeOfDayTheme {
  phase: TimeOfDayPhase;
  label: string;
  hour: number;
  backgroundGradient: string;
  windowSkyColor: string;
  ambientOverlayColor: string;
  shadowAlpha: number;
  avatarShadowAlpha: number;
  roomDropShadowFilter: string;
}

/**
 * Computes the CSS background gradient, window sky color, and shadow intensity
 * for HabboRoomView based on the current hour (0..23).
 */
export function computeTimeOfDayTheme(hourInput: number): TimeOfDayTheme {
  const hour = ((Math.floor(hourInput) % 24) + 24) % 24;

  // Dawn: 05:00 - 09:59
  if (hour >= 5 && hour < 10) {
    return {
      phase: 'dawn',
      label: 'Dawn',
      hour,
      backgroundGradient:
        'radial-gradient(circle at 50% 36%, #352244 0%, #181128 52%, #05040a 100%)',
      windowSkyColor: '#F4A261',
      ambientOverlayColor: 'rgba(251, 146, 60, 0.06)',
      shadowAlpha: 0.42,
      avatarShadowAlpha: 0.26,
      roomDropShadowFilter: 'drop-shadow(0 16px 28px rgba(18, 10, 32, 0.68))',
    };
  }

  // Day: 10:00 - 16:59
  if (hour >= 10 && hour < 17) {
    return {
      phase: 'day',
      label: 'Daylight',
      hour,
      backgroundGradient:
        'radial-gradient(circle at 50% 35%, #19304e 0%, #0b1629 55%, #03060c 100%)',
      windowSkyColor: '#79A8D8',
      ambientOverlayColor: 'rgba(56, 189, 248, 0.03)',
      shadowAlpha: 0.30,
      avatarShadowAlpha: 0.22,
      roomDropShadowFilter: 'drop-shadow(0 12px 22px rgba(2, 8, 23, 0.55))',
    };
  }

  // Sunset: 17:00 - 20:59
  if (hour >= 17 && hour < 21) {
    return {
      phase: 'sunset',
      label: 'Sunset',
      hour,
      backgroundGradient:
        'radial-gradient(circle at 50% 40%, #42182b 0%, #1e0b1d 54%, #060208 100%)',
      windowSkyColor: '#E76F51',
      ambientOverlayColor: 'rgba(244, 63, 94, 0.08)',
      shadowAlpha: 0.56,
      avatarShadowAlpha: 0.36,
      roomDropShadowFilter: 'drop-shadow(0 22px 38px rgba(12, 2, 14, 0.82))',
    };
  }

  // Night: 21:00 - 04:59
  return {
    phase: 'night',
    label: 'Night',
    hour,
    backgroundGradient:
      'radial-gradient(circle at 50% 42%, #0d1528 0%, #050811 55%, #000000 100%)',
    windowSkyColor: '#1B263B',
    ambientOverlayColor: 'rgba(30, 58, 138, 0.12)',
    shadowAlpha: 0.75,
    avatarShadowAlpha: 0.45,
    roomDropShadowFilter: 'drop-shadow(0 28px 48px rgba(0, 0, 0, 0.94))',
  };
}

/**
 * Filters chat/interaction notification bubbles so they expire automatically after `ttlMs`.
 */
export function filterActiveChatBubbles(
  bubbles: ChatBubble[],
  nowMs: number,
  ttlMs: number = 4500
): ChatBubble[] {
  return bubbles.filter((b) => nowMs - b.createdAt < ttlMs);
}

export type PlacementMode = 'replace' | 'stack';

/**
 * Cleanly places a new RoomObject onto tile (x, y) using either:
 * - 'replace' mode (default organized behavior):
 *    - If the new object is a walkable floor rug, it replaces any existing floor rug on (x, y) at z=0.
 *    - If the new object is solid furniture/prop, it removes any existing non-walkable clutter on (x, y)
 *      (keeping any floor rug underneath) and places the new item cleanly at z=0.
 * - 'stack' mode:
 *    - Keeps existing objects on (x, y) and stacks the new item at the next available Z height.
 */
export function applyTilePlacement(
  existingObjects: RoomObject[],
  newObjInput: {
    id: string;
    type: RoomObjectType;
    label: string;
    x: number;
    y: number;
    z?: number;
    rotation?: IsometricRotation;
    colorVariant?: string;
    projectId?: string;
    videoUrl?: string;
    customNote?: string;
    createdAt?: string;
  },
  mode: PlacementMode = 'replace'
): { objects: RoomObject[]; placed: RoomObject; replacedCount: number } {
  const spec = OBJECT_CATALOG[newObjInput.type];
  const isRug = spec.defaultWalkable;

  let filtered = [...existingObjects];
  let replacedCount = 0;

  if (mode === 'replace') {
    filtered = existingObjects.filter((obj) => {
      if (obj.x !== newObjInput.x || obj.y !== newObjInput.y) return true;
      if (isRug && obj.walkable) {
        replacedCount++;
        return false;
      }
      if (!isRug && !obj.walkable) {
        replacedCount++;
        return false;
      }
      return true;
    });
  }

  const computedZ =
    mode === 'replace'
      ? typeof newObjInput.z === 'number'
        ? newObjInput.z
        : 0
      : isRug
        ? 0
        : typeof newObjInput.z === 'number'
          ? newObjInput.z
          : getNextStackHeightAtTile(newObjInput.x, newObjInput.y, filtered);

  const normalizedVideoUrl =
    newObjInput.type === 'youtube_tv'
      ? normalizeYouTubeEmbedUrl(newObjInput.videoUrl).watchUrl
      : newObjInput.videoUrl;

  const placed: RoomObject = {
    id: newObjInput.id,
    type: newObjInput.type,
    label: newObjInput.label.trim() || spec.name,
    x: newObjInput.x,
    y: newObjInput.y,
    z: computedZ,
    rotation: newObjInput.rotation || 'se',
    colorVariant: newObjInput.colorVariant || spec.defaultColor,
    walkable: spec.defaultWalkable,
    sittable: spec.defaultSittable,
    projectId: newObjInput.projectId,
    videoUrl: normalizedVideoUrl,
    customNote: newObjInput.customNote,
    createdAt: newObjInput.createdAt || new Date().toISOString(),
  };

  return {
    objects: [...filtered, placed],
    placed,
    replacedCount,
  };
}

/**
 * Moves an existing RoomObject to target tile (targetX, targetY).
 * In 'replace' mode, any conflicting object of the same layer (rug vs solid) on the destination tile
 * is replaced so the moved object sits cleanly on the floor at z=0.
 */
export function moveRoomObjectToTile(
  existingObjects: RoomObject[],
  objectId: string,
  targetX: number,
  targetY: number,
  mode: PlacementMode = 'replace'
): RoomObject[] {
  if (!isWithinGrid(targetX, targetY)) return existingObjects;
  const targetObj = existingObjects.find((o) => o.id === objectId);
  if (!targetObj) return existingObjects;

  const withoutMoved = existingObjects.filter((o) => o.id !== objectId);
  const { objects } = applyTilePlacement(
    withoutMoved,
    {
      ...targetObj,
      x: targetX,
      y: targetY,
      z: mode === 'replace' ? 0 : undefined,
    },
    mode
  );
  return objects;
}

/**
 * Finds the topmost RoomObject at tile (x, y) so clicking a tile in the editor
 * immediately selects the primary object on that tile.
 */
export function getTopObjectAtTile(
  x: number,
  y: number,
  objects: RoomObject[]
): RoomObject | null {
  const tileObjs = objects.filter((o) => o.x === x && o.y === y);
  if (tileObjs.length === 0) return null;
  // Prefer non-walkable furniture over floor rugs, then highest Z
  const sorted = [...tileObjs].sort((a, b) => {
    if (a.walkable !== b.walkable) return a.walkable ? 1 : -1;
    return b.z - a.z;
  });
  return sorted[0];
}

/**
 * Clean, architectural, zone-organized Habbo layout preset with zero random clutter:
 * - Zone 1 (Back-Wall Portals): Neon screens & bulletins aligned cleanly along x=0 and y=0 walls
 * - Zone 2 (Command Corner): Control Console at (1,1) + Sovereign Crowns flanking at (2,1) & (1,2)
 * - Zone 3 (Central VIP Lounge): Rose & Sky rugs at (4,5) and (6,5) with neatly aligned White Club Sofas
 * - Zone 4 (Bistro Window Nook): Mahogany Table at (7,3) with DubbelFrisss bottle on top & Bistro Stools
 * - Zone 5 (Cozy Pet Corner): Cat basket at (1,8), Water bowl at (2,8), and Draco Dragon at (3,6)
 */
export const ORGANIZED_ROOM_OBJECTS: RoomObject[] = [
  // Zone 1: Back Wall Project Portals (x=0 and y=0 perimeter)
  {
    id: 'org-console',
    type: 'admin_console',
    label: 'Corner Control Console',
    x: 1,
    y: 1,
    z: 0,
    rotation: 'se',
    colorVariant: '#10b981',
    walkable: false,
    projectId: 'proj-habbo-dex',
    createdAt: '2026-10-20T09:00:00Z',
  },
  {
    id: 'org-screen-1',
    type: 'neon_bulletin',
    label: 'IsoCanvas Voxel Engine',
    x: 0,
    y: 3,
    z: 0,
    rotation: 'se',
    colorVariant: '#22d3ee',
    walkable: false,
    projectId: 'proj-pixel-engine',
    createdAt: '2026-10-20T09:01:00Z',
  },
  {
    id: 'org-screen-2',
    type: 'floating_screen',
    label: 'ChronoGrid Distributed KV',
    x: 2,
    y: 0,
    z: 0,
    rotation: 'sw',
    colorVariant: '#f472b6',
    walkable: false,
    projectId: 'proj-synth-cloud',
    createdAt: '2026-10-20T09:02:00Z',
  },
  {
    id: 'org-youtube-tv-1',
    type: 'youtube_tv',
    label: '3D YouTube Wall TV',
    x: 5,
    y: 0,
    z: 0,
    rotation: 'se',
    colorVariant: '#f59e0b',
    walkable: false,
    videoUrl: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
    customNote:
      'Giant 3D YouTube Cinema Wall Screen broadcasting live across the room for all visitors.',
    createdAt: '2026-10-20T09:02:30Z',
  },
  {
    id: 'org-screen-3',
    type: 'neon_bulletin',
    label: 'BitChime FM Audio Lounge',
    x: 0,
    y: 8,
    z: 0,
    rotation: 'se',
    colorVariant: '#facc15',
    walkable: false,
    projectId: 'proj-neural-synth',
    createdAt: '2026-10-20T09:03:00Z',
  },

  // Zone 2: Sovereign Crowns & Plants along upper perimeter
  {
    id: 'org-crown-purple',
    type: 'royal_crown_purple',
    label: 'Royal Amethyst Crown Bust',
    x: 2,
    y: 1,
    z: 0,
    rotation: 'se',
    colorVariant: '#a855f7',
    walkable: false,
    projectId: 'proj-habbo-dex',
    createdAt: '2026-10-20T09:04:00Z',
  },
  {
    id: 'org-crown-gold',
    type: 'royal_crown_gold',
    label: 'Stacked Golden Sovereign Crown',
    x: 6,
    y: 1,
    z: 0,
    rotation: 'sw',
    colorVariant: '#facc15',
    walkable: false,
    projectId: 'proj-neural-synth',
    createdAt: '2026-10-20T09:05:00Z',
  },

  // Zone 3: Central 2x2 Lounge Carpet (4,5)-(5,6) & Symmetrical White Club Sofas
  {
    id: 'org-rug-pink-1',
    type: 'luxury_rug_pink',
    label: 'Luxury Rose Dithered Rug (NW)',
    x: 4,
    y: 5,
    z: 0,
    rotation: 'se',
    colorVariant: '#f472b6',
    walkable: true,
    projectId: 'proj-pixel-engine',
    createdAt: '2026-10-20T09:06:00Z',
  },
  {
    id: 'org-rug-pink-2',
    type: 'luxury_rug_pink',
    label: 'Luxury Rose Dithered Rug (SW)',
    x: 4,
    y: 6,
    z: 0,
    rotation: 'se',
    colorVariant: '#f472b6',
    walkable: true,
    projectId: 'proj-pixel-engine',
    createdAt: '2026-10-20T09:06:30Z',
  },
  {
    id: 'org-rug-blue-1',
    type: 'luxury_rug_blue',
    label: 'Luxury Sky Dithered Rug (NE)',
    x: 5,
    y: 5,
    z: 0,
    rotation: 'sw',
    colorVariant: '#38bdf8',
    walkable: true,
    projectId: 'proj-synth-cloud',
    createdAt: '2026-10-20T09:07:00Z',
  },
  {
    id: 'org-rug-blue-2',
    type: 'luxury_rug_blue',
    label: 'Luxury Sky Dithered Rug (SE)',
    x: 5,
    y: 6,
    z: 0,
    rotation: 'sw',
    colorVariant: '#38bdf8',
    walkable: true,
    projectId: 'proj-synth-cloud',
    createdAt: '2026-10-20T09:07:30Z',
  },
  {
    id: 'org-sofa-west',
    type: 'white_sofa',
    label: 'Modern White Club Sofa (West)',
    x: 3,
    y: 5,
    z: 0,
    rotation: 'se',
    colorVariant: '#f8fafc',
    walkable: false,
    sittable: true,
    projectId: 'proj-pixel-engine',
    createdAt: '2026-10-20T09:08:00Z',
  },
  {
    id: 'org-sofa-east',
    type: 'white_sofa',
    label: 'Modern White Club Sofa (East)',
    x: 6,
    y: 5,
    z: 0,
    rotation: 'sw',
    colorVariant: '#f8fafc',
    walkable: false,
    sittable: true,
    projectId: 'proj-synth-cloud',
    createdAt: '2026-10-20T09:09:00Z',
  },

  // Zone 4: Window Bistro Table & Stool Nook
  {
    id: 'org-table',
    type: 'wood_table',
    label: 'Mahogany Lounge Table',
    x: 7,
    y: 3,
    z: 0,
    rotation: 'sw',
    colorVariant: '#9a5b3e',
    walkable: false,
    projectId: 'proj-synth-cloud',
    createdAt: '2026-10-20T09:10:00Z',
  },
  {
    id: 'org-bottle-table',
    type: 'glass_bottle',
    label: 'DubbelFrisss Pixel Bottle',
    x: 7,
    y: 3,
    z: 1,
    rotation: 'se',
    colorVariant: '#34d399',
    walkable: false,
    projectId: 'proj-habbo-dex',
    createdAt: '2026-10-20T09:11:00Z',
  },
  {
    id: 'org-stool-1',
    type: 'wood_stool',
    label: 'Bistro Barrel Stool',
    x: 8,
    y: 3,
    z: 0,
    rotation: 'sw',
    colorVariant: '#b06d4b',
    walkable: false,
    sittable: true,
    projectId: 'proj-neural-synth',
    createdAt: '2026-10-20T09:12:00Z',
  },

  // Zone 5: Cozy Pet Corner & Bamboo Planter
  {
    id: 'org-pet-cat',
    type: 'pet_cat_basket',
    label: 'Sleeping Pixel Cat (*ZZZZZZZZZZ*)',
    x: 1,
    y: 8,
    z: 0,
    rotation: 'se',
    colorVariant: '#94a3b8',
    walkable: false,
    projectId: 'proj-draco-ai',
    createdAt: '2026-10-20T09:13:00Z',
  },
  {
    id: 'org-water-bowl',
    type: 'water_bowl',
    label: 'Blue Ceramic Pet Bowl',
    x: 2,
    y: 8,
    z: 0,
    rotation: 'se',
    colorVariant: '#38bdf8',
    walkable: false,
    projectId: 'proj-draco-ai',
    createdAt: '2026-10-20T09:14:00Z',
  },
  {
    id: 'org-plant',
    type: 'potted_plant',
    label: 'Twisted Spiral Bamboo Plant',
    x: 8,
    y: 8,
    z: 0,
    rotation: 'se',
    colorVariant: '#22c55e',
    walkable: false,
    projectId: 'proj-pixel-engine',
    createdAt: '2026-10-20T09:15:00Z',
  },
];




