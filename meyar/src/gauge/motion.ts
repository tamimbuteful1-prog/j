// Scroll choreography for the gauge. Native scrolling is never intercepted:
// each frame reads where the DOM "slots" are and eases the 3D gauge toward
// them. Everything here is decorative; tools work without it.
import type { Gauge, Pose } from './scene';
import { ZONE_ANGLE } from './dial';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const span = (v: number, a: number, b: number) => clamp((v - a) / (b - a));

export interface MotionOpts {
  reduced: boolean;
  lite: boolean;
}

export function startMotion(gauge: Gauge, canvas: HTMLCanvasElement, opts: MotionOpts) {
  const heroSlot = document.getElementById('hero-slot')!;
  const anat = document.getElementById('anatomy')!;
  const anatSlot = document.getElementById('anatomy-slot')!;
  const steps = [...document.querySelectorAll<HTMLElement>('[data-step]')];

  let W = 0;
  let H = 0;
  const resize = () => {
    W = window.innerWidth;
    H = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, opts.lite ? 1.5 : 2);
    gauge.resize(W, H, dpr);
    dirty = true;
  };

  const cur: Pose = { x: 0, y: 0, scale: 1, rotX: 0.1, rotY: -0.4, explode: 0, needle: 90 };
  let first = true;
  let dirty = true;
  let pointerX = 0;
  let pointerY = 0;
  let running = false;
  let last = performance.now();
  let visibleCanvas = true;

  if (!opts.reduced && matchMedia('(pointer: fine)').matches) {
    window.addEventListener(
      'pointermove',
      (e) => {
        pointerX = (e.clientX / W) * 2 - 1;
        pointerY = (e.clientY / H) * 2 - 1;
      },
      { passive: true },
    );
  }

  const toWorld = (r: DOMRect) => {
    const k = gauge.visibleHeight() / H;
    return {
      x: (r.left + r.width / 2 - W / 2) * k,
      y: -(r.top + r.height / 2 - H / 2) * k,
      scale: (r.width * k) / 2.5,
    };
  };

  const target = (time: number): { pose: Pose; opacity: number; q: number } => {
    const h = toWorld(heroSlot.getBoundingClientRect());
    const ar = anat.getBoundingClientRect();
    const a = toWorld(anatSlot.getBoundingClientRect());
    // hero -> anatomy hand-off as the dark stage enters the viewport
    const t = ease(span(H - ar.top, H * 0.15, H * 1.0));
    // progress through the pinned anatomy stage
    const q = clamp(-ar.top / Math.max(1, ar.height - H));
    const heroScroll = clamp(window.scrollY / H);

    const idle = opts.reduced ? 0 : time / 1000;
    // Hero: a slow illustrative sweep — explicitly not a result.
    const heroNeedle = opts.reduced ? ZONE_ANGLE.neutral : 90 + Math.sin(idle * 0.42) * 62 + Math.sin(idle * 1.3) * 4;
    const hero: Pose = {
      ...h,
      rotX: 0.1 + heroScroll * 0.22 + pointerY * 0.06,
      rotY: -0.42 - heroScroll * 0.25 + pointerX * 0.1,
      explode: heroScroll * 0.12,
      needle: heroNeedle,
    };

    // Anatomy: turn to three-quarter view, open the layers, walk the zones, close.
    const open = ease(span(q, 0.04, 0.32)) * (1 - ease(span(q, 0.8, 0.97)));
    const turn = ease(span(q, 0.0, 0.3));
    const face = ease(span(q, 0.78, 0.98));
    let needle = 90;
    if (q < 0.4) needle = lerp(heroNeedle, 90, ease(span(q, 0, 0.2)));
    else if (q < 0.55) needle = lerp(90, ZONE_ANGLE.green, ease(span(q, 0.4, 0.5)));
    else if (q < 0.7) needle = lerp(ZONE_ANGLE.green, ZONE_ANGLE.neutral, ease(span(q, 0.55, 0.62)));
    else needle = lerp(ZONE_ANGLE.neutral, ZONE_ANGLE.red, ease(span(q, 0.7, 0.77)));
    const anatomy: Pose = {
      ...a,
      rotX: lerp(lerp(0.18, 0.36, turn), 0.05, face),
      rotY: lerp(lerp(-0.45, -0.78, turn), -0.15, face),
      explode: open,
      needle: opts.reduced ? ZONE_ANGLE.neutral : needle,
    };

    const pose: Pose = {
      x: lerp(hero.x, anatomy.x, t),
      y: lerp(hero.y, anatomy.y, t),
      scale: lerp(hero.scale, anatomy.scale, t),
      rotX: lerp(hero.rotX, anatomy.rotX, t),
      rotY: lerp(hero.rotY, anatomy.rotY, t),
      explode: lerp(hero.explode, anatomy.explode, t),
      needle: lerp(hero.needle, anatomy.needle, t),
    };
    if (opts.reduced) Object.assign(pose, { rotX: 0.08, rotY: -0.32, explode: 0, needle: ZONE_ANGLE.neutral });
    // fade out once the stage scrolls away
    const opacity = 1 - span(H - ar.bottom, -H * 0.05, H * 0.32);
    return { pose, opacity, q };
  };

  let activeStep = -1;
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const { pose, opacity, q } = target(now);
    const k = first || opts.reduced ? 1 : 1 - Math.exp(-dt * 7.5);
    const kNeedle = first || opts.reduced ? 1 : 1 - Math.exp(-dt * 4.5);
    first = false;
    let delta = 0;
    for (const key of ['x', 'y', 'scale', 'rotX', 'rotY', 'explode'] as const) {
      const d = pose[key] - cur[key];
      cur[key] += d * k;
      delta += Math.abs(d);
    }
    cur.needle += (pose.needle - cur.needle) * kNeedle;
    const show = opacity > 0.01;
    canvas.style.opacity = String(opacity);
    if (show !== visibleCanvas) {
      visibleCanvas = show;
      canvas.style.visibility = show ? 'visible' : 'hidden';
    }
    if (show && (delta > 1e-4 || dirty || !opts.reduced)) {
      gauge.setPose(cur);
      gauge.render();
      dirty = false;
    }
    // caption steps inside the pinned stage
    const idx = q <= 0.02 ? -1 : q < 0.4 ? 0 : q < 0.55 ? 1 : q < 0.7 ? 2 : q < 0.82 ? 3 : 4;
    if (idx !== activeStep) {
      activeStep = idx;
      steps.forEach((s) => s.classList.toggle('is-on', Number(s.dataset.step) === idx));
    }
    if (running) requestAnimationFrame(frame);
  };

  const start = () => {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
  };

  // Only animate while the hero or the stage is on screen and the tab is visible.
  let onScreen = true;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) (e.target as HTMLElement).dataset.vis = e.isIntersecting ? '1' : '0';
      onScreen = [heroSlot, anat].some((el) => el.dataset.vis === '1');
      if (onScreen && !document.hidden) start();
      else stop();
    },
    { rootMargin: '20% 0px' },
  );
  io.observe(heroSlot);
  io.observe(anat);
  document.addEventListener('visibilitychange', () => (document.hidden || !onScreen ? stop() : start()));
  window.addEventListener('resize', resize, { passive: true });
  if (opts.reduced) {
    // no continuous loop: re-render only when layout or scroll changes
    const once = () => {
      if (!running) requestAnimationFrame((t) => frame(t));
    };
    window.addEventListener('scroll', once, { passive: true });
  }
  resize();
  start();
  if (opts.reduced) stop();
  frame(performance.now());
}
