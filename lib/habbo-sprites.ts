'use client';

export interface HabboSpriteAtlas {
  ready: boolean;
  noobPlant: HTMLCanvasElement | null;
  openHotelAvatar: HTMLCanvasElement | null;
  cameraBot: HTMLCanvasElement | null;
  dubbelBottle: HTMLCanvasElement | null;
  barrel: HTMLCanvasElement | null;
  goldSpotlightBase: HTMLCanvasElement | null;
  goldSpotlightBeam: HTMLCanvasElement | null;
  candleFrames: HTMLCanvasElement[];
  dragonStatue: HTMLCanvasElement | null;
  dragonFrames: {
    se: HTMLCanvasElement | null;
    sw: HTMLCanvasElement | null;
    nw: HTMLCanvasElement | null;
    ne: HTMLCanvasElement | null;
  };
  bbRed: HTMLCanvasElement | null;
  bbBlue: HTMLCanvasElement | null;
  bbGreen: HTMLCanvasElement | null;
  bbYellow: HTMLCanvasElement | null;
  whiteSofaSE: HTMLCanvasElement | null;
  whiteSofaSW: HTMLCanvasElement | null;
  whiteSofaNW: HTMLCanvasElement | null;
  whiteSofaNE: HTMLCanvasElement | null;
  crownPurple: HTMLCanvasElement | null;
  crownGold: HTMLCanvasElement | null;
  catBasket: HTMLCanvasElement | null;
  emptyBasket: HTMLCanvasElement | null;
  waterBowl: HTMLCanvasElement | null;
  dragonDraco: HTMLCanvasElement | null;
  higmaAvatar: HTMLCanvasElement | null;
  higmaWalkSW: HTMLCanvasElement[];
  higmaWalkNW: HTMLCanvasElement[];
  higmaSittingSW: HTMLCanvasElement | null;
  higmaSittingNW: HTMLCanvasElement | null;
  chatIconCat: HTMLCanvasElement | null;
  chatIconHigma: HTMLCanvasElement | null;
}

const atlas: HabboSpriteAtlas = {
  ready: false,
  noobPlant: null,
  openHotelAvatar: null,
  cameraBot: null,
  dubbelBottle: null,
  barrel: null,
  goldSpotlightBase: null,
  goldSpotlightBeam: null,
  candleFrames: [],
  dragonStatue: null,
  dragonFrames: {
    se: null,
    sw: null,
    nw: null,
    ne: null,
  },
  bbRed: null,
  bbBlue: null,
  bbGreen: null,
  bbYellow: null,
  whiteSofaSE: null,
  whiteSofaSW: null,
  whiteSofaNW: null,
  whiteSofaNE: null,
  crownPurple: null,
  crownGold: null,
  catBasket: null,
  emptyBasket: null,
  waterBowl: null,
  dragonDraco: null,
  higmaAvatar: null,
  higmaWalkSW: [],
  higmaWalkNW: [],
  higmaSittingSW: null,
  higmaSittingNW: null,
  chatIconCat: null,
  chatIconHigma: null,
};

let loadingPromise: Promise<HabboSpriteAtlas> | null = null;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function cropFromSheet(
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number
): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = sw;
  c.height = sh;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  return c;
}

/**
 * Extracts a pixel-art sprite from a room sheet by flood-filling perimeter background pixels
 * up to the closed dark Habbo 1px outline barrier, and strips any tiny disconnected islands.
 */
