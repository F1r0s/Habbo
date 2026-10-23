'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DEFAULT_ROOM_OBJECTS,
  ORGANIZED_ROOM_OBJECTS,
  DEFAULT_PROJECT_LINKS,
  DEFAULT_ROOM_PETS,
  DEFAULT_INVENTORY_ITEMS,
  DEFAULT_ROOM_SETTINGS,
  INITIAL_CHAT_BUBBLES,
  RoomObject,
  RoomPet,
  ProjectLink,
  ChatBubble,
  RoomObjectType,
  IsometricRotation,
  PlacementMode,
  InventoryItem,
  InventoryStackLayer,
    RoomSettings,
    HeldDrinkType,
    RoomPlayerPresence,
    TvPlaybackSyncState,
    DEFAULT_YOUTUBE_VIDEO_URL,
    sanitizeRoomSettings,
    resolveStaircaseTargetFloor,
    toggleManualFloorTile,
    generateFloorDeckForStaircase,
    pruneStalePlayers,
    isWallPosterType,
    isDrinkDispenserType,
    getNextStackHeightAtTile,
  filterActiveChatBubbles,
  applyTilePlacement,
  moveRoomObjectToTile,
  getNextRotation,
  removeRoomPet,
  VisitorAvatarProfile,
  generateRandomVisitorAvatar,
  updateRoomObjectVideoUrl,
  updateRoomObjectTransform,
  addOrRestockInventoryItem,
  removeInventoryItemById,
  returnRoomObjectToInventory,
  applyInventoryStackAtTile,
  clampObjectScale,
  normalizeRotationAngle,
  angleToIsometricRotation,
  rotationToAngle,
} from './room-engine';

const STORAGE_KEY_OBJECTS = 'habbofolio_room_objects_v7';
const STORAGE_KEY_PROJECTS = 'habbofolio_project_links_v2';
const STORAGE_KEY_PETS = 'habbofolio_room_pets_v1';
const STORAGE_KEY_INVENTORY = 'habbofolio_inventory_items_v4';
const STORAGE_KEY_INVENTORY_STACK = 'habbofolio_inventory_stack_v1';
const STORAGE_KEY_ROOM_SETTINGS = 'habbofolio_room_settings_v1';
const STORAGE_KEY_CUSTOM_BGM = 'habbofolio_custom_bgm_v1';
const STORAGE_KEY_ADMIN_AUTH = 'habbofolio_admin_auth_v1';
const STORAGE_KEY_VISITOR_AVATAR = 'habbofolio_visitor_avatar_v1';

// Authentic Open-Hotel Audio + Web Audio Ambient Lounge Music Engine
class PixelAudioEngine {
  private ctx: AudioContext | null = null;
  private musicTimer: number | null = null;
  private stepIdx: number = 0;
  private customBgmUrl: string | null = null;
  private customBgmAudio: HTMLAudioElement | null = null;
  public muted: boolean = false;
  public musicPlaying: boolean = false;

  private audioCache: Record<string, HTMLAudioElement> = {};

  setCustomBgmUrl(url: string | null) {
    this.customBgmUrl = url;
    if (this.customBgmAudio) {
      this.customBgmAudio.pause();
      this.customBgmAudio = null;
    }
    if (this.musicPlaying && !this.muted) {
      this.stopAmbientMusic();
      this.startAmbientMusic();
    }
  }

  private getCtx(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playMp3(path: string, volume: number = 0.35) {
    if (this.muted || typeof window === 'undefined') return;
    try {
      let base = this.audioCache[path];
      if (!base) {
        base = new Audio(path);
        this.audioCache[path] = base;
      }
      const clone = base.cloneNode() as HTMLAudioElement;
      clone.volume = volume;
      clone.play().catch(() => {});
    } catch {
      // fallback to synth if blocked
    }
  }

  // Auto-start ambient music on first user gesture if not muted
  ensureAmbientMusicStarted() {
    if (this.muted || this.musicPlaying) return;
    this.startAmbientMusic();
  }

  startAmbientMusic() {
    if (typeof window === 'undefined') return;
    this.musicPlaying = true;

    // If Admin uploaded a custom audio track (.mp3/.wav), play that directly in a loop!
    if (this.customBgmUrl) {
      try {
        if (!this.customBgmAudio) {
          this.customBgmAudio = new Audio(this.customBgmUrl);
          this.customBgmAudio.loop = true;
          this.customBgmAudio.volume = 0.45;
        }
        this.customBgmAudio.play().catch(() => {});
        return;
      } catch {
        // Fallback to synth beat if custom audio fails
      }
    }

    if (this.musicTimer !== null) return;

    // Chill Melancholic Fingerpicked Guitar Arpeggio + Deep 808 Trap Beat (inspired by uploaded instrumental)
    const progression = [
      // Cm9
      { sub808: 65.41, guitarArp: [261.63, 311.13, 392.0, 466.16, 587.33, 466.16, 392.0, 311.13] },
      // Abmaj7
      { sub808: 51.91, guitarArp: [207.65, 261.63, 311.13, 392.0, 523.25, 392.0, 311.13, 261.63] },
      // Fm9
      { sub808: 43.65, guitarArp: [174.61, 207.65, 261.63, 311.13, 392.0, 311.13, 261.63, 207.65] },
      // G7sus4 -> G7b9
      { sub808: 49.0, guitarArp: [196.0, 246.94, 293.66, 349.23, 415.3, 349.23, 293.66, 246.94] },
    ];

    const playTick = () => {
      if (this.muted || !this.musicPlaying) return;
      const ctx = this.getCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      const bar = Math.floor(this.stepIdx / 8) % progression.length;
      const step = this.stepIdx % 8;
      const cycleBar = Math.floor(this.stepIdx / 8);
      const harmony = progression[bar];
      // Alternating pure guitar/pad instrumental sections (0:00-0:28 & 3:37-4:14 vibe) with gentle 808 pulse — 100% instrumental (no vocals)
      const drumsActive = cycleBar % 6 >= 2 && cycleBar % 6 <= 4;

      // 1. Warm Plucked Acoustic/Electric Guitar Arpeggio on every step (Original Instrumental by Higma)
      const gFreq = harmony.guitarArp[step % harmony.guitarArp.length];
      const gOsc = ctx.createOscillator();
      const gOsc2 = ctx.createOscillator();
      const gGain = ctx.createGain();
      gOsc.type = 'triangle';
      gOsc2.type = 'sine';
      gOsc.frequency.setValueAtTime(gFreq, now);
      gOsc2.frequency.setValueAtTime(gFreq * 1.5, now);
      gGain.gain.setValueAtTime(0.032, now);
      gGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.52);
      gOsc.connect(gGain);
      gOsc2.connect(gGain);
      gGain.connect(ctx.destination);
      gOsc.start(now);
      gOsc2.start(now);
      gOsc.stop(now + 0.55);
      gOsc2.stop(now + 0.55);

      // Warm ambient pad chord swell on step 0 of each bar (like the 3:40 outro pad)
      if (step === 0) {
        const padOsc = ctx.createOscillator();
        const padGain = ctx.createGain();
        padOsc.type = 'sine';
        padOsc.frequency.setValueAtTime(harmony.sub808 * 2, now);
        padGain.gain.setValueAtTime(0.022, now);
        padGain.gain.exponentialRampToValueAtTime(0.0008, now + 1.6);
        padOsc.connect(padGain);
        padGain.connect(ctx.destination);
        padOsc.start(now);
        padOsc.stop(now + 1.65);
      }

      if (drumsActive) {
        // 2. Deep 808 Sub-Bass + Kick Punch on steps 0, 3, 6
        if (step === 0 || step === 3 || step === 6) {
          const kickOsc = ctx.createOscillator();
          const kickGain = ctx.createGain();
          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(120, now);
          kickOsc.frequency.exponentialRampToValueAtTime(harmony.sub808, now + 0.065);
          kickGain.gain.setValueAtTime(0.065, now);
          kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          kickOsc.connect(kickGain);
          kickGain.connect(ctx.destination);
          kickOsc.start(now);
          kickOsc.stop(now + 0.47);
        }

        // 3. Crisp Trap Snare / Clap on backbeats (steps 2 and 6)
        if (step === 2 || step === 6) {
          const snOsc = ctx.createOscillator();
          const snGain = ctx.createGain();
          snOsc.type = 'triangle';
          snOsc.frequency.setValueAtTime(210, now);
          snOsc.frequency.exponentialRampToValueAtTime(110, now + 0.07);
          snGain.gain.setValueAtTime(0.032, now);
          snGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
          snOsc.connect(snGain);
          snGain.connect(ctx.destination);
          snOsc.start(now);
          snOsc.stop(now + 0.1);
        }

        // 4. Metallic Hi-Hat Ticks + Double-Time Trap Roll on step 7
        const hatCount = step === 7 ? 3 : 1;
        for (let h = 0; h < hatCount; h++) {
          const hTime = now + h * 0.07;
          const hatOsc = ctx.createOscillator();
          const hatGain = ctx.createGain();
          hatOsc.type = 'square';
          hatOsc.frequency.setValueAtTime(6400 + h * 600, hTime);
          hatGain.gain.setValueAtTime(0.006, hTime);
          hatGain.gain.exponentialRampToValueAtTime(0.0005, hTime + 0.03);
          hatOsc.connect(hatGain);
          hatGain.connect(ctx.destination);
          hatOsc.start(hTime);
          hatOsc.stop(hTime + 0.035);
        }
      }

      this.stepIdx += 1;
    };

    playTick();
    this.musicTimer = window.setInterval(playTick, 230);
  }

