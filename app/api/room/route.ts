import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_ROOM_OBJECTS,
  DEFAULT_PROJECT_LINKS,
  DEFAULT_ROOM_PETS,
  DEFAULT_INVENTORY_ITEMS,
  DEFAULT_ROOM_SETTINGS,
  RoomObject,
  ProjectLink,
  RoomPet,
  InventoryItem,
  RoomSettings,
  ChatBubble,
  RoomPlayerPresence,
  sanitizeRoomSettings,
  isWallPosterType,
} from '@/lib/room-engine';

export const dynamic = 'force-dynamic';

// Server-side store so any visitor entering the website sees the same TV, video, wall/floor settings, chat, players, and room layout
let serverObjects: RoomObject[] = [...DEFAULT_ROOM_OBJECTS];
let serverProjects: ProjectLink[] = [...DEFAULT_PROJECT_LINKS];
let serverPets: RoomPet[] = [...DEFAULT_ROOM_PETS];
let serverInventory: InventoryItem[] = [...DEFAULT_INVENTORY_ITEMS];
let serverSettings: RoomSettings = { ...DEFAULT_ROOM_SETTINGS };
let serverChatLog: ChatBubble[] = [];
const serverPlayers = new Map<string, RoomPlayerPresence>();
let hasCustomState = false;
let updatedAt = 0;
let hasInitializedPosters = false;

function getActiveServerPlayers(): RoomPlayerPresence[] {
  const now = Date.now();
  for (const [id, player] of serverPlayers.entries()) {
    if (now - player.lastSeenAt > 14000) {
      serverPlayers.delete(id);
    }
  }
  return Array.from(serverPlayers.values());
}

export async function GET() {
  if (!hasInitializedPosters) {
    hasInitializedPosters = true;
    const hasAnyPoster = serverObjects.some((o) => isWallPosterType(o.type));
    if (!hasAnyPoster) {
      const defaultPosters = DEFAULT_ROOM_OBJECTS.filter((o) =>
        isWallPosterType(o.type)
      );
      serverObjects = [...serverObjects, ...defaultPosters];
    }
  }
  return NextResponse.json({
    objects: serverObjects,
    projects: serverProjects,
    pets: serverPets,
    inventory: serverInventory,
    settings: serverSettings,
    chatLog: serverChatLog.slice(-12),
    players: getActiveServerPlayers(),
    hasCustomState,
    updatedAt,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (Array.isArray(body.objects)) {
      serverObjects = body.objects;
      hasCustomState = true;
      updatedAt = Date.now();
    }
    if (Array.isArray(body.projects)) {
      serverProjects = body.projects;
      hasCustomState = true;
      updatedAt = Date.now();
    }
    if (Array.isArray(body.pets)) {
      serverPets = body.pets;
      hasCustomState = true;
      updatedAt = Date.now();
    }
    if (Array.isArray(body.inventory)) {
      serverInventory = body.inventory;
      hasCustomState = true;
      updatedAt = Date.now();
    }
    if (body.settings && typeof body.settings === 'object') {
      serverSettings = sanitizeRoomSettings({
        ...serverSettings,
        ...body.settings,
      });
      hasCustomState = true;
      updatedAt = Date.now();
    }
    if (body.chatBubble && typeof body.chatBubble.text === 'string') {
      const bubble: ChatBubble = {
        id:
          body.chatBubble.id ||
          `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        speaker: String(body.chatBubble.speaker || 'Guest').slice(0, 28),
        speakerType: body.chatBubble.speakerType || 'avatar',
        text: String(body.chatBubble.text).trim().slice(0, 140),
        isShout: Boolean(body.chatBubble.isShout),
        offsetY: 4,
        createdAt: Date.now(),
      };
      serverChatLog = [...serverChatLog.slice(-15), bubble];
    }
    if (
      body.leavePlayerId &&
      typeof body.leavePlayerId === 'string'
    ) {
      serverPlayers.delete(body.leavePlayerId);
    }
    if (
      body.playerPresence &&
      typeof body.playerPresence === 'object' &&
      typeof body.playerPresence.id === 'string'
    ) {
      const p = body.playerPresence as RoomPlayerPresence;
      serverPlayers.set(p.id, {
        id: p.id,
        name: String(p.name || 'Guest').slice(0, 24),
        isOwner: Boolean(p.isOwner),
        x: typeof p.x === 'number' ? p.x : 4,
        y: typeof p.y === 'number' ? p.y : 5,
        targetX: typeof p.targetX === 'number' ? p.targetX : 4,
        targetY: typeof p.targetY === 'number' ? p.targetY : 5,
        facing:
          p.facing === 'se' ||
          p.facing === 'sw' ||
          p.facing === 'nw' ||
          p.facing === 'ne'
            ? p.facing
            : 'sw',
        isSitting: Boolean(p.isSitting),
        action:
          p.action === 'wave' || p.action === 'dance' ? p.action : 'none',
        avatar: p.avatar,
        lastSeenAt: Date.now(),
      });
    }
    if (body.reset === true) {
      serverObjects = [...DEFAULT_ROOM_OBJECTS];
      serverProjects = [...DEFAULT_PROJECT_LINKS];
      serverPets = [...DEFAULT_ROOM_PETS];
      serverInventory = [...DEFAULT_INVENTORY_ITEMS];
      serverSettings = { ...DEFAULT_ROOM_SETTINGS };
      hasCustomState = false;
      updatedAt = Date.now();
    }
    return NextResponse.json({
      ok: true,
      objects: serverObjects,
      projects: serverProjects,
      pets: serverPets,
      inventory: serverInventory,
      settings: serverSettings,
      chatLog: serverChatLog.slice(-12),
      players: getActiveServerPlayers(),
      hasCustomState,
      updatedAt,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