function extractKeyedSprite(
  srcCtx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  outlineThreshold: number = 58,
  keepMainComponentOnly: boolean = false
): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const imgData = srcCtx.getImageData(x, y, w, h);
  const d = imgData.data;

  const isProtectedSpritePixel = (idx: number) => {
    const r = d[idx];
    const g = d[idx + 1];
    const b = d[idx + 2];
    if (r < outlineThreshold && g < outlineThreshold && b < outlineThreshold) {
      return true;
    }
    if (r > 130 && Math.abs(r - g) <= 16 && Math.abs(r - b) <= 18) {
      return true;
    }
    if (b > g + 14 && r >= g - 10 && b > 80) {
      return true;
    }
    return false;
  };

  const visited = new Uint8Array(w * h);
  const queue: number[] = [];

  for (let px = 0; px < w; px++) {
    for (const py of [0, h - 1]) {
      const i = py * w + px;
      if (!isProtectedSpritePixel(i * 4)) {
        visited[i] = 1;
        queue.push(i);
      }
    }
  }
  for (let py = 0; py < h; py++) {
    for (const px of [0, w - 1]) {
      const i = py * w + px;
      if (!visited[i] && !isProtectedSpritePixel(i * 4)) {
        visited[i] = 1;
        queue.push(i);
      }
    }
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const cx = curr % w;
    const cy = Math.floor(curr / w);
    d[curr * 4 + 3] = 0;

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const ni = ny * w + nx;
        if (!visited[ni] && !isProtectedSpritePixel(ni * 4)) {
          visited[ni] = 1;
          queue.push(ni);
        }
      }
    }
  }

  if (keepMainComponentOnly) {
    const compId = new Int32Array(w * h);
    let currentComp = 0;
    let bestComp = 0;
    let bestCount = 0;

    for (let i = 0; i < w * h; i++) {
      if (d[i * 4 + 3] > 0 && compId[i] === 0) {
        currentComp++;
        let count = 0;
        const cq = [i];
        compId[i] = currentComp;
        while (cq.length > 0) {
          const cur = cq.pop()!;
          count++;
          const cx = cur % w;
          const cy = Math.floor(cur / w);
          const nbs = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1],
          ];
          for (const [nx, ny] of nbs) {
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const ni = ny * w + nx;
              if (d[ni * 4 + 3] > 0 && compId[ni] === 0) {
                compId[ni] = currentComp;
                cq.push(ni);
              }
            }
          }
        }
        if (count > bestCount) {
          bestCount = count;
          bestComp = currentComp;
        }
      }
    }

    for (let i = 0; i < w * h; i++) {
      if (compId[i] !== bestComp) {
        d[i * 4 + 3] = 0;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return c;
}

/**
 * Generates an authentic 2:1 isometric Habbo Hotel White Club Sofa sprite in all 4 orientations (360°):
 * - 'sw' (facing South-West / front-left)
 * - 'se' (facing South-East / front-right)
 * - 'nw' (facing North-West / rear-left — backrest faces viewer)
 * - 'ne' (facing North-East / rear-right — backrest faces viewer)
 */
function createHabboWhiteSofaSprite(
  orientation: 'se' | 'sw' | 'nw' | 'ne'
): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 88;
  c.height = 60;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  if (orientation === 'se') {
    const swCanvas = createHabboWhiteSofaSprite('sw');
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(swCanvas, 0, 0);
    return c;
  }

  if (orientation === 'ne') {
    const nwCanvas = createHabboWhiteSofaSprite('nw');
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(nwCanvas, 0, 0);
    return c;
  }

  const pt = (u: number, v: number, z: number): [number, number] => [
    Math.round(28 + u * 2 - v * 2),
    Math.round(22 + u + v - z),
  ];

  const poly = (pts: [number, number][], fill: string, stroke = '#000000') => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawBox = (
    u0: number,
    u1: number,
    v0: number,
    v1: number,
    z0: number,
    z1: number,
    topCol: string,
    frontLeftCol: string,
    frontRightCol: string
  ) => {
    poly(
      [
        pt(u0, v1, z1),
        pt(u1, v1, z1),
        pt(u1, v1, z0),
        pt(u0, v1, z0),
      ],
      frontLeftCol
    );
    poly(
      [
        pt(u1, v0, z1),
        pt(u1, v1, z1),
        pt(u1, v1, z0),
        pt(u1, v0, z0),
      ],
      frontRightCol
    );
    poly(
      [
        pt(u0, v0, z1),
        pt(u1, v0, z1),
        pt(u1, v1, z1),
        pt(u0, v1, z1),
      ],
      topCol
    );
  };

  // Wooden Habbo corner feet
  drawBox(0, 2, 9, 11, 0, 2, '#78350F', '#78350F', '#451A03');
  drawBox(20, 22, 9, 11, 0, 2, '#78350F', '#78350F', '#451A03');
  drawBox(20, 22, 0, 2, 0, 2, '#78350F', '#78350F', '#451A03');

  if (orientation === 'nw') {
    // Rear-facing ('nw'): Cushion is in the back (v = 0..7.5), high backrest is in the foreground (v = 7.5..11)!
    drawBox(0, 3, 0, 11, 2, 14, '#52525B', '#3F3F46', '#27272A');
    drawBox(3, 19, 0, 7.5, 2, 10, '#FFFFFF', '#E4E4E7', '#CBD5E1');
    drawBox(3, 19, 7.5, 11, 2, 22, '#FFFFFF', '#F1F5F9', '#CBD5E1');
    // Rear upholstery vertical seam
    const bMidTop = pt(11, 11, 22);
    const bMidBot = pt(11, 11, 2);
    ctx.beginPath();
    ctx.moveTo(bMidTop[0], bMidTop[1]);
    ctx.lineTo(bMidBot[0], bMidBot[1]);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.stroke();
    drawBox(19, 22, 0, 11, 2, 14, '#52525B', '#3F3F46', '#18181B');
    return c;
  }

  // Front-facing ('sw'):
  drawBox(0, 3, 0, 11, 2, 14, '#52525B', '#3F3F46', '#27272A');
  drawBox(3, 19, 0, 3.5, 2, 22, '#FFFFFF', '#F8FAFC', '#CBD5E1');

  const bMidTop = pt(11, 3.5, 22);
  const bMidBot = pt(11, 3.5, 10);
  ctx.beginPath();
  ctx.moveTo(bMidTop[0], bMidTop[1]);
  ctx.lineTo(bMidBot[0], bMidBot[1]);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.stroke();

  drawBox(3, 19, 3.5, 11, 2, 10, '#FFFFFF', '#E4E4E7', '#CBD5E1');

  const sMidBack = pt(11, 3.5, 10);
  const sMidFront = pt(11, 11, 10);
  const sMidBot = pt(11, 11, 2);
  ctx.beginPath();
  ctx.moveTo(sMidBack[0], sMidBack[1]);
  ctx.lineTo(sMidFront[0], sMidFront[1]);
  ctx.lineTo(sMidBot[0], sMidBot[1]);
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#94A3B8';
  for (const u of [7, 15]) {
    const [tx, ty] = pt(u, 7, 10);
    ctx.fillRect(tx - 1, ty - 1, 2, 2);
  }

  drawBox(19, 22, 0, 11, 2, 14, '#52525B', '#3F3F46', '#18181B');

  return c;
}

