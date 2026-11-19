import * as THREE from 'three';

export type Runner = {
  user_id: string;
  display_name: string;
  mascot: string;
  total: number;
  pct: number;
};

/** The track runs along +X: start at 0, finish at TRACK_LEN. Lanes are
 *  separated along Z, so a 3/4 camera can compare both positions at once —
 *  looking straight down the track makes one runner hide the other. */
export const TRACK_LEN = 100;
export const LANE_W = 19;
const LANE_GAP = 3;

const COLOUR = { fox: 0xe0705a, rabbit: 0xd9548f } as const;
const LANE_TINT = { fox: 0xfbe6df, rabbit: 0xfbe0ee } as const;
const INK = 0x22232e;

const laneZ = (i: number, n: number) => (i - (n - 1) / 2) * (LANE_W + LANE_GAP);

/** A sky that is a gradient rather than a flat fill, so the track has air. */
function skyTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, '#cfe0f7');
  grad.addColorStop(0.55, '#e7ecf7');
  grad.addColorStop(1, '#eef0f6');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A name plate floating above a runner. Drawn rather than modelled, so it
 *  stays legible at any distance. */
function plate(text: string, accent: string): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const g = c.getContext('2d')!;

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

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
  s.scale.set(19, 4.8, 1);
  return s;
}

/** Posts at every week line; a full arch at the start and the finish. */
function gate(x: number, spread: number, tall: boolean): THREE.Group {
  const g = new THREE.Group();
  const h = tall ? 15 : 7;
  const mat = new THREE.MeshBasicMaterial({ color: tall ? INK : 0xb9c1d6 });
  const r = tall ? 0.7 : 0.45;

  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 8), mat);
    post.position.set(x, h / 2, side * (spread / 2 + 3));
    g.add(post);
  }
  if (tall) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.6, spread + 6), mat);
    beam.position.set(x, h, 0);
    g.add(beam);
  }
  return g;
}

/**
 * Builds the race scene. Kept apart from the React component so the preview
 * harness renders exactly what the app renders, rather than a copy of it
 * that drifts.
 */
export function buildRaceScene(
  runners: Runner[],
  dayPct: number,
  textures: (THREE.Texture | null)[],
  aspect: number
) {
  const scene = new THREE.Scene();
  scene.background = skyTexture();

  const n = runners.length;
  const spread = n * LANE_W + (n - 1) * LANE_GAP;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(TRACK_LEN + 90, spread + 70),
    new THREE.MeshBasicMaterial({ color: 0xe4e8f2 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(TRACK_LEN / 2, -0.04, 0);
  scene.add(ground);

  // --- lanes, with a raised kerb on the outside ------------------------
  runners.forEach((r, i) => {
    const lane = new THREE.Mesh(
      new THREE.PlaneGeometry(TRACK_LEN, LANE_W),
      new THREE.MeshBasicMaterial({ color: LANE_TINT[r.mascot as 'fox' | 'rabbit'] ?? 0xf0f0f0 })
    );
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(TRACK_LEN / 2, 0, laneZ(i, n));
    scene.add(lane);

    const kerb = new THREE.Mesh(
      new THREE.BoxGeometry(TRACK_LEN, 0.9, 1.1),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    kerb.position.set(
      TRACK_LEN / 2,
      0.45,
      laneZ(i, n) + (i === 0 ? -LANE_W / 2 - 1 : LANE_W / 2 + 1)
    );
    scene.add(kerb);
  });

  // --- week lines and gates --------------------------------------------
  for (let w = 0; w <= 12; w++) {
    const x = (w / 12) * TRACK_LEN;
    const edge = w === 0 || w === 12;

    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(edge ? 1.2 : 0.35, spread + 2),
      new THREE.MeshBasicMaterial({ color: edge ? INK : 0xc3cadd })
    );
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, 0.03, 0);
    scene.add(line);
    scene.add(gate(x, spread, edge));
  }

  // Where today falls, so progress reads against the calendar.
  const pace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, spread + 7),
    new THREE.MeshBasicMaterial({ color: 0xe8a93c })
  );
  pace.rotation.x = -Math.PI / 2;
  pace.position.set((Math.max(0, Math.min(100, dayPct)) / 100) * TRACK_LEN, 0.05, 0);
  scene.add(pace);

  // --- runners ----------------------------------------------------------
  const bob: { sprite: THREE.Sprite; phase: number }[] = [];
  const SIZE = 15;

  runners.forEach((r, i) => {
    const x = (Math.max(0, Math.min(100, r.pct)) / 100) * TRACK_LEN;
    const z = laneZ(i, n);
    const key = r.mascot as 'fox' | 'rabbit';
    const hex = COLOUR[key] ?? 0x888888;
    const map = textures[i];

    const sprite = new THREE.Sprite(
      map ? new THREE.SpriteMaterial({ map, transparent: true }) : new THREE.SpriteMaterial({ color: hex })
    );
    sprite.scale.set(SIZE, SIZE, 1);
    sprite.position.set(x, SIZE / 2, z);
    scene.add(sprite);

    const tag = plate(`${r.display_name}  ${r.total.toLocaleString()}`, `#${hex.toString(16).padStart(6, '0')}`);
    // Offset to the runner's right and staggered in height: centred plates
    // hang off the frame at the start line, and stack on each other when the
    // two are neck and neck.
    tag.position.set(Math.min(x + 10, TRACK_LEN - 4), SIZE + 4 + i * 6.5, z);
    scene.add(tag);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(SIZE * 0.26, 20),
      new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.16 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(x, 0.06, z);
    scene.add(shadow);

    // A trail back to the start, so even a small lead reads as ground covered.
    if (x > 1) {
      const trail = new THREE.Mesh(
        new THREE.PlaneGeometry(x, 1.8),
        new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.55 })
      );
      trail.rotation.x = -Math.PI / 2;
      trail.position.set(x / 2, 0.07, z);
      scene.add(trail);
    }

    bob.push({ sprite, phase: i * 1.7 });
  });

  // --- camera ------------------------------------------------------------
  // Holds the whole track. Zooming toward the runners sounds right when both
  // are near the start, but the lanes are 41 units deep against 100 of
  // length: close in, they swallow the frame and the camera ends up inside
  // the track. The emptiness of day one is answered with scenery, not with
  // the camera.
  const camera = new THREE.PerspectiveCamera(36, aspect, 0.1, 900);
  const halfV = THREE.MathUtils.degToRad(36) / 2;
  const halfH = Math.atan(Math.tan(halfV) * aspect);
  // Generous margin, and biased a little toward the start. The camera is
  // angled, so the near lane projects wider than the far one: a runner at
  // zero in the near lane falls outside a frame that fits the far one. Day
  // one puts both of them exactly there.
  const needed = (TRACK_LEN / 2 + 21) / Math.tan(halfH);

  camera.position.set(TRACK_LEN / 2 - 6, needed * 0.6, needed * 0.78);
  camera.lookAt(new THREE.Vector3(TRACK_LEN / 2 - 6, -2, 0));

  scene.fog = new THREE.Fog(0xe7ecf7, needed * 1.2, needed * 2.8);

  return { scene, camera, bob };
}
