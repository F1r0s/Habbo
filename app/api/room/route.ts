import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_ROOM_OBJECTS,
    DEFAULT_PROJECT_LINKS,
    DEFAULT_ROOM_PETS,
    DEFAULT_INVENTORY_ITEMS,
    DEFAULT_ROOM_SETTINGS,
    DEFAULT_YOUTUBE_VIDEO_URL,
    RoomObject,
    ProjectLink,
    RoomPet,
    InventoryItem,
    RoomSettings,
    ChatBubble,
    RoomPlayerPresence,
    TvPlaybackSyncState,
    sanitizeRoomSettings,
    isWallPosterType,
    isDrinkDispenserType,
  } from '@/lib/room-engine';

  export const dynamic = 'force-dynamic';

  // Server-side store so any visitor entering the website sees the same TV, video, wall/floor settings, multiplayer avatars, and chat
  let serverObjects: RoomObject[] = [...DEFAULT_ROOM_OBJECTS];
  let serverProjects: ProjectLink[] = [...DEFAULT_PROJECT_LINKS];
  let serverPets: RoomPet[] = [...DEFAULT_ROOM_PETS];
  let serverInventory: InventoryItem[] = [...DEFAULT_INVENTORY_ITEMS];
  let serverSettings: RoomSettings = { ...DEFAULT_ROOM_SETTINGS };
  let serverChatLog: ChatBubble[] = [];
  const serverPlayers = new Map<string, RoomPlayerPresence>();
  let serverTvSync: TvPlaybackSyncState = {
    videoUrl: DEFAULT_YOUTUBE_VIDEO_URL,
    isPlaying: true,
    seekOffsetSec: 0,
    startedAtServerMs: Date.now(),
    updatedAt: Date.now(),
  };
  let hasCustomState = false;
  let updatedAt = Date.now();
  let hasInitializedPosters = false;
  let hasLoadedFromDisk = false;

  const PERSIST_FILE_PATH = path.join(
    process.cwd(),
    '.habbofolio-room-state.json'
  );

  function loadStateFromDiskOnce() {
    if (hasLoadedFromDisk) return;
    hasLoadedFromDisk = true;
    try {
      if (fs.existsSync(PERSIST_FILE_PATH)) {
        const raw = fs.readFileSync(PERSIST_FILE_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.objects) && parsed.objects.length > 0) {
            serverObjects = parsed.objects;
            hasCustomState = true;
          }
          if (Array.isArray(parsed.projects) && parsed.projects.length > 0) {
            serverProjects = parsed.projects;
          }
          if (Array.isArray(parsed.pets)) {
            serverPets = parsed.pets;
          }
          if (Array.isArray(parsed.inventory)) {
            serverInventory = parsed.inventory;
          }
          if (parsed.settings && typeof parsed.settings === 'object') {
            serverSettings = sanitizeRoomSettings(parsed.settings);
            hasCustomState = true;
          }
          if (typeof parsed.updatedAt === 'number') {
            updatedAt = parsed.updatedAt;
          }
        }
      }
    } catch {
      // Ignore disk read errors in read-only cloud environments
    }
  }

  function saveStateToDisk() {
    try {
      fs.writeFileSync(
        PERSIST_FILE_PATH,
        JSON.stringify(
          {
            objects: serverObjects,
            projects: serverProjects,
            pets: serverPets,
            inventory: serverInventory,
            settings: serverSettings,
            updatedAt,
          },
          null,
          2
        ),
        'utf8'
      );
    } catch {
      // Ignore disk write errors in read-only cloud environments
    }
  }

  function pruneStalePlayers() {
    const now = Date.now();
    for (const [id, p] of serverPlayers.entries()) {
      if (now - p.lastSeenAt > 16000) {
        serverPlayers.delete(id);
      }
    }
  }

  export async function GET() {
    loadStateFromDiskOnce();
    if (!hasInitializedPosters) {
      hasInitializedPosters = true;
      const hasAnyPoster = serverObjects.some((o) => isWallPosterType(o.type));
      if (!hasAnyPoster) {
        const defaultPosters = DEFAULT_ROOM_OBJECTS.filter((o) =>
          isWallPosterType(o.type)
        );
        serverObjects = [...serverObjects, ...defaultPosters];
      }
      const hasAnyDispenser = serverObjects.some((o) =>
        Boolean(isDrinkDispenserType(o.type))
      );
      if (!hasAnyDispenser) {
        const defaultDispensers = DEFAULT_ROOM_OBJECTS.filter((o) =>
          Boolean(isDrinkDispenserType(o.type))
        );
        serverObjects = [...serverObjects, ...defaultDispensers];
      }
    }
    pruneStalePlayers();
    return NextResponse.json({
      objects: serverObjects,
      projects: serverProjects,
      pets: serverPets,
      inventory: serverInventory,
      settings: serverSettings,
      chatLog: serverChatLog.slice(-15),
      players: Array.from(serverPlayers.values()),
      tvSync: serverTvSync,
      serverNow: Date.now(),
      hasCustomState,
      updatedAt,
    });
}