/**
 * Builds a 4-frame walking animation for Higma facing SW (front-left) and NW (back-left, showing his back!).
 */
function createAvatarWalkFrames(standingCanvas: HTMLCanvasElement): {
  walkSW: HTMLCanvasElement[];
  walkNW: HTMLCanvasElement[];
} {
  const poly = (
    ctx: CanvasRenderingContext2D,
    pts: [number, number][],
    fill: string,
    stroke = '#000000'
  ) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  // Frame 0 = idle, Frame 1 = left stride forward, Frame 2 = passing, Frame 3 = right stride forward
  // Uses the EXACT original pixel legs from standingCanvas so legs never change color or shape!
  const strideConfigs = [
    { leftDx: 0, leftDy: 0, rightDx: 0, rightDy: 0, bobY: 0, armSwing: 0 },
    { leftDx: -2, leftDy: 1, rightDx: 2, rightDy: -1, bobY: -1, armSwing: 2 },
    { leftDx: 0, leftDy: 0, rightDx: 0, rightDy: 0, bobY: 0, armSwing: 0 },
    { leftDx: 2, leftDy: -1, rightDx: -2, rightDy: 1, bobY: -1, armSwing: -2 },
  ];

  const walkSW: HTMLCanvasElement[] = strideConfigs.map((cfg, frameIdx) => {
    const c = document.createElement('canvas');
    c.width = 44;
    c.height = 86;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    if (frameIdx === 0) {
      ctx.drawImage(standingCanvas, 6, 2);
      return c;
    }

    const ox = 6;
    const oy = 2 + cfg.bobY;
    const midX = Math.floor(standingCanvas.width / 2);
    const legStartY = 57;
    const legH = standingCanvas.height - legStartY;

    // Slice & shift the exact original left pixel leg & shoe from standingCanvas
    ctx.drawImage(
      standingCanvas,
      0,
      legStartY,
      midX,
      legH,
      ox + cfg.leftDx,
      oy + legStartY + cfg.leftDy,
      midX,
      legH
    );

    // Slice & shift the exact original right pixel leg & shoe from standingCanvas
    ctx.drawImage(
      standingCanvas,
      midX,
      legStartY,
      standingCanvas.width - midX,
      legH,
      ox + midX + cfg.rightDx,
      oy + legStartY + cfg.rightDy,
      standingCanvas.width - midX,
      legH
    );

    // Draw upper body (crown, head, jacket, hands: y = 0..58)
    ctx.drawImage(
      standingCanvas,
      0,
      0,
      standingCanvas.width,
      58,
      ox,
      oy,
      standingCanvas.width,
      58
    );

    // Animated swinging front hand/sleeve pixel accent
    if (cfg.armSwing !== 0) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(ox + 21 + Math.round(cfg.armSwing * 0.6), oy + 46, 6, 11);
      ctx.fillStyle = '#65772C';
      ctx.fillRect(ox + 22 + Math.round(cfg.armSwing * 0.6), oy + 47, 4, 7);
      ctx.fillStyle = '#F5CBA7';
      ctx.fillRect(ox + 22 + Math.round(cfg.armSwing * 0.6), oy + 54, 4, 3);
    }

    return c;
  });

  // Back-facing ('nw') frames: we see the back of Higma's hair, crown, olive jacket, and striding legs!
  const walkNW: HTMLCanvasElement[] = strideConfigs.map((cfg) => {
    const c = document.createElement('canvas');
    c.width = 44;
    c.height = 86;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const ox = 6;
    const oy = 2 + cfg.bobY;
    const midX = Math.floor(standingCanvas.width / 2);
    const legStartY = 57;
    const legH = standingCanvas.height - legStartY;

    // 1. Rear striding legs using the exact original pixel legs & shoes from standingCanvas
    ctx.drawImage(
      standingCanvas,
      0,
      legStartY,
      midX,
      legH,
      ox + cfg.leftDx,
      oy + legStartY + cfg.leftDy,
      midX,
      legH
    );
    ctx.drawImage(
      standingCanvas,
      midX,
      legStartY,
      standingCanvas.width - midX,
      legH,
      ox + midX + cfg.rightDx,
      oy + legStartY + cfg.rightDy,
      standingCanvas.width - midX,
      legH
    );

    // 2. Draw base upper body silhouette (y = 0..58) for the crown & head outline
    ctx.drawImage(
      standingCanvas,
      0,
      0,
      standingCanvas.width,
      58,
      ox,
      oy,
      standingCanvas.width,
      58
    );

    // 3. Paint the BACK of Higma's silver-grey Habbo hair over the face region (y = 14..36)
    // so we clearly see the back of his head instead of his face!
    poly(
      ctx,
      [
        [ox + 5, oy + 14],
        [ox + 26, oy + 14],
        [ox + 27, oy + 34],
        [ox + 22, oy + 37],
        [ox + 8, oy + 37],
        [ox + 4, oy + 33],
      ],
      '#9CA3AF'
    );
    // Hair shading layers & pixel texture on the back of the head
    ctx.fillStyle = '#6B7280';
    ctx.fillRect(ox + 7, oy + 26, 18, 9);
    ctx.fillStyle = '#D1D5DB';
    ctx.fillRect(ox + 9, oy + 16, 13, 6);
    ctx.fillStyle = '#4B5563';
    ctx.fillRect(ox + 11, oy + 22, 2, 12);
    ctx.fillRect(ox + 17, oy + 21, 2, 13);
    ctx.fillRect(ox + 22, oy + 23, 2, 10);

    // 4. Paint the BACK of Higma's olive-green jacket (y = 36..58)
    poly(
      ctx,
      [
        [ox + 6, oy + 36],
        [ox + 26, oy + 36],
        [ox + 27, oy + 57],
        [ox + 5, oy + 57],
      ],
      '#5B6B29'
    );
    // Jacket collar at the nape of the neck
    ctx.fillStyle = '#3F4B1B';
    ctx.fillRect(ox + 9, oy + 36, 14, 3);
    // Jacket back center seam & shoulder shading
    ctx.fillStyle = '#495620';
    ctx.fillRect(ox + 16, oy + 39, 1, 17);
    ctx.fillRect(ox + 7, oy + 54, 18, 3);

    // Left arm on the outside-left (swinging with stride)
    const armY = oy + 39 + Math.round(cfg.armSwing * 0.5);
    ctx.fillStyle = '#000000';
    ctx.fillRect(ox + 3, armY - 1, 5, 16);
    ctx.fillStyle = '#697A31';
    ctx.fillRect(ox + 4, armY, 3, 14);

    return c;
  });

  return { walkSW, walkNW };
}

