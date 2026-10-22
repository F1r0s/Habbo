import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gridToScreen,
  screenToGrid,
  isWithinGrid,
  isTileWalkable,
  sortObjectsForRender,
  findPath,
  calculateRoomClutterMetrics,
  getNextStackHeightAtTile,
  validateNewRoomObject,
  validateProjectLink,
  verifyAdminPasscode,
  serializeDragFurniturePayload,
  parseDragFurniturePayload,
  resolveCanvasDropTile,
  resolveIsometricDirection,
  computeNextPatrolTile,
  computeRandomPatrolTile,
  getNextRotation,
  computeTimeOfDayTheme,
  filterActiveChatBubbles,
  applyTilePlacement,
  moveRoomObjectToTile,
  getTopObjectAtTile,
  removeRoomPet,
  canModifyRoom,
  extractYouTubeVideoId,
  normalizeYouTubeEmbedUrl,
  updateRoomObjectVideoUrl,
  generateRandomVisitorAvatar,
  clampObjectScale,
  rotationToAngle,
  normalizeRotationAngle,
  angleToIsometricRotation,
  updateRoomObjectTransform,
  DEFAULT_INVENTORY_ITEMS,
  addOrRestockInventoryItem,
  removeInventoryItemById,
  returnRoomObjectToInventory,
  applyInventoryStackAtTile,
  isWallPosterType,
  DEFAULT_POSTER_IMAGES,
  sanitizeRoomSettings,
  OBJECT_CATALOG,
  DEFAULT_ROOM_OBJECTS,
  ORGANIZED_ROOM_OBJECTS,
  DEFAULT_ROOM_PETS,
  INITIAL_CHAT_BUBBLES,
  DEMO_ADMIN_PASSCODE,
  OWNER_EMAIL,
  OWNER_SECRET_KEY,
  TILE_WIDTH,
  TILE_HEIGHT,
  RoomObject,
} from './room-engine';

test('isometric gridToScreen and screenToGrid round-trip accurately', () => {
  const originX = 500;
  const originY = 200;

  for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 10; y++) {
      // Check tile center (+ TILE_HEIGHT / 2 in screen y)
      const { sx, sy } = gridToScreen(x, y, 0, originX, originY);
      const recovered = screenToGrid(sx, sy + TILE_HEIGHT / 2, originX, originY);
      assert.equal(recovered.x, x, `Failed x round-trip for (${x},${y})`);
      assert.equal(recovered.y, y, `Failed y round-trip for (${x},${y})`);
    }
  }
});

test('gridToScreen applies 2:1 isometric ratio and vertical z offset', () => {
  const base = gridToScreen(2, 1, 0, 100, 100);
  assert.equal(base.sx, 100 + (2 - 1) * (TILE_WIDTH / 2));
  assert.equal(base.sy, 100 + (2 + 1) * (TILE_HEIGHT / 2));

  const elevated = gridToScreen(2, 1, 2, 100, 100);
  assert.equal(elevated.sx, base.sx);
  assert.ok(elevated.sy < base.sy, 'Higher z elevation must render higher on screen (smaller sy)');
});

test('sortObjectsForRender orders rugs first, then back-to-front (x+y), then bottom-to-top (z)', () => {
  const sample: RoomObject[] = [
    {
      id: 'front-sofa',
      type: 'white_sofa',
      label: 'Front Sofa',
      x: 5,
      y: 5,
      z: 0,
      rotation: 'se',
      walkable: false,
      createdAt: '2026-10-20',
    },
    {
      id: 'back-block-top',
      type: 'building_block',
      label: 'Block Top',
      x: 2,
      y: 2,
      z: 1,
      rotation: 'se',
      walkable: false,
      createdAt: '2026-10-20',
    },
    {
      id: 'back-block-bottom',
      type: 'building_block',
      label: 'Block Bottom',
      x: 2,
      y: 2,
      z: 0,
      rotation: 'se',
      walkable: false,
      createdAt: '2026-10-20',
    },
    {
      id: 'floor-rug',
      type: 'luxury_rug_pink',
      label: 'Floor Rug',
      x: 8,
      y: 8,
      z: 0,
      rotation: 'se',
      walkable: true,
      createdAt: '2026-10-20',
    },
  ];

  const sorted = sortObjectsForRender(sample);
  assert.equal(sorted[0].id, 'floor-rug');
  assert.equal(sorted[1].id, 'back-block-bottom');
  assert.equal(sorted[2].id, 'back-block-top');
  assert.equal(sorted[3].id, 'front-sofa');
});

