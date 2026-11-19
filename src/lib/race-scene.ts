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

const laneZ = (i: number, n: number) => (i - (n - 1) / 2) * (LANE_W + LANE_GAP);

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
  const n = runners.length;
  const spread = n * LANE_W + (n - 1) * LANE_GAP;

  // --- ground --------------------------------------------------------
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(TRACK_LEN + 26, spread + 9),
    new THREE.MeshBasicMaterial({ color: 0xe8ebf3 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(TRACK_LEN / 2, -0.02, 0);
  scene.add(ground);

  // --- one lane per runner -------------------------------------------
  runners.forEach((r, i) => {
    const lane = new THREE.Mesh(
      new THREE.PlaneGeometry(TRACK_LEN, LANE_W),
      new THREE.MeshBasicMaterial({ color: LANE_TINT[r.mascot as 'fox' | 'rabbit'] ?? 0xf0f0f0 })
    );
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(TRACK_LEN / 2, 0, laneZ(i, n));
    scene.add(lane);
  });

  // --- week lines, start and finish ----------------------------------
  for (let w = 0; w <= 12; w++) {
    const x = (w / 12) * TRACK_LEN;
    const edge = w === 0 || w === 12;
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(edge ? 0.9 : 0.3, spread + 2),
      new THREE.MeshBasicMaterial({ color: edge ? 0x22232e : 0xccd2e2 })
    );
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, 0.03, 0);
    scene.add(line);
  }

  // Where today falls on the track, so progress reads against the calendar
  // rather than against nothing.
  const pace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, spread + 7),
    new THREE.MeshBasicMaterial({ color: 0xe8a93c })
  );
  pace.rotation.x = -Math.PI / 2;
  pace.position.set((Math.max(0, Math.min(100, dayPct)) / 100) * TRACK_LEN, 0.04, 0);
  scene.add(pace);

  // --- runners ---------------------------------------------------------
  const bob: { sprite: THREE.Sprite; phase: number }[] = [];
  const SIZE = 15;

  runners.forEach((r, i) => {
    const x = (Math.max(0, Math.min(100, r.pct)) / 100) * TRACK_LEN;
    const z = laneZ(i, n);
    const map = textures[i];

    const sprite = new THREE.Sprite(
      map
        ? new THREE.SpriteMaterial({ map, transparent: true })
        : new THREE.SpriteMaterial({ color: COLOUR[r.mascot as 'fox' | 'rabbit'] ?? 0x888888 })
    );
    sprite.scale.set(SIZE, SIZE, 1);
    sprite.position.set(x, SIZE / 2, z);
    scene.add(sprite);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(SIZE * 0.26, 20),
      new THREE.MeshBasicMaterial({ color: 0x22232e, transparent: true, opacity: 0.16 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(x, 0.05, z);
    scene.add(shadow);

    bob.push({ sprite, phase: i * 1.7 });
  });

  // --- camera ----------------------------------------------------------
  // Framed to hold the whole track plus the runners' height, so the finish
  // line is always in shot however far along they are.
  const camera = new THREE.PerspectiveCamera(36, aspect, 0.1, 600);
  const halfV = THREE.MathUtils.degToRad(36) / 2;
  const halfH = Math.atan(Math.tan(halfV) * aspect);
  const needed = (TRACK_LEN / 2 + 3) / Math.tan(halfH);

  // Roughly 38 degrees above the track: shallow enough to keep a sense of
  // distance, steep enough that the two lanes read as separate rather than
  // stacking into one line.
  const centre = new THREE.Vector3(TRACK_LEN / 2, -2, 0);
  camera.position.set(TRACK_LEN / 2, needed * 0.62, needed * 0.79);
  camera.lookAt(centre);

  scene.fog = new THREE.Fog(0xeef0f6, needed * 0.9, needed * 2.1);

  return { scene, camera, bob };
}