/**
 * Builds an authentic Habbo seated avatar sprite (facing SW or NW).
 */
function createSeatedAvatarSprite(
  standingCanvas: HTMLCanvasElement,
  backView: boolean = false
): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 48;
  c.height = 84;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const poly = (pts: [number, number][], fill: string, stroke = '#000000') => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  if (!backView) {
    // Front-left ('sw') seated pose using the EXACT original pixel legs & shoes from standingCanvas!
    const legStartY = 57;
    const legH = standingCanvas.height - legStartY;
    // Draw the original pixel legs shifted forward-left for the seated posture
    ctx.drawImage(
      standingCanvas,
      0,
      legStartY,
      standingCanvas.width,
      legH,
      8,
      54,
      standingCanvas.width,
      legH - 2
    );
    // Draw the upper body on top
    ctx.drawImage(
      standingCanvas,
      0,
      0,
      standingCanvas.width,
      59,
      11,
      0,
      standingCanvas.width,
      59
    );
  } else {
    // Back-left ('nw') seated view (we see the back of Higma's head & jacket above the sofa backrest)
    const { walkNW } = createAvatarWalkFrames(standingCanvas);
    ctx.drawImage(walkNW[0], 0, 0, 44, 62, 5, 0, 44, 62);
  }

  return c;
}