test('isTileWalkable allows rugs and blocks solid furniture', () => {
  // (4, 5) has a luxury pink rug (walkable: true)
  assert.equal(isTileWalkable(4, 5, DEFAULT_ROOM_OBJECTS), true);
  // (1, 1) has the Admin Control Console (walkable: false)
  assert.equal(isTileWalkable(1, 1, DEFAULT_ROOM_OBJECTS), false);
  // Out of bounds
  assert.equal(isTileWalkable(-1, 0, DEFAULT_ROOM_OBJECTS), false);
  assert.equal(isTileWalkable(10, 5, DEFAULT_ROOM_OBJECTS), false);
});

test('findPath computes valid path around obstacles and reaches adjacent tile for solid objects', () => {
  const start = { x: 4, y: 5 };
  // Walk to an open tile (4, 3)
  const pathToOpen = findPath(start, { x: 4, y: 3 }, DEFAULT_ROOM_OBJECTS);
  assert.ok(pathToOpen.length > 0, 'Expected non-empty path to (4,3)');
  const lastStep = pathToOpen[pathToOpen.length - 1];
  assert.deepEqual(lastStep, { x: 4, y: 3 });

  // Walk to a non-walkable object like the Admin Console at (1, 1) -> lands on adjacent walkable tile
  const pathToConsole = findPath(start, { x: 1, y: 1 }, DEFAULT_ROOM_OBJECTS);
  assert.ok(pathToConsole.length > 0, 'Expected path to adjacent tile of Admin Console');
  const dest = pathToConsole[pathToConsole.length - 1];
  assert.equal(isTileWalkable(dest.x, dest.y, DEFAULT_ROOM_OBJECTS), true);
  assert.equal(Math.abs(dest.x - 1) + Math.abs(dest.y - 1), 1);

  // Walk to a sittable sofa at (3, 8) -> path ends directly ON the sofa tile (3, 8) so the avatar can sit!
  const pathToSofa = findPath(start, { x: 3, y: 8 }, DEFAULT_ROOM_OBJECTS);
  assert.ok(pathToSofa.length > 0, 'Expected path to sofa at (3, 8)');
  const sofaDest = pathToSofa[pathToSofa.length - 1];
  assert.deepEqual(sofaDest, { x: 3, y: 8 });
});

test('calculateRoomClutterMetrics & getNextStackHeightAtTile compute accurate counts', () => {
  const metrics = calculateRoomClutterMetrics(DEFAULT_ROOM_OBJECTS);
  assert.equal(metrics.totalTiles, 100);
  assert.ok(metrics.bottlesCount >= 2);
  assert.ok(metrics.blocksCount >= 2);
  assert.equal(metrics.projectScreensCount, 4);

  // Tile (8, 2) has 2 stacked building blocks (z = 0, 1)
  const nextZ = getNextStackHeightAtTile(8, 2, DEFAULT_ROOM_OBJECTS);
  assert.equal(nextZ, 2);
});

