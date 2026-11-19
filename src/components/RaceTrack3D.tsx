'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import Mascot from '@/components/Mascot';
import { buildRaceScene, type Runner } from '@/lib/race-scene';

export type { Runner };

/** Serialises a rendered <svg> into a texture, so the runners are the same
 *  artwork as everywhere else rather than a second set of characters. */
async function svgTexture(host: HTMLElement): Promise<THREE.Texture | null> {
  const svg = host.querySelector('svg');
  if (!svg) return null;
  try {
    const markup = new XMLSerializer().serializeToString(svg);
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
    const texture = await new THREE.TextureLoader().loadAsync(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  } catch {
    return null;
  }
}

export default function RaceTrack3D({ runners, dayPct }: { runners: Runner[]; dayPct: number }) {
  const mount = useRef<HTMLDivElement>(null);
  const hidden = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = mount.current;
    const sprites = hidden.current;
    if (!host || !sprites || runners.length === 0) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }

    const height = 215;
    const width = host.clientWidth || 360;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    let raf = 0;
    let disposed = false;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clock = new THREE.Clock();
    let built: ReturnType<typeof buildRaceScene> | null = null;

    const draw = () => {
      if (!built) return;
      if (!still) {
        const t = clock.getElapsedTime();
        for (const m of built.bob) {
          m.sprite.position.y = 2.7 + Math.sin(t * 2.4 + m.phase) * 0.22;
        }
      }
      renderer.render(built.scene, built.camera);
    };

    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };

    const onResize = () => {
      if (!built) return;
      const w = host.clientWidth || width;
      renderer.setSize(w, height);
      built.camera.aspect = w / height;
      built.camera.updateProjectionMatrix();
      draw();
    };

    (async () => {
      const hosts = Array.from(sprites.children) as HTMLElement[];
      const textures = await Promise.all(runners.map((_, i) => svgTexture(hosts[i])));
      if (disposed) return;
      built = buildRaceScene(runners, dayPct, textures, width / height);
      if (still) draw();
      else loop();
    })();

    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      built?.scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
      host.replaceChildren();
    };
  }, [runners, dayPct]);

  if (failed) {
    // No WebGL: a flat track still answers the only question that matters.
    return (
      <div style={{ padding: 'var(--s4)' }}>
        {runners.map((r) => (
          <div key={r.user_id} style={{ marginBottom: 12 }}>
            <div className="row between tiny">
              <span>{r.display_name}</span>
              <span className="num">{r.total.toLocaleString()}</span>
            </div>
            <div style={{ height: 9, borderRadius: 999, background: 'rgba(34,35,46,.07)', marginTop: 4 }}>
              <div
                style={{
                  width: `${r.pct}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: r.mascot === 'fox' ? 'var(--coral)' : 'var(--jade)'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div ref={mount} style={{ height: 215, width: '100%' }} />
      {/* Rendered only to be serialised into textures; never shown. */}
      <div ref={hidden} aria-hidden style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        {runners.map((r) => (
          <div key={r.user_id}>
            <Mascot animal={r.mascot as 'fox' | 'rabbit'} pose="run" size={128} />
          </div>
        ))}
      </div>
    </>
  );
}