export function loadHabboSpriteAtlas(): Promise<HabboSpriteAtlas> {
  if (atlas.ready) return Promise.resolve(atlas);
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    atlas.whiteSofaSE = createHabboWhiteSofaSprite('se');
    atlas.whiteSofaSW = createHabboWhiteSofaSprite('sw');
    atlas.whiteSofaNW = createHabboWhiteSofaSprite('nw');
    atlas.whiteSofaNE = createHabboWhiteSofaSprite('ne');

    const [
      sheetImg,
      avatarImg,
      cameraBotImg,
      dubbelImg,
      barrelImg,
      dragonImg,
      bbRedImg,
      bbBlueImg,
      bbGreenImg,
      bbYellowImg,
      spotlightImg,
      candleImg,
      refImg,
    ] = await Promise.all([
      loadImage('/resources/sprites/sheet.png'),
      loadImage('/resources/sprites/avatar.png'),
      loadImage('/resources/sprites/CameraBot.png'),
      loadImage('/resources/sprites/Dubbelfrisss.png'),
      loadImage('/resources/sprites/Barrel.png'),
      loadImage('/resources/sprites/Dragon.png'),
      loadImage('/resources/sprites/BBRed.png'),
      loadImage('/resources/sprites/BBblue.png'),
      loadImage('/resources/sprites/BBgreen.png'),
      loadImage('/resources/sprites/BByellow.png'),
      loadImage('/resources/sprites/GoldSpotlight.png'),
      loadImage('/resources/sprites/Candle.png'),
      loadImage('/assets/aistudio/image_65e4aaf0.png'),
    ]);

    if (sheetImg) {
      atlas.noobPlant = cropFromSheet(sheetImg, 1, 1, 40, 71);
    }
    if (avatarImg) {
      atlas.openHotelAvatar = cropFromSheet(
        avatarImg,
        0,
        0,
        avatarImg.width,
        avatarImg.height
      );
    }
    if (cameraBotImg) {
      atlas.cameraBot = cropFromSheet(cameraBotImg, 0, 396, 56, 52);
    }
    if (dubbelImg) {
      atlas.dubbelBottle = cropFromSheet(dubbelImg, 2, 74, 56, 114);
    }
    if (barrelImg) {
      atlas.barrel = cropFromSheet(barrelImg, 0, 0, 48, 66);
    }
    if (dragonImg) {
      // Dragon.png contains all 4 isometric rotations (NE, NW, SE, SW)!
      atlas.dragonFrames.ne = cropFromSheet(dragonImg, 1, 1, 69, 101);
      atlas.dragonFrames.nw = cropFromSheet(dragonImg, 72, 1, 69, 101);
      atlas.dragonFrames.se = cropFromSheet(dragonImg, 153, 1, 68, 101);
      atlas.dragonFrames.sw = cropFromSheet(dragonImg, 223, 1, 68, 101);
      atlas.dragonStatue = atlas.dragonFrames.se;
    }
    if (bbRedImg) {
      atlas.bbRed = cropFromSheet(bbRedImg, 0, 0, 43, 55);
    }
    if (bbBlueImg) {
      atlas.bbBlue = cropFromSheet(bbBlueImg, 0, 0, 43, 55);
    }
    if (bbGreenImg) {
      atlas.bbGreen = cropFromSheet(bbGreenImg, 0, 0, 43, 55);
    }
    if (bbYellowImg) {
      atlas.bbYellow = cropFromSheet(bbYellowImg, 0, 0, 43, 55);
    }
    if (spotlightImg) {
      atlas.goldSpotlightBase = cropFromSheet(spotlightImg, 1, 183, 61, 34);
      atlas.goldSpotlightBeam = cropFromSheet(spotlightImg, 1, 1, 61, 180);
    }
    if (candleImg) {
      atlas.candleFrames = [
        cropFromSheet(candleImg, 1, 1, 66, 70),
        cropFromSheet(candleImg, 69, 1, 66, 70),
        cropFromSheet(candleImg, 137, 1, 66, 70),
      ];
    }

    if (refImg) {
      const off = document.createElement('canvas');
      off.width = refImg.width;
      off.height = refImg.height;
      const octx = off.getContext('2d')!;
      octx.drawImage(refImg, 0, 0);

      atlas.crownPurple = extractKeyedSprite(octx, 425, 338, 29, 68, 52, true);
      atlas.crownGold = extractKeyedSprite(octx, 553, 326, 36, 66, 52, true);
      atlas.catBasket = extractKeyedSprite(octx, 251, 452, 58, 42, 45, true);
      atlas.emptyBasket = extractKeyedSprite(octx, 313, 421, 56, 39, 45, true);
      atlas.waterBowl = extractKeyedSprite(octx, 311, 457, 25, 18, 55, true);
      atlas.dragonDraco = extractKeyedSprite(octx, 368, 417, 26, 49, 50, true);
      atlas.higmaAvatar = extractKeyedSprite(octx, 395, 399, 33, 83, 50, true);

      const { walkSW, walkNW } = createAvatarWalkFrames(atlas.higmaAvatar);
      atlas.higmaWalkSW = walkSW;
      atlas.higmaWalkNW = walkNW;

      atlas.higmaSittingSW = createSeatedAvatarSprite(atlas.higmaAvatar, false);
      atlas.higmaSittingNW = createSeatedAvatarSprite(atlas.higmaAvatar, true);

      atlas.chatIconCat = cropFromSheet(refImg, 202, 179, 15, 15);
      atlas.chatIconHigma = cropFromSheet(refImg, 341, 100, 18, 19);
    }

    atlas.ready = true;
    return atlas;
  })();

  return loadingPromise;
}