export async function POST(req: NextRequest) {
  try {
    loadStateFromDiskOnce();
    const body = await req.json();
    let didMutateRoom = false;
    const nextStamp = Math.max(
      Date.now(),
      updatedAt + 1,
      typeof body.clientUpdatedAt === 'number' ? body.clientUpdatedAt : 0
    );
    if (Array.isArray(body.objects)) {
      serverObjects = body.objects;
      hasCustomState = true;
      updatedAt = nextStamp;
      didMutateRoom = true;
      const tvObj = serverObjects.find((o) => o.type === 'youtube_tv');
      if (tvObj?.videoUrl && tvObj.videoUrl !== serverTvSync.videoUrl) {
        serverTvSync = {
          videoUrl: tvObj.videoUrl,
          isPlaying: true,
          seekOffsetSec: 0,
          startedAtServerMs: Date.now(),
          updatedAt: Date.now(),
        };
      }
    }
    if (Array.isArray(body.projects)) {
      serverProjects = body.projects;
      hasCustomState = true;
      updatedAt = nextStamp;
      didMutateRoom = true;
    }
    if (Array.isArray(body.pets)) {
      serverPets = body.pets;
      hasCustomState = true;
      updatedAt = nextStamp;
      didMutateRoom = true;
    }
    if (Array.isArray(body.inventory)) {
      serverInventory = body.inventory;
      hasCustomState = true;
      updatedAt = nextStamp;
      didMutateRoom = true;
    }
    if (body.settings && typeof body.settings === 'object') {
      serverSettings = sanitizeRoomSettings({
        ...serverSettings,
        ...body.settings,
      });
      hasCustomState = true;
      updatedAt = nextStamp;
      didMutateRoom = true;
    }
    if (body.playerPresence && typeof body.playerPresence.id === 'string') {
          const p = body.playerPresence as RoomPlayerPresence;
          serverPlayers.set(p.id, {
            ...p,
            lastSeenAt: Date.now(),
          });
        }
        if (typeof body.leavePlayerId === 'string') {
          serverPlayers.delete(body.leavePlayerId);
        }
        if (body.tvSync && typeof body.tvSync === 'object') {
          const nextUrl =
            typeof body.tvSync.videoUrl === 'string' &&
            body.tvSync.videoUrl.trim().length > 0
              ? body.tvSync.videoUrl.trim()
              : serverTvSync.videoUrl;
          const nextPlaying =
            typeof body.tvSync.isPlaying === 'boolean'
              ? body.tvSync.isPlaying
              : serverTvSync.isPlaying;
          const nextSeek =
            typeof body.tvSync.seekOffsetSec === 'number'
              ? Math.max(0, body.tvSync.seekOffsetSec)
              : serverTvSync.seekOffsetSec;
          serverTvSync = {
            videoUrl: nextUrl,
            isPlaying: nextPlaying,
            seekOffsetSec: nextSeek,
            startedAtServerMs: Date.now(),
            updatedAt: Date.now(),
          };
        }
        if (body.chatBubble && typeof body.chatBubble.text === 'string') {
          const bubble: ChatBubble = {
            id:
              body.chatBubble.id ||
              `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            speaker: String(body.chatBubble.speaker || 'Guest').slice(0, 28),
            speakerId:
              typeof body.chatBubble.speakerId === 'string'
                ? body.chatBubble.speakerId
                : undefined,
            speakerTile:
              body.chatBubble.speakerTile &&
              typeof body.chatBubble.speakerTile.x === 'number'
                ? body.chatBubble.speakerTile
                : undefined,
            speakerType: body.chatBubble.speakerType || 'avatar',
            text: String(body.chatBubble.text).trim().slice(0, 140),
            isShout: Boolean(body.chatBubble.isShout),
            offsetY: 0,
            createdAt: Date.now(),
          };
          serverChatLog = [...serverChatLog.slice(-15), bubble];
        }
        pruneStalePlayers();
    if (body.reset === true) {
      serverObjects = [...DEFAULT_ROOM_OBJECTS];
      serverProjects = [...DEFAULT_PROJECT_LINKS];
      serverPets = [...DEFAULT_ROOM_PETS];
      serverInventory = [...DEFAULT_INVENTORY_ITEMS];
      serverSettings = { ...DEFAULT_ROOM_SETTINGS };
      hasCustomState = false;
      updatedAt = nextStamp;
      didMutateRoom = true;
    }
    if (didMutateRoom) {
      saveStateToDisk();
    }
    return NextResponse.json({
          ok: true,
          objects: serverObjects,
          projects: serverProjects,
          pets: serverPets,
          inventory: serverInventory,
          settings: serverSettings,
          chatLog: serverChatLog.slice(-15),
          players: Array.from(serverPlayers.values()),
          tvSync: serverTvSync,
          serverNow: Date.now(),
          hasCustomState,
          updatedAt,
        });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