test('validateNewRoomObject and validateProjectLink reject invalid inputs and accept valid ones', () => {
  assert.equal(
    validateNewRoomObject({ type: 'glass_bottle', label: 'A', x: 2, y: 2 }).valid,
    false
  );
  assert.equal(
    validateNewRoomObject({ type: 'glass_bottle', label: 'Emerald Bottle', x: 12, y: 2 }).valid,
    false
  );
  assert.equal(
    validateNewRoomObject({ type: 'building_block', label: 'Neon Cube', x: 4, y: 4, z: 1 }).valid,
    true
  );

  assert.equal(
    validateProjectLink({ title: 'My App', url: 'ftp://bad', category: 'Web' }).valid,
    false
  );
  assert.equal(
    validateProjectLink({
      title: 'My App',
      url: 'https://example.com',
      category: 'Web',
    }).valid,
    true
  );

  assert.equal(verifyAdminPasscode(DEMO_ADMIN_PASSCODE), true);
  assert.equal(verifyAdminPasscode(OWNER_EMAIL), true);
  assert.equal(verifyAdminPasscode(OWNER_SECRET_KEY), true);
  assert.equal(verifyAdminPasscode('wrong-pass'), false);
});

test('resolveIsometricDirection, computeNextPatrolTile, and computeRandomPatrolTile route DigitalPets across walkable tiles', () => {
  assert.equal(resolveIsometricDirection({ x: 3, y: 5 }, { x: 4, y: 5 }), 'se');
  assert.equal(resolveIsometricDirection({ x: 4, y: 5 }, { x: 4, y: 6 }), 'sw');
  assert.equal(resolveIsometricDirection({ x: 4, y: 6 }, { x: 4, y: 5 }), 'ne');
  assert.equal(resolveIsometricDirection({ x: 4, y: 5 }, { x: 3, y: 5 }), 'nw');

  const waypoints = [
    { x: 4, y: 5 },
    { x: 5, y: 6 },
    { x: 3, y: 6 },
  ];
  const step1 = computeNextPatrolTile({ x: 4, y: 5 }, waypoints, 0, DEFAULT_ROOM_OBJECTS);
  assert.equal(isTileWalkable(step1.nextCoord.x, step1.nextCoord.y, DEFAULT_ROOM_OBJECTS), true);
  assert.notDeepEqual(step1.nextCoord, { x: 4, y: 5 });

  // Test random animal patrol across 10 steps
  let cur = { x: 4, y: 5 };
  let prev = null;
  for (let i = 0; i < 10; i++) {
    const res = computeRandomPatrolTile(cur, DEFAULT_ROOM_OBJECTS, prev, () => (i * 0.27) % 1);
    assert.equal(isTileWalkable(res.nextCoord.x, res.nextCoord.y, DEFAULT_ROOM_OBJECTS), true);
    assert.notDeepEqual(res.nextCoord, cur);
    prev = cur;
    cur = res.nextCoord;
  }
});

test('getNextRotation cycles full 360 degrees across all 4 isometric orientations (se -> sw -> nw -> ne -> se)', () => {
  assert.equal(getNextRotation('se', 1), 'sw');
  assert.equal(getNextRotation('sw', 1), 'nw');
  assert.equal(getNextRotation('nw', 1), 'ne');
  assert.equal(getNextRotation('ne', 1), 'se');

  // Counter-clockwise (-1)
  assert.equal(getNextRotation('se', -1), 'ne');
  assert.equal(getNextRotation('ne', -1), 'nw');
  assert.equal(getNextRotation('nw', -1), 'sw');
  assert.equal(getNextRotation('sw', -1), 'se');
});

test('computeTimeOfDayTheme shifts CSS background gradients and shadow intensity by hour', () => {
  const dawn = computeTimeOfDayTheme(7);
  const day = computeTimeOfDayTheme(14);
  const sunset = computeTimeOfDayTheme(19);
  const night = computeTimeOfDayTheme(23);

  assert.equal(dawn.phase, 'dawn');
  assert.equal(day.phase, 'day');
  assert.equal(sunset.phase, 'sunset');
  assert.equal(night.phase, 'night');

  assert.ok(night.shadowAlpha > sunset.shadowAlpha);
  assert.ok(sunset.shadowAlpha > day.shadowAlpha);
  assert.notEqual(day.backgroundGradient, night.backgroundGradient);
});

