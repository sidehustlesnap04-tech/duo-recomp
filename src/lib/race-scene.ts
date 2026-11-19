import * as THREE from 'three';

export type Runner = {
  user_id: string;
  display_name: string;
  mascot: string;
  total: number;
  pct: number;
};

/** The track runs along +X: start at 0, finish at TRACK_LEN. Lanes sit side
 *  by side along Z, so a 3/4 camera can compare both positions at once —
 *  looking straight down the track makes one runner hide the other. */
export const TRACK_LEN = 100;
export const LANE_W = 17;

const COLOUR = { fox: 0xe0705a, rabbit: 0xd9548f } as const;
const INK = 0x22232e;

/* A modern blue surface rather than classic terracotta. Both runners are
   warm — coral and rose — and a red-clay track washes them out; blue is a
   real athletics surface and leaves the two of them the only warm thing in
   frame. */
const SURFACE = 0x7c9cc6;
const PAINT = 0xf4f7fb;
const INFIELD = 0x9fc6a9;

/** Lanes touch, sharing a painted line, the way real ones do. */
const laneZ = (i: number, n: number) => (i - (n - 1) / 2) * LANE_W;

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function sky(): THREE.Texture {
  return canvasTex(4, 128, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, '#c3d9f3');
    grad.addColorStop(0.58, '#e3eaf6');
    grad.addColorStop(1, '#eef0f6');
    g.fillStyle = grad;
    g.fillRect(0, 0, 4, 128);
  });
}

/** The chequered band every finish line has. */
function chequer(): THREE.Texture {
  const t = canvasTex(256, 64, (g) => {
    const s = 32;
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 8; x++) {
        g.fillStyle = (x + y) % 2 ? '#22232e' : '#ffffff';
        g.fillRect(x * s, y * s, s, s);
      }
    }
  });
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(3, 1);
  return t;
}

function numberTex(label: string, alpha = 0.92): THREE.Texture {
  return canvasTex(128, 128, (g) => {
    g.clearRect(0, 0, 128, 128);
    g.fillStyle = `rgba(244,247,251,${alpha})`;
    g.font = '700 96px system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(label, 64, 68);
  });
}