export function getHabboSpriteAtlas(): HabboSpriteAtlas {
  return atlas;
}

export interface VisitorHabboSpriteSet {
  walkSW: HTMLCanvasElement[];
  walkNW: HTMLCanvasElement[];
  sittingSW: HTMLCanvasElement | null;
  sittingNW: HTMLCanvasElement | null;
  headIcon: HTMLCanvasElement | null;
}

const visitorSpriteCache: Record<string, VisitorHabboSpriteSet> = {};

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean,
    16
  );
  if (Number.isNaN(num)) return [59, 130, 246];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function recolorHabboAvatarCanvas(
  srcCanvas: HTMLCanvasElement,
  shirtHex: string,
  hairHex: string,
  pantsHex: string,
  keepCrown: boolean
): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = srcCanvas.width;
  c.height = srcCanvas.height;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(srcCanvas, 0, 0);

  const imgData = ctx.getImageData(0, 0, c.width, c.height);
  const d = imgData.data;
  const [sr, sg, sb] = hexToRgb(shirtHex);
  const [hr, hg, hb] = hexToRgb(hairHex);
  const [pr, pg, pb] = hexToRgb(pantsHex);

  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const idx = (y * c.width + x) * 4;
      const a = d[idx + 3];
      if (a === 0) continue;

      const r = d[idx];
      const g = d[idx + 1];
      const b = d[idx + 2];

      // Preserve crisp 1px dark outlines & eyes
      if (r < 38 && g < 38 && b < 38) continue;

      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 175;

      // Top royal crown region (y < 19): remove tall crown for regular visitors so they have a clean Habbo head/hair
      if (y < 19 && !keepCrown) {
        if (y < 15) {
          d[idx + 3] = 0;
          continue;
        }
        d[idx] = Math.min(255, Math.round(hr * lum));
        d[idx + 1] = Math.min(255, Math.round(hg * lum));
        d[idx + 2] = Math.min(255, Math.round(hb * lum));
        continue;
      }

      // Hair region (y = 12..37): silver-grey hair pixels
      if (
        y >= 12 &&
        y <= 37 &&
        Math.abs(r - g) <= 22 &&
        Math.abs(g - b) <= 24 &&
        r > 65
      ) {
        d[idx] = Math.min(255, Math.round(hr * lum));
        d[idx + 1] = Math.min(255, Math.round(hg * lum));
        d[idx + 2] = Math.min(255, Math.round(hb * lum));
        continue;
      }

      // Olive-green jacket / shirt region (y = 34..60): green-dominant pixels
      if (y >= 34 && y <= 60 && g > b + 8 && r > b) {
        d[idx] = Math.min(255, Math.round(sr * lum));
        d[idx + 1] = Math.min(255, Math.round(sg * lum));
        d[idx + 2] = Math.min(255, Math.round(sb * lum));
        continue;
      }

      // Slate-blue trousers region (y >= 54): cool slate pixels
      if (y >= 54 && b >= r && r < 140) {
        d[idx] = Math.min(255, Math.round(pr * lum * 1.15));
        d[idx + 1] = Math.min(255, Math.round(pg * lum * 1.15));
        d[idx + 2] = Math.min(255, Math.round(pb * lum * 1.15));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return c;
}