test('filterActiveChatBubbles removes interaction notifications older than ttlMs', () => {
  const now = 10000;
  const bubbles = [
    {
      id: 'old-1',
      speaker: 'Chat',
      speakerType: 'cat' as const,
      text: '*ronronne*',
      offsetY: 0,
      createdAt: 4000, // 6000ms old -> expired
    },
    {
      id: 'fresh-1',
      speaker: 'Higma',
      speakerType: 'avatar' as const,
      text: "*s'assoit confortablement*",
      offsetY: 0,
      createdAt: 8500, // 1500ms old -> active
    },
  ];
  const active = filterActiveChatBubbles(bubbles, now, 4500);
  assert.equal(active.length, 1);
  assert.equal(active[0].id, 'fresh-1');
});

test('serializeDragFurniturePayload, parseDragFurniturePayload, and resolveCanvasDropTile support drag-and-drop floor placement', () => {
  const raw = serializeDragFurniturePayload({
    type: 'white_sofa',
    label: 'Modern White Club Sofa',
    colorVariant: '#f8fafc',
    rotation: 'nw',
  });
  const parsed = parseDragFurniturePayload(raw);
  assert.ok(parsed);
  assert.equal(parsed.type, 'white_sofa');
  assert.equal(parsed.rotation, 'nw');

  assert.equal(parseDragFurniturePayload('{"type":"invalid_item"}'), null);
  assert.equal(parseDragFurniturePayload('not-json'), null);

  // Test resolveCanvasDropTile for tile (4, 5)
  const originX = 380;
  const originY = 165;
  const { sx, sy } = gridToScreen(4, 5, 0, originX, originY);
  const tile = resolveCanvasDropTile({
    clientX: 100 + sx,
    clientY: 50 + sy + TILE_HEIGHT / 2,
    rectLeft: 100,
    rectTop: 50,
    rectWidth: 760,
    rectHeight: 500,
    logicalWidth: 760,
    logicalHeight: 500,
    originX,
    originY,
  });
  assert.deepEqual(tile, { x: 4, y: 5 });
});

test('applyTilePlacement cleanly replaces existing solid items in replace mode while preserving rugs, and stacks in stack mode', () => {
  const baseObjects: RoomObject[] = [
    {
      id: 'rug-1',
      type: 'luxury_rug_pink',
      label: 'Rose Rug',
      x: 4,
      y: 4,
      z: 0,
      rotation: 'se',
      walkable: true,
      createdAt: '2026-10-20',
    },
    {
      id: 'old-sofa',
      type: 'white_sofa',
      label: 'Old Sofa',
      x: 4,
      y: 4,
      z: 0,
      rotation: 'se',
      walkable: false,
      sittable: true,
      createdAt: '2026-10-20',
    },
  ];

  // In 'replace' mode, placing a wood_table at (4, 4) replaces 'old-sofa' at z=0 while keeping 'rug-1'!
  const replaceResult = applyTilePlacement(
    baseObjects,
    {
      id: 'new-table',
      type: 'wood_table',
      label: 'Mahogany Lounge Table',
      x: 4,
      y: 4,
      rotation: 'sw',
    },
    'replace'
  );
  assert.equal(replaceResult.replacedCount, 1);
  assert.equal(replaceResult.placed.z, 0);
  assert.equal(replaceResult.objects.length, 2);
  assert.ok(replaceResult.objects.some((o) => o.id === 'rug-1'));
  assert.ok(replaceResult.objects.some((o) => o.id === 'new-table'));

  // In 'stack' mode, placing a glass_bottle at (4, 4) stacks on top of 'new-table' at z=1!
  const stackResult = applyTilePlacement(
    replaceResult.objects,
    {
      id: 'top-bottle',
      type: 'glass_bottle',
      label: 'Emerald Bottle',
      x: 4,
      y: 4,
    },
    'stack'
  );
  assert.equal(stackResult.placed.z, 1);
  assert.equal(stackResult.objects.length, 3);

  // getTopObjectAtTile returns the highest non-rug item on (4, 4)
  const top = getTopObjectAtTile(4, 4, stackResult.objects);
  assert.equal(top?.id, 'top-bottle');

  // moveRoomObjectToTile moves 'new-table' to (5, 4) cleanly at z=0
  const moved = moveRoomObjectToTile(stackResult.objects, 'new-table', 5, 4, 'replace');
  const movedTable = moved.find((o) => o.id === 'new-table');
  assert.equal(movedTable?.x, 5);
  assert.equal(movedTable?.y, 4);
  assert.equal(movedTable?.z, 0);

  // ORGANIZED_ROOM_OBJECTS has lower clutter than DEFAULT_ROOM_OBJECTS
  const orgMetrics = calculateRoomClutterMetrics(ORGANIZED_ROOM_OBJECTS);
  const defMetrics = calculateRoomClutterMetrics(DEFAULT_ROOM_OBJECTS);
  assert.ok(orgMetrics.walkableTiles > defMetrics.walkableTiles);
});