/** A name plate floating above a runner. */
function plate(text: string, accent: string): THREE.Sprite {
  const t = canvasTex(512, 128, (g) => {
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.roundRect(6, 6, 500, 116, 44);
    g.fill();
    g.fillStyle = accent;
    g.beginPath();
    g.arc(58, 64, 22, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#22232e';
    g.font = '600 54px system-ui, sans-serif';
    g.textBaseline = 'middle';
    g.fillText(text, 92, 68);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
  s.scale.set(19, 4.8, 1);
  return s;
}

const flat = (w: number, h: number, mat: THREE.Material, x: number, y: number, z: number) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  return m;
};

export function buildRaceScene(
  runners: Runner[],
  dayPct: number,
  textures: (THREE.Texture | null)[],
  aspect: number
) {
  const scene = new THREE.Scene();
  scene.background = sky();

  const n = runners.length;
  const spread = n * LANE_W;
  const half = spread / 2;
  const paintMat = new THREE.MeshBasicMaterial({ color: PAINT });

  // --- apron and infield -------------------------------------------------
  scene.add(flat(TRACK_LEN + 130, spread + 160, new THREE.MeshBasicMaterial({ color: 0xe6eaf3 }), TRACK_LEN / 2, -0.06, 0));
  scene.add(flat(TRACK_LEN + 46, 48, new THREE.MeshBasicMaterial({ color: INFIELD }), TRACK_LEN / 2, -0.03, -half - 28));

  // --- the running surface -------------------------------------------------
  scene.add(flat(TRACK_LEN + 18, spread, new THREE.MeshBasicMaterial({ color: SURFACE }), TRACK_LEN / 2 - 9, 0, 0));

  // --- painted lane lines, both outer edges included -----------------------
  for (let i = 0; i <= n; i++) {
    scene.add(flat(TRACK_LEN + 18, 0.7, paintMat, TRACK_LEN / 2 - 9, 0.02, -half + i * LANE_W));
  }

  // --- start line, blocks, lane numbers ------------------------------------
  scene.add(flat(1.6, spread, paintMat, 0, 0.03, 0));

  runners.forEach((_, i) => {
    const z = laneZ(i, n);

    const num = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 7),
      new THREE.MeshBasicMaterial({ map: numberTex(String(i + 1)), transparent: true })
    );
    num.rotation.x = -Math.PI / 2;
    num.position.set(-7, 0.03, z);
    scene.add(num);

    const block = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.3, 5), paintMat);
    block.position.set(-2, 0.65, z);
    scene.add(block);
  });

  // --- week marks across the surface, numbered at the edge ------------------
  for (let w = 1; w < 12; w++) {
    const x = (w / 12) * TRACK_LEN;
    scene.add(
      flat(0.45, spread, new THREE.MeshBasicMaterial({ color: PAINT, transparent: true, opacity: 0.5 }), x, 0.02, 0)
    );
    const tick = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 5),
      new THREE.MeshBasicMaterial({ map: numberTex(String(w), 0.75), transparent: true })
    );
    tick.rotation.x = -Math.PI / 2;
    tick.position.set(x, 0.03, half + 5);
    scene.add(tick);
  }

  // --- the finish -----------------------------------------------------------
  scene.add(flat(5, spread, new THREE.MeshBasicMaterial({ map: chequer() }), TRACK_LEN, 0.03, 0));

  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 13, 10), paintMat);
    post.position.set(TRACK_LEN, 6.5, side * (half + 2.5));
    scene.add(post);
  }
  const banner = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 2.2, spread + 5),
    new THREE.MeshBasicMaterial({ color: INK })
  );
  banner.position.set(TRACK_LEN, 12, 0);
  scene.add(banner);

  // Where today falls, so progress reads against the calendar.
  scene.add(
    flat(
      0.8,
      spread + 10,
      new THREE.MeshBasicMaterial({ color: 0xe8a93c }),
      (Math.max(0, Math.min(100, dayPct)) / 100) * TRACK_LEN,
      0.04,
      0
    )
  );

  // --- runners ---------------------------------------------------------------
  const bob: { sprite: THREE.Sprite; phase: number }[] = [];
  const SIZE = 14;

  runners.forEach((r, i) => {
    const x = (Math.max(0, Math.min(100, r.pct)) / 100) * TRACK_LEN;
    const z = laneZ(i, n);
    const hex = COLOUR[r.mascot as 'fox' | 'rabbit'] ?? 0x888888;
    const map = textures[i];

    // Ground covered, as a solid stripe down the middle of their lane.
    if (x > 0.5) {
      scene.add(flat(x, 4.2, new THREE.MeshBasicMaterial({ color: hex }), x / 2, 0.025, z));
    }

    const sprite = new THREE.Sprite(
      map ? new THREE.SpriteMaterial({ map, transparent: true }) : new THREE.SpriteMaterial({ color: hex })
    );
    sprite.scale.set(SIZE, SIZE, 1);
    sprite.position.set(x, SIZE / 2, z);
    scene.add(sprite);

    const tag = plate(`${r.display_name}  ${r.total.toLocaleString()}`, `#${hex.toString(16).padStart(6, '0')}`);
    // Thrown to opposite sides as well as different heights: when the two
    // are level, stacking them vertically alone still leaves one behind the
    // other.
    const tagX = i === 0 ? Math.max(8, x - 11) : Math.min(TRACK_LEN - 6, x + 11);
    tag.position.set(tagX, SIZE + 3 + i * 10, z);
    scene.add(tag);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(SIZE * 0.26, 20),
      new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.2 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(x, 0.05, z);
    scene.add(shadow);

    bob.push({ sprite, phase: i * 1.7 });
  });

  // --- camera -----------------------------------------------------------------
  // Holds the whole track. Zooming toward the runners sounds right when both
  // are near the start, but the lanes are deep against the length: close in
  // they swallow the frame and the camera ends up inside the track.
  const camera = new THREE.PerspectiveCamera(36, aspect, 0.1, 900);
  const halfV = THREE.MathUtils.degToRad(36) / 2;
  const halfH = Math.atan(Math.tan(halfV) * aspect);
  const needed = (TRACK_LEN / 2 + 21) / Math.tan(halfH);

  camera.position.set(TRACK_LEN / 2 - 6, needed * 0.58, needed * 0.8);
  camera.lookAt(new THREE.Vector3(TRACK_LEN / 2 - 6, -2, 0));

  scene.fog = new THREE.Fog(0xe3eaf6, needed * 1.2, needed * 3);

  return { scene, camera, bob };
}