/**
 * Generates and caches an authentic pixel-art Habbo character sprite set for any VisitorAvatarProfile
 * using the real Habbo pixel avatar base (with true 3/4 isometric proportions, shading, walking & sitting frames).
 */
export function getOrCreateVisitorHabboSprites(profile: {
  id: string;
  shirtColor: string;
  hairColor: string;
  pantsColor: string;
  accessory: string;
}): VisitorHabboSpriteSet | null {
  if (!atlas.ready || !atlas.higmaAvatar || atlas.higmaWalkSW.length === 0) {
    return null;
  }
  const cacheKey = `${profile.shirtColor}_${profile.hairColor}_${profile.pantsColor}_${profile.accessory}`;
  if (visitorSpriteCache[cacheKey]) {
    return visitorSpriteCache[cacheKey];
  }

  // Never put hats/crowns on visitors so their head & hair look clean
  const keepCrown = false;
  const walkSW = atlas.higmaWalkSW.map((frame) =>
    recolorHabboAvatarCanvas(
      frame,
      profile.shirtColor,
      profile.hairColor,
      profile.pantsColor,
      keepCrown
    )
  );
  const walkNW = atlas.higmaWalkNW.map((frame) =>
    recolorHabboAvatarCanvas(
      frame,
      profile.shirtColor,
      profile.hairColor,
      profile.pantsColor,
      keepCrown
    )
  );
  const sittingSW = atlas.higmaSittingSW
    ? recolorHabboAvatarCanvas(
        atlas.higmaSittingSW,
        profile.shirtColor,
        profile.hairColor,
        profile.pantsColor,
        keepCrown
      )
    : null;
  const sittingNW = atlas.higmaSittingNW
    ? recolorHabboAvatarCanvas(
        atlas.higmaSittingNW,
        profile.shirtColor,
        profile.hairColor,
        profile.pantsColor,
        keepCrown
      )
    : null;

  // Crop a 28x30 head bust icon for the Habbo bottom chat bar
  const headIcon = document.createElement('canvas');
  headIcon.width = 30;
  headIcon.height = 32;
  const hctx = headIcon.getContext('2d')!;
  hctx.imageSmoothingEnabled = false;
  if (walkSW[0]) {
    hctx.drawImage(walkSW[0], 7, 4, 30, 32, 0, 0, 30, 32);
  }

  const set: VisitorHabboSpriteSet = {
    walkSW,
    walkNW,
    sittingSW,
    sittingNW,
    headIcon,
  };
  visitorSpriteCache[cacheKey] = set;
  return set;
}