test('canModifyRoom and removeRoomPet enforce admin-only mobi/animal removal and English defaults', () => {
  assert.equal(canModifyRoom(false), false);
  assert.equal(canModifyRoom(true), true);

  assert.equal(DEFAULT_ROOM_PETS.length, 4);
  const afterMiloRemoved = removeRoomPet(DEFAULT_ROOM_PETS, 'milo-cat');
  assert.equal(afterMiloRemoved.length, 3);
  assert.equal(afterMiloRemoved.some((p) => p.id === 'milo-cat'), false);

  for (const bubble of INITIAL_CHAT_BUBBLES) {
    assert.equal(bubble.text.includes('salut'), false);
    assert.equal(bubble.text.includes('saumon'), false);
  }
});

test('extractYouTubeVideoId, normalizeYouTubeEmbedUrl, and updateRoomObjectVideoUrl parse YouTube links and update 3D TV state', () => {
  assert.equal(
    extractYouTubeVideoId('https://www.youtube.com/watch?v=jfKfPfyJRdk&ab_channel=LofiGirl'),
    'jfKfPfyJRdk'
  );
  assert.equal(
    extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ?si=12345'),
    'dQw4w9WgXcQ'
  );
  assert.equal(
    extractYouTubeVideoId('https://www.youtube.com/embed/5qap5aO4i9A'),
    '5qap5aO4i9A'
  );
  assert.equal(extractYouTubeVideoId('jfKfPfyJRdk'), 'jfKfPfyJRdk');
  assert.equal(extractYouTubeVideoId('https://example.com/not-youtube'), null);

  const normalized = normalizeYouTubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ');
  assert.equal(normalized.videoId, 'dQw4w9WgXcQ');
  assert.ok(normalized.embedUrl.includes('https://www.youtube.com/embed/dQw4w9WgXcQ'));
  assert.ok(normalized.embedUrl.includes('autoplay=1'));
  assert.ok(normalized.embedUrl.includes('mute=1'));

  // Default room has a youtube_tv
  const defaultTv = DEFAULT_ROOM_OBJECTS.find((o) => o.type === 'youtube_tv');
  assert.ok(defaultTv, 'Expected DEFAULT_ROOM_OBJECTS to include a youtube_tv');

  const updated = updateRoomObjectVideoUrl(
    DEFAULT_ROOM_OBJECTS,
    'all',
    'https://youtu.be/dQw4w9WgXcQ'
  );
  const updatedTv = updated.find((o) => o.type === 'youtube_tv');
  assert.equal(updatedTv?.videoUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
});

test('generateRandomVisitorAvatar creates deterministic or random Habbo visitor outfits', () => {
  const v1 = generateRandomVisitorAvatar(() => 0.15);
  assert.ok(v1.id.startsWith('visitor-'));
  assert.ok(v1.name.length > 3);
  assert.ok(v1.skinColor.startsWith('#'));
  assert.ok(v1.hairColor.startsWith('#'));
  assert.ok(v1.shirtColor.startsWith('#'));
  assert.ok(v1.pantsColor.startsWith('#'));
  assert.ok(v1.shoeColor.startsWith('#'));
  assert.ok(['none', 'cap', 'visor', 'headphones', 'crown'].includes(v1.accessory));
});

test('clampObjectScale, angleToIsometricRotation, and updateRoomObjectTransform support real-time rotation and scaling', () => {
  assert.equal(clampObjectScale(undefined), 1);
  assert.equal(clampObjectScale(0.1), 0.4);
  assert.equal(clampObjectScale(3.2), 2.5);
  assert.equal(clampObjectScale(1.456), 1.46);

  assert.equal(rotationToAngle('se'), 0);
  assert.equal(rotationToAngle('sw'), 90);
  assert.equal(rotationToAngle('nw'), 180);
  assert.equal(rotationToAngle('ne'), 270);

  assert.equal(normalizeRotationAngle(-45), 315);
  assert.equal(normalizeRotationAngle(450), 90);

  assert.equal(angleToIsometricRotation(0), 'se');
  assert.equal(angleToIsometricRotation(85), 'sw');
  assert.equal(angleToIsometricRotation(195), 'nw');
  assert.equal(angleToIsometricRotation(280), 'ne');
  assert.equal(angleToIsometricRotation(350), 'se');

  const updated = updateRoomObjectTransform(
    DEFAULT_ROOM_OBJECTS,
    'obj-bottle-1',
    { scale: 1.75, rotationAngle: 205 }
  );
  const bottle = updated.find((o) => o.id === 'obj-bottle-1');
  assert.equal(bottle?.scale, 1.75);
  assert.equal(bottle?.rotationAngle, 205);
  assert.equal(bottle?.rotation, 'nw');
});

test('inventory management and pre-placement stacking add, remove, stow, and place multi-tier bundles', () => {
  assert.ok(DEFAULT_INVENTORY_ITEMS.length >= 18);

  const initialBottle = DEFAULT_INVENTORY_ITEMS.find(
    (i) => i.type === 'glass_bottle'
  )!;
  const restocked = addOrRestockInventoryItem(DEFAULT_INVENTORY_ITEMS, {
    type: 'glass_bottle',
    colorVariant: initialBottle.colorVariant,
    quantity: 3,
    defaultScale: 1,
  });
  const afterRestock = restocked.find((i) => i.id === initialBottle.id)!;
  assert.equal(afterRestock.quantity, initialBottle.quantity + 3);

  const afterRemove = removeInventoryItemById(restocked, initialBottle.id, 2);
  assert.equal(
    afterRemove.find((i) => i.id === initialBottle.id)?.quantity,
    initialBottle.quantity + 1
  );

  // Return a customized floor object back into inventory
  const customFloorBlock: RoomObject = {
    id: 'custom-block-99',
    type: 'building_block',
    label: 'Giant Neon Block',
    x: 4,
    y: 4,
    z: 0,
    rotation: 'ne',
    rotationAngle: 270,
    scale: 1.85,
    colorVariant: '#00E5FF',
    walkable: false,
    createdAt: '2026-10-22',
  };
  const withReturned = returnRoomObjectToInventory(
    afterRemove,
    customFloorBlock
  );
  const customInvEntry = withReturned.find(
    (i) => i.type === 'building_block' && i.defaultScale === 1.85
  );
  assert.ok(customInvEntry);
  assert.equal(customInvEntry.defaultRotation, 'ne');
  assert.equal(customInvEntry.defaultRotationAngle, 270);

  // Place a 3-layer pre-stacked inventory bundle onto tile (5, 5)
  const stackPlacement = applyInventoryStackAtTile(
    [],
    [
      {
        id: 'layer-1',
        type: 'wood_table',
        label: 'Base Table',
        colorVariant: '#9a5b3e',
        scale: 1.2,
        rotation: 'sw',
        rotationAngle: 90,
      },
      {
        id: 'layer-2',
        type: 'building_block',
        label: 'Middle Block',
        colorVariant: '#f59e0b',
        scale: 1.0,
        rotation: 'se',
        rotationAngle: 0,
      },
      {
        id: 'layer-3',
        type: 'glass_bottle',
        label: 'Top Bottle',
        colorVariant: '#34d399',
        scale: 1.4,
        rotation: 'nw',
        rotationAngle: 180,
      },
    ],
    5,
    5,
    'stack'
  );

  assert.equal(stackPlacement.placedObjects.length, 3);
  assert.equal(stackPlacement.placedObjects[0].z, 0);
  assert.equal(stackPlacement.placedObjects[0].scale, 1.2);
  assert.equal(stackPlacement.placedObjects[1].z, 1);
  assert.equal(stackPlacement.placedObjects[2].z, 2);
  assert.equal(stackPlacement.placedObjects[2].scale, 1.4);
  assert.equal(stackPlacement.placedObjects[2].rotation, 'nw');
});

test('wall posters are present in default room, support custom imageUrl, and can be modified or removed', () => {
  assert.equal(isWallPosterType('poster_chelsea'), true);
  assert.equal(isWallPosterType('poster_raja_gb05'), true);
  assert.equal(isWallPosterType('poster_wydad_winners'), true);
  assert.equal(isWallPosterType('white_sofa'), false);

  const defaultPosters = DEFAULT_ROOM_OBJECTS.filter((o) =>
    isWallPosterType(o.type)
  );
  assert.equal(defaultPosters.length, 3);
  assert.ok(DEFAULT_POSTER_IMAGES.poster_chelsea.startsWith('data:image/svg+xml'));
  assert.ok(DEFAULT_POSTER_IMAGES.poster_raja_gb05.startsWith('data:image/svg+xml'));
  assert.ok(
    DEFAULT_POSTER_IMAGES.poster_wydad_winners.startsWith('data:image/svg+xml')
  );

  const updated = updateRoomObjectTransform(
    DEFAULT_ROOM_OBJECTS,
    'obj-poster-raja-1',
    {
      scale: 1.65,
      rotationAngle: 0,
      imageUrl: 'https://example.com/custom-raja.png',
    }
  );
  const rajaPoster = updated.find((o) => o.id === 'obj-poster-raja-1');
  assert.equal(rajaPoster?.scale, 1.65);
  assert.equal(rajaPoster?.rotation, 'se');
  assert.equal(rajaPoster?.imageUrl, 'https://example.com/custom-raja.png');
});

test('sanitizeRoomSettings supports expanding room grid size (10x10 to 16x16) and custom wall/floor styles', () => {
  const expanded = sanitizeRoomSettings({
    gridSize: 16,
    wallColor: '#1E3A8A',
    wallPattern: 'club_stripes',
    wallHeight: 145,
    floorColor: '#E2E8F0',
    floorPattern: 'marble_checkers',
    floorThickness: 12,
  });
  assert.equal(expanded.gridSize, 16);
  assert.equal(expanded.wallColor, '#1E3A8A');
  assert.equal(expanded.floorPattern, 'marble_checkers');
  assert.equal(expanded.wallHeight, 145);
  assert.equal(expanded.floorThickness, 12);

  // Clamps out-of-range gridSize
  const clamped = sanitizeRoomSettings({ gridSize: 99 });
  assert.equal(clamped.gridSize, 16);

  // Open-Hotel spotlight & candle are registered in OBJECT_CATALOG
  assert.ok(OBJECT_CATALOG.gold_spotlight);
  assert.ok(OBJECT_CATALOG.habbo_candle);
});