  stopAmbientMusic() {
    this.musicPlaying = false;
    if (this.customBgmAudio) {
      this.customBgmAudio.pause();
    }
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  playStep() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180 + Math.random() * 35, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(85, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.045, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.045);
  }

  playSitOnSofa() {
    // Authentic open-hotel pixels chime + soft cushion thump
    this.playMp3('/resources/audio/pixels.mp3', 0.35);
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.11);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  playChatPop(isIncoming: boolean = false) {
    this.playMp3(
      isIncoming
        ? '/resources/audio/receive_msg.mp3'
        : '/resources/audio/sent_msg.mp3',
      0.35
    );
    const ctx = this.getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.055);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.065);
  }

  playPlaceObject() {
    this.playMp3('/resources/audio/pixels.mp3', 0.4);
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(330, now);
    osc.frequency.setValueAtTime(494, now + 0.045);
    osc.frequency.setValueAtTime(659, now + 0.09);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playConsoleClick() {
    // Soft, subtle Habbo pixel UI tick (cash_register.mp3 removed)
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.025);
    gain.gain.setValueAtTime(0.015, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  playLinkOpen() {
    this.playMp3('/resources/audio/pixels.mp3', 0.35);
    this.playPlaceObject();
  }
}

export const pixelAudio = new PixelAudioEngine();

export function useRoomStore() {
  const [objects, setObjects] = useState<RoomObject[]>(DEFAULT_ROOM_OBJECTS);
  const [projects, setProjects] = useState<ProjectLink[]>(DEFAULT_PROJECT_LINKS);
  const [pets, setPets] = useState<RoomPet[]>(DEFAULT_ROOM_PETS);
  const [inventory, setInventory] = useState<InventoryItem[]>(
    DEFAULT_INVENTORY_ITEMS
  );
  const [inventoryStack, setInventoryStack] = useState<InventoryStackLayer[]>(
    []
  );
  const [roomSettings, setRoomSettings] = useState<RoomSettings>(
    DEFAULT_ROOM_SETTINGS
  );
  const [chatBubbles, setChatBubbles] = useState<ChatBubble[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatBubble[]>([]);
    const [avatarAction, setAvatarAction] = useState<'none' | 'wave' | 'dance'>(
      'none'
    );
    const [heldDrink, setHeldDrink] = useState<HeldDrinkType>('none');
    const [remotePlayers, setRemotePlayers] = useState<RoomPlayerPresence[]>([]);
    const [tvSync, setTvSync] = useState<TvPlaybackSyncState>({
      videoUrl: DEFAULT_YOUTUBE_VIDEO_URL,
      isPlaying: true,
      seekOffsetSec: 0,
      startedAtServerMs: Date.now(),
      updatedAt: Date.now(),
    });
    const [customBgmUrl, setCustomBgmUrlState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [visitorAvatar, setVisitorAvatar] = useState<VisitorAvatarProfile>(() =>
    generateRandomVisitorAvatar(() => 0.42)
  );
  const [useOwnerSkin, setUseOwnerSkin] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const lastLocalMutationRef = useRef<number>(0);
  const syncPostTimerRef = useRef<number | null>(null);
  const seenChatIdsRef = useRef<Set<string>>(new Set());
  const localPresenceRef = useRef<{
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    facing: IsometricRotation;
    isWalking: boolean;
    isSitting: boolean;
  }>({
    x: 4,
    y: 5,
    targetX: 4,
    targetY: 5,
    facing: 'sw',
    isWalking: false,
    isSitting: false,
  });
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const localCoordsRef = useRef<{
    x: number;
    y: number;
    z: number;
    targetX: number;
    targetY: number;
    facing: IsometricRotation;
    isSitting: boolean;
  }>({
    x: 4,
    y: 5,
    z: 0,
    targetX: 4,
    targetY: 5,
    facing: 'sw',
    isSitting: false,
  });

  useEffect(() => {
    let hasLocalObjects = false;
    try {
      const savedObjs = window.localStorage.getItem(STORAGE_KEY_OBJECTS);
      const savedProjs = window.localStorage.getItem(STORAGE_KEY_PROJECTS);
      const savedPets = window.localStorage.getItem(STORAGE_KEY_PETS);
      const savedInv = window.localStorage.getItem(STORAGE_KEY_INVENTORY);
      const savedStack = window.localStorage.getItem(
        STORAGE_KEY_INVENTORY_STACK
      );
      const savedSettings = window.localStorage.getItem(
        STORAGE_KEY_ROOM_SETTINGS
      );
      const savedAuth = window.localStorage.getItem(STORAGE_KEY_ADMIN_AUTH);
      const savedVisitor = window.sessionStorage.getItem(
        STORAGE_KEY_VISITOR_AVATAR
      );

      if (savedObjs !== null) {
        const parsed = JSON.parse(savedObjs);
        if (Array.isArray(parsed)) {
          setObjects(parsed);
          hasLocalObjects = true;
        }
      }
      if (savedProjs) {
        const parsedProjs = JSON.parse(savedProjs);
        if (Array.isArray(parsedProjs) && parsedProjs.length > 0) {
          setProjects(parsedProjs);
        }
      }
      if (savedPets !== null) {
        const parsedPets = JSON.parse(savedPets);
        if (Array.isArray(parsedPets)) {
          setPets(parsedPets);
        }
      }
      if (savedInv !== null) {
        const parsedInv = JSON.parse(savedInv);
        if (Array.isArray(parsedInv)) {
          setInventory(parsedInv);
        }
      }
      if (savedStack !== null) {
        const parsedStack = JSON.parse(savedStack);
        if (Array.isArray(parsedStack)) {
          setInventoryStack(parsedStack);
        }
      }
      if (savedSettings !== null) {
        const parsedSettings = JSON.parse(savedSettings);
        setRoomSettings(sanitizeRoomSettings(parsedSettings));
      }
      const savedBgm = window.localStorage.getItem(STORAGE_KEY_CUSTOM_BGM);
      if (savedBgm) {
        setCustomBgmUrlState(savedBgm);
        pixelAudio.setCustomBgmUrl(savedBgm);
      }
      if (savedAuth === 'true') {
        setIsAdminAuthenticated(true);
      }

      if (savedVisitor) {
        const parsedVisitor = JSON.parse(savedVisitor);
        if (parsedVisitor && typeof parsedVisitor.name === 'string') {
          setVisitorAvatar(parsedVisitor);
        } else {
          const fresh = generateRandomVisitorAvatar();
          setVisitorAvatar(fresh);
          window.sessionStorage.setItem(
            STORAGE_KEY_VISITOR_AVATAR,
            JSON.stringify(fresh)
          );
        }
      } else {
        const fresh = generateRandomVisitorAvatar();
        setVisitorAvatar(fresh);
        window.sessionStorage.setItem(
          STORAGE_KEY_VISITOR_AVATAR,
          JSON.stringify(fresh)
        );
      }
    } catch {
      // ignore storage errors
    }

    // Fetch shared server state (/api/room) so any new visitor entering the site sees the Admin's TV & video!
    fetch('/api/room')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.hasCustomState || !hasLocalObjects) {
          if (Array.isArray(data.objects)) {
            setObjects(data.objects);
            try {
              window.localStorage.setItem(
                STORAGE_KEY_OBJECTS,
                JSON.stringify(data.objects)
              );
            } catch {}
          }
          if (Array.isArray(data.projects) && data.projects.length > 0) {
            setProjects(data.projects);
          }
          if (Array.isArray(data.pets)) {
            setPets(data.pets);
          }
          if (Array.isArray(data.inventory)) {
            setInventory(data.inventory);
          }
          if (data.settings) {
            setRoomSettings(sanitizeRoomSettings(data.settings));
          }
          if (Array.isArray(data.players)) {
            setRemotePlayers(
              pruneStalePlayers(data.players).filter(
                (p: RoomPlayerPresence) => p.id !== visitorAvatar.id
              )
            );
          }
        } else if (hasLocalObjects && !data.hasCustomState) {
          // Re-seed serverless memory after a Vercel cold start from local custom state
          try {
            const localObjs = JSON.parse(
              window.localStorage.getItem(STORAGE_KEY_OBJECTS) || 'null'
            );
            const localSettings = JSON.parse(
              window.localStorage.getItem(STORAGE_KEY_ROOM_SETTINGS) || 'null'
            );
            if (Array.isArray(localObjs)) {
              fetch('/api/room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  objects: localObjs,
                  settings: localSettings || undefined,
                }),
              }).catch(() => {});
            }
          } catch {}
        }
      })
      .catch(() => {});

    // Seed initial greeting bubbles with fresh timestamps so they animate upward and auto-remove after 4.2s
    const now = Date.now();
    setChatBubbles(
      INITIAL_CHAT_BUBBLES.slice(-2).map((b, idx) => ({
        ...b,
        createdAt: now - (1 - idx) * 600,
      }))
    );
    setIsLoaded(true);
  }, []);

  // Build current local player presence snapshot
  const buildLocalPresence = useCallback(
    (
      overrides?: Partial<{
        x: number;
        y: number;
        z: number;
        targetX: number;
        targetY: number;
        facing: IsometricRotation;
        isSitting: boolean;
        action: 'none' | 'wave' | 'dance';
        name: string;
        isOwner: boolean;
        avatar: VisitorAvatarProfile;
      }>
    ): RoomPlayerPresence => {
      const c = localCoordsRef.current;
      const effAvatar = overrides?.avatar || visitorAvatar;
      const effOwner = overrides?.isOwner ?? useOwnerSkin;
      const effName = overrides?.name || (effOwner ? 'Higma' : effAvatar.name);
      return {
        id: effAvatar.id,
        name: effName,
        isOwner: effOwner,
        x: overrides?.x ?? c.x,
        y: overrides?.y ?? c.y,
        z: overrides?.z ?? c.z,
        targetX: overrides?.targetX ?? c.targetX,
        targetY: overrides?.targetY ?? c.targetY,
        facing: overrides?.facing ?? c.facing,
        isSitting: overrides?.isSitting ?? c.isSitting,
        action: overrides?.action ?? avatarAction,
        heldDrink,
        avatar: effAvatar,
        lastSeenAt: Date.now(),
      };
    },
    [visitorAvatar, useOwnerSkin, avatarAction, heldDrink]
  );

  // Instant 0ms multi-tab BroadcastChannel + beforeunload disconnect beacon
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel('habbofolio_multiplayer_v1');
      broadcastChannelRef.current = bc;
      bc.onmessage = (ev) => {
        const msg = ev.data;
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === 'presence' && msg.player?.id !== visitorAvatar.id) {
          const incoming = msg.player as RoomPlayerPresence;
          setRemotePlayers((prev) => {
            const others = prev.filter((p) => p.id !== incoming.id);
            return pruneStalePlayers([
              ...others,
              { ...incoming, lastSeenAt: Date.now() },
            ]);
          });
        } else if (
          msg.type === 'leave' &&
          typeof msg.playerId === 'string'
        ) {
          setRemotePlayers((prev) =>
            prev.filter((p) => p.id !== msg.playerId)
          );
        } else if (
          msg.type === 'chat' &&
          msg.bubble?.id &&
          !seenChatIdsRef.current.has(msg.bubble.id)
        ) {
          seenChatIdsRef.current.add(msg.bubble.id);
          pixelAudio.playChatPop(false);
          setChatBubbles((prev) => [
            ...prev.slice(-4),
            { ...msg.bubble, createdAt: Date.now() },
          ]);
          setChatHistory((prev) => [...prev.slice(-30), msg.bubble]);
        }
      };
    }

    const handleBeforeUnload = () => {
      try {
        broadcastChannelRef.current?.postMessage({
          type: 'leave',
          playerId: visitorAvatar.id,
        });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            '/api/room',
            JSON.stringify({ leavePlayerId: visitorAvatar.id })
          );
        }
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      broadcastChannelRef.current?.close();
      broadcastChannelRef.current = null;
    };
  }, [visitorAvatar.id]);

  // Multiplayer presence heartbeat & room state sync every 950ms (skips when tab is hidden)
  useEffect(() => {
    if (!isLoaded) return;

    const sendHeartbeatAndSync = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const presence = buildLocalPresence();

      fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerPresence: presence }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) return;

          if (Array.isArray(data.players)) {
            setRemotePlayers(
              pruneStalePlayers(data.players).filter(
                (p: RoomPlayerPresence) => p.id !== visitorAvatar.id
              )
            );
          }
          if (data.tvSync) {
            setTvSync(data.tvSync);
          }
          if (Array.isArray(data.chatLog)) {
            data.chatLog.forEach((remoteBubble: ChatBubble) => {
              if (
                !remoteBubble?.id ||
                seenChatIdsRef.current.has(remoteBubble.id)
              ) {
                return;
              }
              seenChatIdsRef.current.add(remoteBubble.id);
              if (Date.now() - remoteBubble.createdAt < 12000) {
                pixelAudio.playChatPop(true);
                setChatBubbles((prev) => [
                  ...prev.slice(-5),
                  { ...remoteBubble, createdAt: Date.now() },
                ]);
                setChatHistory((prev) => [...prev.slice(-30), remoteBubble]);
              }
            });
          }

          // Never allow an older server snapshot or heartbeat to overwrite newer local edits!
          const serverStamp =
            typeof data.updatedAt === 'number' ? data.updatedAt : 0;
          if (
            !data.hasCustomState ||
            serverStamp <= lastLocalMutationRef.current ||
            Date.now() - lastLocalMutationRef.current < 5000
          ) {
            return;
          }
          lastLocalMutationRef.current = serverStamp;
          if (Array.isArray(data.objects)) {
            setObjects((prev) => {
              const prevJson = JSON.stringify(prev);
              const nextJson = JSON.stringify(data.objects);
              if (prevJson === nextJson) return prev;
              try {
                window.localStorage.setItem(STORAGE_KEY_OBJECTS, nextJson);
              } catch {}
              return data.objects;
            });
          }
          if (Array.isArray(data.pets)) {
            setPets((prev) => {
              const prevJson = JSON.stringify(prev);
              const nextJson = JSON.stringify(data.pets);
              if (prevJson === nextJson) return prev;
              try {
                window.localStorage.setItem(STORAGE_KEY_PETS, nextJson);
              } catch {}
              return data.pets;
            });
          }
          if (data.settings) {
            setRoomSettings((prev) => {
              const nextS = sanitizeRoomSettings(data.settings);
              if (JSON.stringify(prev) === JSON.stringify(nextS)) return prev;
              try {
                window.localStorage.setItem(
                  STORAGE_KEY_ROOM_SETTINGS,
                  JSON.stringify(nextS)
                );
              } catch {}
              return nextS;
            });
          }
          })
        .catch(() => {});
    };

    sendHeartbeatAndSync();
    const syncTimer = window.setInterval(sendHeartbeatAndSync, 950);
    return () => window.clearInterval(syncTimer);
  }, [isLoaded, buildLocalPresence, visitorAvatar.id]);

  // Automatically remove interaction notification bubbles after 4.2 seconds
  useEffect(() => {
    const pruneTimer = window.setInterval(() => {
      const now = Date.now();
      setChatBubbles((prev) => {
        if (prev.length === 0) return prev;
        const active = filterActiveChatBubbles(prev, now, 4200);
        return active.length === prev.length ? prev : active;
      });
    }, 250);
    return () => window.clearInterval(pruneTimer);
  }, []);

  const persistState = useCallback(
    (nextObjects: RoomObject[], nextProjects: ProjectLink[]) => {
      const now = Date.now();
      lastLocalMutationRef.current = now;
      setLastSavedAt(now);
      setIsSaving(true);
      try {
        window.localStorage.setItem(
          STORAGE_KEY_OBJECTS,
          JSON.stringify(nextObjects)
        );
        window.localStorage.setItem(
          STORAGE_KEY_PROJECTS,
          JSON.stringify(nextProjects)
        );
      } catch {
        // ignore
      }
      if (syncPostTimerRef.current !== null) {
        window.clearTimeout(syncPostTimerRef.current);
      }
      syncPostTimerRef.current = window.setTimeout(() => {
        const stamp = Date.now();
        lastLocalMutationRef.current = stamp;
        fetch('/api/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            objects: nextObjects,
            projects: nextProjects,
            clientUpdatedAt: stamp,
          }),
        })
          .catch(() => {})
          .finally(() => {
            setIsSaving(false);
            setLastSavedAt(Date.now());
          });
      }, 60);
    },
    []
  );

  const persistInventory = useCallback((nextInventory: InventoryItem[]) => {
    const now = Date.now();
    lastLocalMutationRef.current = now;
    setLastSavedAt(now);
    setIsSaving(true);
    try {
      window.localStorage.setItem(
        STORAGE_KEY_INVENTORY,
        JSON.stringify(nextInventory)
      );
    } catch {
      // ignore
    }
    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventory: nextInventory }),
    })
      .catch(() => {})
      .finally(() => {
        setIsSaving(false);
        setLastSavedAt(Date.now());
      });
  }, []);

  const persistInventoryStack = useCallback(
    (nextStack: InventoryStackLayer[]) => {
      try {
        window.localStorage.setItem(
          STORAGE_KEY_INVENTORY_STACK,
          JSON.stringify(nextStack)
        );
      } catch {
        // ignore
      }
    },
    []
  );

  const persistPets = useCallback((nextPets: RoomPet[]) => {
    try {
      window.localStorage.setItem(STORAGE_KEY_PETS, JSON.stringify(nextPets));
    } catch {
      // ignore
    }
    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pets: nextPets }),
    }).catch(() => {});
  }, []);

  const updateRoomSettings = useCallback(
    (patch: Partial<RoomSettings>) => {
      const now = Date.now();
      lastLocalMutationRef.current = now;
      setLastSavedAt(now);
      setIsSaving(true);
      setRoomSettings((prev) => {
        const next = sanitizeRoomSettings({ ...prev, ...patch });
        try {
          window.localStorage.setItem(
            STORAGE_KEY_ROOM_SETTINGS,
            JSON.stringify(next)
          );
        } catch {}
        try {
          broadcastChannelRef.current?.postMessage({
            type: 'settings',
            settings: next,
          });
        } catch {}
        fetch('/api/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: next, clientUpdatedAt: now }),
        })
          .catch(() => {})
          .finally(() => {
            lastLocalMutationRef.current = Math.max(
              lastLocalMutationRef.current,
              Date.now()
            );
            setIsSaving(false);
            setLastSavedAt(Date.now());
          });
        return next;
      });
    },
    []
  );

  const paintManualFloorTile = useCallback(
    (
      x: number,
      y: number,
      z: number,
      mode: 'add' | 'remove',
      color?: string
    ) => {
      const now = Date.now();
      lastLocalMutationRef.current = now;
      setLastSavedAt(now);
      setRoomSettings((prev) => {
        const next = toggleManualFloorTile(prev, x, y, z, mode, color);
        try {
          window.localStorage.setItem(
            STORAGE_KEY_ROOM_SETTINGS,
            JSON.stringify(next)
          );
        } catch {}
        fetch('/api/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: next, clientUpdatedAt: now }),
        }).catch(() => {});
        return next;
      });
      pixelAudio.playPlaceObject();
    },
    []
  );

  const addObject = useCallback(
    (
      input: {
        type: RoomObjectType;
        label: string;
        x: number;
        y: number;
        z?: number;
        rotation?: IsometricRotation;
        rotationAngle?: number;
        scale?: number;
        colorVariant?: string;
        projectId?: string;
        videoUrl?: string;
        imageUrl?: string;
        customNote?: string;
        consumeInventoryItemId?: string;
      },
      mode: PlacementMode = 'replace'
    ) => {
      const { objects: next, placed } = applyTilePlacement(
        objects,
        {
          id: `obj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: input.type,
          label: input.label.trim(),
          x: input.x,
          y: input.y,
          z: input.z,
          rotation: input.rotation || 'se',
          rotationAngle: input.rotationAngle,
          scale: input.scale,
          colorVariant: input.colorVariant,
          projectId: input.projectId,
          videoUrl: input.videoUrl,
          imageUrl: input.imageUrl,
          customNote: input.customNote,
        },
        mode
      );

      setObjects(next);
      persistState(next, projects);

      // If placing a staircase (up or down), automatically build a walkable landing floor deck at that elevation!
      if (placed.type === 'stairs_up' || placed.type === 'stairs_down') {
        setRoomSettings((prev) => {
          const withDeck = generateFloorDeckForStaircase(placed, prev);
          try {
            window.localStorage.setItem(
              STORAGE_KEY_ROOM_SETTINGS,
              JSON.stringify(withDeck)
            );
          } catch {}
          fetch('/api/room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: withDeck }),
          }).catch(() => {});
          return withDeck;
        });
      }

      pixelAudio.playPlaceObject();
      return placed;
    },
    [objects, projects, persistState]
  );

  const updateObjectVideoUrl = useCallback(
    (targetObjectId: string, rawVideoUrl: string) => {
      const next = updateRoomObjectVideoUrl(
        objects,
        targetObjectId,
        rawVideoUrl
      );
      setObjects(next);
      persistState(next, projects);
      pixelAudio.playPlaceObject();
      return next !== objects;
    },
    [objects, projects, persistState]
  );

  const broadcastLocalMove = useCallback(
    (update: {
      x: number;
      y: number;
      z?: number;
      targetX: number;
      targetY: number;
      facing: IsometricRotation;
      isSitting?: boolean;
      action?: 'none' | 'wave' | 'dance';
    }) => {
      localCoordsRef.current = {
        x: update.x,
        y: update.y,
        z: typeof update.z === 'number' ? update.z : localCoordsRef.current.z,
        targetX: update.targetX,
        targetY: update.targetY,
        facing: update.facing,
        isSitting: Boolean(update.isSitting),
      };
      const presence = buildLocalPresence({
        x: update.x,
        y: update.y,
        z: localCoordsRef.current.z,
        targetX: update.targetX,
        targetY: update.targetY,
        facing: update.facing,
        isSitting: Boolean(update.isSitting),
        action: update.action,
      });
      try {
        broadcastChannelRef.current?.postMessage({
          type: 'presence',
          player: presence,
        });
      } catch {}
      fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerPresence: presence }),
      }).catch(() => {});
    },
    [buildLocalPresence]
  );

  const randomizeVisitorAvatar = useCallback(() => {
    const fresh = generateRandomVisitorAvatar();
    // Keep same visitor session id so remote clients don't duplicate the avatar
    const updatedAvatar: VisitorAvatarProfile = {
      ...fresh,
      id: visitorAvatar.id,
      name: visitorAvatar.name.startsWith('PixelGuest') ||
        visitorAvatar.name.startsWith('HabboVoyager') ||
        visitorAvatar.name.startsWith('RetroNomad') ||
        visitorAvatar.name.startsWith('ClubWalker') ||
        visitorAvatar.name.startsWith('VoxelExplorer') ||
        visitorAvatar.name.startsWith('LoungeVisitor') ||
        visitorAvatar.name.startsWith('NeonCitizen') ||
        visitorAvatar.name.startsWith('IsoTraveler')
        ? fresh.name
        : visitorAvatar.name,
    };
    setVisitorAvatar(updatedAvatar);
    setUseOwnerSkin(false);
    try {
      window.sessionStorage.setItem(
        STORAGE_KEY_VISITOR_AVATAR,
        JSON.stringify(updatedAvatar)
      );
    } catch {}
    const presence = buildLocalPresence({
      avatar: updatedAvatar,
      isOwner: false,
      name: updatedAvatar.name,
    });
    try {
      broadcastChannelRef.current?.postMessage({
        type: 'presence',
        player: presence,
      });
    } catch {}
    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerPresence: presence }),
    }).catch(() => {});
    pixelAudio.playPlaceObject();
    return updatedAvatar;
  }, [visitorAvatar.id, visitorAvatar.name, buildLocalPresence]);

  const toggleOwnerSkin = useCallback(() => {
    setUseOwnerSkin((prev) => {
      const next = !prev;
      const presence = buildLocalPresence({
        isOwner: next,
        name: next ? 'Higma' : visitorAvatar.name,
      });
      try {
        broadcastChannelRef.current?.postMessage({
          type: 'presence',
          player: presence,
        });
      } catch {}
      fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerPresence: presence }),
      }).catch(() => {});
      return next;
    });
    pixelAudio.playConsoleClick();
  }, [buildLocalPresence, visitorAvatar.name]);

  const updateVisitorUsername = useCallback(
    (newName: string) => {
      const cleaned = newName.trim().slice(0, 22);
      if (!cleaned) return;
      const updated = { ...visitorAvatar, name: cleaned };
      setVisitorAvatar(updated);
      try {
        window.sessionStorage.setItem(
          STORAGE_KEY_VISITOR_AVATAR,
          JSON.stringify(updated)
        );
      } catch {}
      setUseOwnerSkin(false);
      const presence = buildLocalPresence({
        avatar: updated,
        name: cleaned,
        isOwner: false,
      });
      try {
        broadcastChannelRef.current?.postMessage({
          type: 'presence',
          player: presence,
        });
      } catch {}
      fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerPresence: presence }),
      }).catch(() => {});
      pixelAudio.playConsoleClick();
    },
    [visitorAvatar, buildLocalPresence]
  );

  const triggerAvatarAction = useCallback(
    (action: 'none' | 'wave' | 'dance') => {
      setAvatarAction((prev) => {
        const next = prev === action && action === 'dance' ? 'none' : action;
        const presence = buildLocalPresence({ action: next });
        try {
          broadcastChannelRef.current?.postMessage({
            type: 'presence',
            player: presence,
          });
        } catch {}
        fetch('/api/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerPresence: presence }),
        }).catch(() => {});
        return next;
      });
      pixelAudio.playPlaceObject();
      if (action === 'wave') {
        window.setTimeout(() => {
          setAvatarAction((cur) => (cur === 'wave' ? 'none' : cur));
        }, 2400);
      }
    },
    [buildLocalPresence]
  );

  const takeDrinkFromDispenser = useCallback(
    (drink: HeldDrinkType) => {
      setHeldDrink(drink);
      const presence = {
        ...buildLocalPresence(),
        heldDrink: drink,
      };
      try {
        broadcastChannelRef.current?.postMessage({
          type: 'presence',
          player: presence,
        });
      } catch {}
      fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerPresence: presence }),
      }).catch(() => {});
      pixelAudio.playPlaceObject();
    },
    [buildLocalPresence]
  );

  const reportLocalAvatarMotion = useCallback(
    (x: number, y: number) => {
      localPresenceRef.current.x = x;
      localPresenceRef.current.y = y;
      localCoordsRef.current.x = x;
      localCoordsRef.current.y = y;
    },
    []
  );

  const updateTvPlaybackSync = useCallback(
    (patch: Partial<TvPlaybackSyncState>) => {
      setTvSync((prev) => {
        const next: TvPlaybackSyncState = {
          ...prev,
          ...patch,
          startedAtServerMs: Date.now(),
          updatedAt: Date.now(),
        };
        try {
          broadcastChannelRef.current?.postMessage({
            type: 'tvSync',
            tvSync: next,
          });
        } catch {}
        fetch('/api/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tvSync: next }),
        }).catch(() => {});
        return next;
      });
    },
    []
  );

  const setCustomBgmAudio = useCallback((url: string | null) => {
    setCustomBgmUrlState(url);
    pixelAudio.setCustomBgmUrl(url);
    try {
      if (url) {
        window.localStorage.setItem(STORAGE_KEY_CUSTOM_BGM, url);
      } else {
        window.localStorage.removeItem(STORAGE_KEY_CUSTOM_BGM);
      }
    } catch {}
  }, []);

  const moveObject = useCallback(
    (
      id: string,
      targetX: number,
      targetY: number,
      mode: PlacementMode = 'replace'
    ) => {
      const next = moveRoomObjectToTile(objects, id, targetX, targetY, mode);
      setObjects(next);
      persistState(next, projects);
      pixelAudio.playPlaceObject();
    },
    [objects, projects, persistState]
  );

  const clearTile = useCallback(
    (x: number, y: number) => {
      const next = objects.filter((o) => o.x !== x || o.y !== y);
      setObjects(next);
      persistState(next, projects);
      pixelAudio.playConsoleClick();
    },
    [objects, projects, persistState]
  );

  const removeObject = useCallback(
    (id: string) => {
      const next = objects.filter((o) => o.id !== id);
      setObjects(next);
      persistState(next, projects);
      pixelAudio.playConsoleClick();
    },
    [objects, projects, persistState]
  );

  const updateObjectZ = useCallback(
    (id: string, deltaZ: number) => {
      const next = objects.map((o) => {
        if (o.id !== id) return o;
        const nextZ = Math.max(0, Math.min(6, o.z + deltaZ));
        return { ...o, z: nextZ };
      });
      setObjects(next);
      persistState(next, projects);
      pixelAudio.playConsoleClick();
    },
    [objects, projects, persistState]
  );

  const rotateObject = useCallback(
    (id: string, step: 1 | -1 = 1) => {
      const next = objects.map((o) => {
        if (o.id !== id) return o;
        const nextRot = getNextRotation(o.rotation, step);
        return {
          ...o,
          rotation: nextRot,
          rotationAngle: rotationToAngle(nextRot),
        };
      });
      setObjects(next);
      persistState(next, projects);
      pixelAudio.playConsoleClick();
    },
    [objects, projects, persistState]
  );

  const updateObjectTransform = useCallback(
    (
      id: string,
      transform: {
        scale?: number;
        rotation?: IsometricRotation;
        rotationAngle?: number;
        colorVariant?: string;
        imageUrl?: string;
        label?: string;
      }
    ) => {
      setObjects((prev) => {
        const next = updateRoomObjectTransform(prev, id, transform);
        persistState(next, projects);
        return next;
      });
    },
    [projects, persistState]
  );

  const addInventoryItem = useCallback(
    (input: {
      type: RoomObjectType;
      label?: string;
      colorVariant?: string;
      quantity?: number;
      defaultScale?: number;
      defaultRotation?: IsometricRotation;
      defaultRotationAngle?: number;
      projectId?: string;
      videoUrl?: string;
    }) => {
      setInventory((prev) => {
        const next = addOrRestockInventoryItem(prev, input);
        persistInventory(next);
        return next;
      });
      pixelAudio.playConsoleClick();
    },
    [persistInventory]
  );

  const removeInventoryItem = useCallback(
    (itemId: string, decrementBy: number = 1) => {
      setInventory((prev) => {
        const next = removeInventoryItemById(prev, itemId, decrementBy);
        persistInventory(next);
        return next;
      });
      pixelAudio.playConsoleClick();
    },
    [persistInventory]
  );

  const updateInventoryItemTransform = useCallback(
    (
      itemId: string,
      patch: {
        defaultScale?: number;
        defaultRotation?: IsometricRotation;
        defaultRotationAngle?: number;
        colorVariant?: string;
      }
    ) => {
      setInventory((prev) => {
        const next = prev.map((item) => {
          if (item.id !== itemId) return item;
          let nextRot = item.defaultRotation;
          let nextAngle = item.defaultRotationAngle;
          if (typeof patch.defaultRotationAngle === 'number') {
            nextAngle = normalizeRotationAngle(
              patch.defaultRotationAngle,
              item.defaultRotation
            );
            nextRot =
              patch.defaultRotation || angleToIsometricRotation(nextAngle);
          } else if (patch.defaultRotation) {
            nextRot = patch.defaultRotation;
            nextAngle = rotationToAngle(patch.defaultRotation);
          }
          return {
            ...item,
            defaultScale:
              typeof patch.defaultScale === 'number'
                ? clampObjectScale(patch.defaultScale)
                : item.defaultScale,
            defaultRotation: nextRot,
            defaultRotationAngle: nextAngle,
            colorVariant: patch.colorVariant ?? item.colorVariant,
          };
        });
        persistInventory(next);
        return next;
      });
    },
    [persistInventory]
  );

  const pickupObjectToInventory = useCallback(
    (objectId: string) => {
      const target = objects.find((o) => o.id === objectId);
      if (!target) return;
      const nextObjects = objects.filter((o) => o.id !== objectId);
      setObjects(nextObjects);
      persistState(nextObjects, projects);

      setInventory((prev) => {
        const nextInv = returnRoomObjectToInventory(prev, target);
        persistInventory(nextInv);
        return nextInv;
      });
      pixelAudio.playConsoleClick();
    },
    [objects, projects, persistState, persistInventory]
  );

  const pushToInventoryStack = useCallback(
    (layerInput: Omit<InventoryStackLayer, 'id'>) => {
      setInventoryStack((prev) => {
        if (prev.length >= 6) return prev;
        const layer: InventoryStackLayer = {
          ...layerInput,
          id: `stack-layer-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          scale: clampObjectScale(layerInput.scale),
          rotationAngle: normalizeRotationAngle(
            layerInput.rotationAngle,
            layerInput.rotation
          ),
        };
        const next = [...prev, layer];
        persistInventoryStack(next);
        return next;
      });
      pixelAudio.playConsoleClick();
    },
    [persistInventoryStack]
  );

  const updateInventoryStackLayer = useCallback(
    (
      layerId: string,
      patch: Partial<Omit<InventoryStackLayer, 'id'>>
    ) => {
      setInventoryStack((prev) => {
        const next = prev.map((layer) => {
          if (layer.id !== layerId) return layer;
          let nextRot = layer.rotation;
          let nextAngle = layer.rotationAngle;
          if (typeof patch.rotationAngle === 'number') {
            nextAngle = normalizeRotationAngle(
              patch.rotationAngle,
              layer.rotation
            );
            nextRot = patch.rotation || angleToIsometricRotation(nextAngle);
          } else if (patch.rotation) {
            nextRot = patch.rotation;
            nextAngle = rotationToAngle(patch.rotation);
          }
          return {
            ...layer,
            ...patch,
            scale:
              typeof patch.scale === 'number'
                ? clampObjectScale(patch.scale)
                : layer.scale,
            rotation: nextRot,
            rotationAngle: nextAngle,
          };
        });
        persistInventoryStack(next);
        return next;
      });
    },
    [persistInventoryStack]
  );

  const removeFromInventoryStack = useCallback(
    (layerId: string) => {
      setInventoryStack((prev) => {
        const next = prev.filter((l) => l.id !== layerId);
        persistInventoryStack(next);
        return next;
      });
      pixelAudio.playConsoleClick();
    },
    [persistInventoryStack]
  );

  const reorderInventoryStack = useCallback(
    (layerId: string, direction: 'up' | 'down') => {
      setInventoryStack((prev) => {
        const idx = prev.findIndex((l) => l.id === layerId);
        if (idx === -1) return prev;
        const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
        if (targetIdx < 0 || targetIdx >= prev.length) return prev;
        const copy = [...prev];
        const [item] = copy.splice(idx, 1);
        copy.splice(targetIdx, 0, item);
        persistInventoryStack(copy);
        return copy;
      });
      pixelAudio.playConsoleClick();
    },
    [persistInventoryStack]
  );

  const clearInventoryStack = useCallback(() => {
    setInventoryStack([]);
    persistInventoryStack([]);
    pixelAudio.playConsoleClick();
  }, [persistInventoryStack]);

  const placeInventoryStackAtTile = useCallback(
    (
      targetX: number,
      targetY: number,
      mode: PlacementMode = 'stack'
    ): RoomObject[] => {
      if (inventoryStack.length === 0) return [];
      const { objects: nextObjects, placedObjects } = applyInventoryStackAtTile(
        objects,
        inventoryStack,
        targetX,
        targetY,
        mode
      );
      setObjects(nextObjects);
      persistState(nextObjects, projects);

      // Decrement inventory quantities for layers that reference an inventoryItemId
      setInventory((prev) => {
        let nextInv = [...prev];
        inventoryStack.forEach((layer) => {
          if (layer.inventoryItemId) {
            nextInv = removeInventoryItemById(
              nextInv,
              layer.inventoryItemId,
              1
            );
          }
        });
        persistInventory(nextInv);
        return nextInv;
      });

      pixelAudio.playPlaceObject();
      return placedObjects;
    },
    [
      inventoryStack,
      objects,
      projects,
      persistState,
      persistInventory,
    ]
  );

  const resetInventoryToDefault = useCallback(() => {
    setInventory(DEFAULT_INVENTORY_ITEMS);
    setInventoryStack([]);
    persistInventory(DEFAULT_INVENTORY_ITEMS);
    persistInventoryStack([]);
    pixelAudio.playPlaceObject();
  }, [persistInventory, persistInventoryStack]);

  const addProjectLink = useCallback(
    (
      projectInput: Omit<ProjectLink, 'id'>,
      spawnScreen?: {
        screenType: 'neon_bulletin' | 'floating_screen';
        x: number;
        y: number;
      }
    ) => {
      const newProj: ProjectLink = {
        ...projectInput,
        id: `proj-${Date.now()}`,
      };
      const nextProjects = [...projects, newProj];
      let nextObjects = objects;

      if (spawnScreen) {
        const z = getNextStackHeightAtTile(
          spawnScreen.x,
          spawnScreen.y,
          objects
        );
        const screenObj: RoomObject = {
          id: `obj-screen-${Date.now()}`,
          type: spawnScreen.screenType,
          label: `${
            spawnScreen.screenType === 'neon_bulletin'
              ? 'Neon Bulletin'
              : 'Floating Screen'
          }: ${newProj.title}`,
          x: spawnScreen.x,
          y: spawnScreen.y,
          z,
          rotation: 'se',
          colorVariant: newProj.accentColor,
          walkable: false,
          projectId: newProj.id,
          createdAt: new Date().toISOString(),
        };
        nextObjects = [...objects, screenObj];
        setObjects(nextObjects);
      }

      setProjects(nextProjects);
      persistState(nextObjects, nextProjects);
      pixelAudio.playPlaceObject();
      return newProj;
    },
    [objects, projects, persistState]
  );

  const removePet = useCallback(
    (petId: string) => {
      setPets((prev) => {
        const next = removeRoomPet(prev, petId);
        persistPets(next);
        return next;
      });
      if (petId === 'draco-dragon') {
        const nextObjs = objects.filter((o) => o.type !== 'pet_dragon');
        if (nextObjs.length !== objects.length) {
          setObjects(nextObjs);
          persistState(nextObjs, projects);
        }
      }
      pixelAudio.playConsoleClick();
    },
    [objects, projects, persistState, persistPets]
  );

  const clearAllPets = useCallback(() => {
    setPets([]);
    persistPets([]);
    const nextObjs = objects.filter((o) => o.type !== 'pet_dragon');
    if (nextObjs.length !== objects.length) {
      setObjects(nextObjs);
      persistState(nextObjs, projects);
    }
    pixelAudio.playConsoleClick();
  }, [objects, projects, persistState, persistPets]);

  const restoreDefaultPets = useCallback(() => {
    setPets(DEFAULT_ROOM_PETS);
    persistPets(DEFAULT_ROOM_PETS);
    pixelAudio.playPlaceObject();
  }, [persistPets]);

  const resetRoomToDefault = useCallback(() => {
    setObjects(DEFAULT_ROOM_OBJECTS);
    setProjects(DEFAULT_PROJECT_LINKS);
    setPets(DEFAULT_ROOM_PETS);
    setRoomSettings(DEFAULT_ROOM_SETTINGS);
    persistState(DEFAULT_ROOM_OBJECTS, DEFAULT_PROJECT_LINKS);
    persistPets(DEFAULT_ROOM_PETS);
    try {
      window.localStorage.setItem(
        STORAGE_KEY_ROOM_SETTINGS,
        JSON.stringify(DEFAULT_ROOM_SETTINGS)
      );
    } catch {}
    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset: true }),
    }).catch(() => {});
    pixelAudio.playPlaceObject();
  }, [persistState, persistPets]);

  const applyOrganizedPreset = useCallback(() => {
    setObjects(ORGANIZED_ROOM_OBJECTS);
    persistState(ORGANIZED_ROOM_OBJECTS, projects);
    pixelAudio.playPlaceObject();
  }, [projects, persistState]);

  const clearFloorToMinimal = useCallback(() => {
    const minimal: RoomObject[] = [];
    setObjects(minimal);
    persistState(minimal, projects);
    pixelAudio.playConsoleClick();
  }, [projects, persistState]);

  const pushChatBubble = useCallback(
      (
        speaker: string,
        text: string,
        speakerType: ChatBubble['speakerType'] = 'avatar',
        isShout: boolean = false,
        customTile?: { x: number; y: number }
      ) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        pixelAudio.playChatPop(speakerType === 'cat' || speakerType === 'dragon');
        const newBubble: ChatBubble = {
          id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          speaker,
          speakerId: speakerType === 'avatar' ? visitorAvatar.id : undefined,
          speakerTile:
            customTile ||
            (speakerType === 'avatar'
              ? {
                  x: Math.round(localPresenceRef.current.x),
                  y: Math.round(localPresenceRef.current.y),
                }
              : undefined),
          speakerType,
          text: trimmed,
          isShout,
          offsetY: 0,
          createdAt: Date.now(),
        };
        seenChatIdsRef.current.add(newBubble.id);
        setChatBubbles((prev) => {
          const shifted = prev
            .map((b) => ({ ...b, offsetY: b.offsetY + 24 }))
            .filter((b) => b.offsetY < 220);
          return [...shifted, newBubble];
        });
        setChatHistory((prev) => [...prev.slice(-30), newBubble]);

        if (speakerType === 'avatar') {
          broadcastChannelRef.current?.postMessage({
            type: 'chat',
            bubble: newBubble,
          });
          fetch('/api/room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatBubble: newBubble }),
          }).catch(() => {});
        }
      },
      [visitorAvatar.id]
    );

  const loginAdmin = useCallback(() => {
    setIsAdminAuthenticated(true);
    try {
      window.localStorage.setItem(STORAGE_KEY_ADMIN_AUTH, 'true');
    } catch {}
    pixelAudio.playPlaceObject();
  }, []);

  const logoutAdmin = useCallback(() => {
    setIsAdminAuthenticated(false);
    try {
      window.localStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);
    } catch {}
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      pixelAudio.muted = next;
      if (next) {
        pixelAudio.stopAmbientMusic();
        setIsMusicPlaying(false);
      } else {
        pixelAudio.startAmbientMusic();
        setIsMusicPlaying(true);
      }
      return next;
    });
  }, []);

  const toggleAmbientMusic = useCallback(() => {
    if (pixelAudio.musicPlaying) {
      pixelAudio.stopAmbientMusic();
      setIsMusicPlaying(false);
    } else {
      pixelAudio.muted = false;
      setIsMuted(false);
      pixelAudio.startAmbientMusic();
      setIsMusicPlaying(true);
    }
  }, []);

  const ensureAmbientMusicStarted = useCallback(() => {
    if (!pixelAudio.muted && !pixelAudio.musicPlaying) {
      pixelAudio.startAmbientMusic();
      setIsMusicPlaying(true);
    }
  }, []);

  return {
    objects,
    projects,
    pets,
    inventory,
    inventoryStack,
    roomSettings,
        chatBubbles,
        chatHistory,
        avatarAction,
        heldDrink,
        remotePlayers,
        tvSync,
    customBgmUrl,
    isLoaded,
    isAdminAuthenticated,
    isMuted,
    isMusicPlaying,
    visitorAvatar,
    useOwnerSkin,
    lastSavedAt,
    isSaving,
    addObject,
    moveObject,
    clearTile,
    removeObject,
    removePet,
    clearAllPets,
    restoreDefaultPets,
    updateObjectZ,
    rotateObject,
    updateObjectTransform,
    addInventoryItem,
    removeInventoryItem,
    updateInventoryItemTransform,
    pickupObjectToInventory,
    pushToInventoryStack,
    updateInventoryStackLayer,
    removeFromInventoryStack,
    reorderInventoryStack,
    clearInventoryStack,
    placeInventoryStackAtTile,
    resetInventoryToDefault,
    updateObjectVideoUrl,
    broadcastLocalMove,
    randomizeVisitorAvatar,
    updateVisitorUsername,
    triggerAvatarAction,
    takeDrinkFromDispenser,
    reportLocalAvatarMotion,
    updateTvPlaybackSync,
    setCustomBgmAudio,
    updateRoomSettings,
    paintManualFloorTile,
    toggleOwnerSkin,
    addProjectLink,
    resetRoomToDefault,
    applyOrganizedPreset,
    clearFloorToMinimal,
    pushChatBubble,
    loginAdmin,
    logoutAdmin,
    toggleMute,
    toggleAmbientMusic,
    ensureAmbientMusicStarted,
  };
}
