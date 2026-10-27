import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {COLORS, FONTS} from './theme';
import {EASE, clamp01, pop, ramp} from './anim';
import {useTimeline} from '../timeline/context';
import {usePalette} from './ThemeContext';

export type HookOverlayProps = {frame: number; clipT: number; inHold: boolean; out: number; top: number};

export type HookFrameProps = {
  /** published path of the presenter's clip (final) — omit in preview */
  src?: string;
  framing: 'fit' | 'fill';
  trimStartSec: number;
  hookText: string;
  keyWord?: string;
  meta: {subject_ar: string; grade_ar: string; lesson_ar: string};
  /** optional episode-specific card under the footage (e.g. the logic episode's «و/أو» order card) */
  Overlay?: React.FC<HookOverlayProps>;
};

const CARD = {x: 44, w: 992, r: 44};
const cardH = Math.round((CARD.w * 9) / 16);
const CARD_TOP = 560;

/**
 * The real hook, untouched: presenter's face/voice are never regenerated or zoomed.
 *  • landscape master → 'fit': framed card inside the Manhaji world (header + card + overlay)
 *  • vertical master  → 'fill': full screen
 *  • optional hold-frame on the key word (picture + sound pause) when its time is known
 *  • exit: the footage card flies past camera into scene 1
 */
export const HookFrame: React.FC<HookFrameProps> = (p) => {
  const frame = useCurrentFrame();
  const tl = useTimeline();
  const fps = tl.fps;
  const h = tl.hook;
  const kwF = h.keyWordSec !== null ? Math.round(h.keyWordSec * fps) : null;
  const hold = kwF !== null ? h.holdFrames : 0;
  const clipFrames = Math.round(h.clipSec * fps);
  const clipFrame = kwF === null || frame < kwF ? frame : frame < kwF + hold ? kwF : frame - hold;
  const clipT = Math.min(clipFrame, clipFrames - 1) / fps;
  const inHold = kwF !== null && frame >= kwF && frame < kwF + hold;

  const hookFrames = Math.round(h.end * fps);
  const exitFrames = Math.round(h.exitSec * fps);
  const e = clamp01((frame - (hookFrames - exitFrames)) / exitFrames);
  const e1 = EASE.inOut(clamp01(e / 0.55));
  const e2 = EASE.in(clamp01((e - 0.42) / 0.58));
  const layoutOut = EASE.inOut(clamp01(e / 0.5));
  const intro = ramp(frame, 0, 0.45, EASE.out);

  const footage = p.src ? (
    <ClipTimeline src={p.src} trimStartFrames={Math.round(p.trimStartSec * fps)} kwF={kwF} hold={hold} clipFrames={clipFrames} />
  ) : (
    <PreviewSlate text={p.hookText} />
  );

  const fly: React.CSSProperties = {
    transform: `translateX(${60 * e1 + 980 * e2}px) rotateY(${-22 * e1 - 40 * e2}deg) scale(${(1 - 0.12 * e1) * (1 + e2 * 0.9)})`,
    filter: e2 > 0.02 ? `blur(${e2 * 16}px)` : undefined,
    opacity: 1 - clamp01((e - 0.85) / 0.15),
  };

  if (p.framing === 'fill') {
    return (
      <AbsoluteFill style={{perspective: 1700}}>
        <AbsoluteFill style={{...fly, borderRadius: e1 * 60, overflow: 'hidden'}}>{footage}</AbsoluteFill>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{perspective: 1700}}>
      <AbsoluteFill style={{opacity: 1 - layoutOut}}>
        <World frame={frame} />
      </AbsoluteFill>
      <Header frame={frame} out={layoutOut} meta={p.meta} />
      <div style={{position: 'absolute', left: CARD.x, top: CARD_TOP, width: CARD.w, height: cardH, transformOrigin: '50% 50%', ...fly, transform: `${fly.transform} scale(${0.96 + 0.04 * intro})`}}>
        <div style={{position: 'absolute', inset: -40, borderRadius: CARD.r + 40, background: `radial-gradient(closest-side, ${COLORS.or}40, transparent)`, filter: 'blur(30px)', opacity: 0.7}} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: CARD.r,
            overflow: 'hidden',
            boxShadow: '0 50px 120px rgba(0,0,0,0.6)',
            filter: inHold && kwF !== null ? `saturate(${1 - 0.6 * Math.sin(((frame - kwF) / hold) * Math.PI)})` : undefined,
          }}
        >
          {footage}
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0) 22%)'}} />
          <div style={{position: 'absolute', inset: 0, borderRadius: CARD.r, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.16), inset 0 -40px 60px rgba(0,0,0,0.25)'}} />
        </div>
      </div>
      {p.Overlay ? (
        <p.Overlay frame={frame} clipT={clipT} inHold={inHold} out={layoutOut} top={CARD_TOP + cardH + 56} />
      ) : (
        <HookTextCard frame={frame} clipT={clipT} clipSec={h.clipSec} inHold={inHold} out={layoutOut} top={CARD_TOP + cardH + 56} text={p.hookText} keyWord={p.keyWord} />
      )}
    </AbsoluteFill>
  );
};

/** play → (hold on key word, silent) → play → hold last frame (silent) */
const ClipTimeline: React.FC<{src: string; trimStartFrames: number; kwF: number | null; hold: number; clipFrames: number}> = ({src, trimStartFrames, kwF, hold, clipFrames}) => {
  const s = staticFile(src);
  const style: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover'};
  const T = trimStartFrames;
  const split = kwF ?? clipFrames;
  return (
    <>
      <Sequence durationInFrames={split} layout="none">
        <OffthreadVideo src={s} style={style} trimBefore={T} />
      </Sequence>
      {kwF !== null && hold > 0 && (
        <>
          <Sequence from={kwF} durationInFrames={hold} layout="none">
            <Freeze frame={kwF + T}>
              <OffthreadVideo src={s} style={style} muted />
            </Freeze>
          </Sequence>
          <Sequence from={kwF + hold} durationInFrames={clipFrames - kwF} layout="none">
            <OffthreadVideo src={s} style={style} trimBefore={T + kwF} />
          </Sequence>
        </>
      )}
      <Sequence from={clipFrames + hold} layout="none">
        <Freeze frame={T + clipFrames - 1}>
          <OffthreadVideo src={s} style={style} muted />
        </Freeze>
      </Sequence>
    </>
  );
};

const PreviewSlate: React.FC<{text: string}> = ({text}) => (
  <AbsoluteFill style={{background: 'radial-gradient(800px 500px at 50% 45%, #3B3330, #15110F 80%)', alignItems: 'center', justifyContent: 'center', gap: 18}}>
    <div dir="ltr" style={{fontFamily: FONTS.text, fontWeight: 700, fontSize: 26, letterSpacing: '0.4em', color: 'rgba(255,255,255,0.55)'}}>
      HOOK · HIGGSFIELD
    </div>
    <div dir="rtl" style={{fontFamily: FONTS.display, fontWeight: 800, fontSize: 44, color: 'rgba(255,255,255,0.85)', padding: '0 60px', textAlign: 'center', lineHeight: 1.4}}>
      {text}
    </div>
    <div dir="rtl" style={{fontFamily: FONTS.text, fontSize: 24, color: 'rgba(255,255,255,0.4)'}}>
      تُستبدل بلقطة المقدم من 01_hook
    </div>
  </AbsoluteFill>
);

const World: React.FC<{frame: number}> = ({frame}) => {
  const drift = Math.sin(frame / 50) * 40;
  const pal = usePalette();
  if (pal.mode === 'light')
    return (
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #FFFDF8, #F5EEE3)'}}>
        <AbsoluteFill style={{background: `radial-gradient(900px 700px at ${540 + drift}px 860px, ${pal.p}22, transparent 70%), radial-gradient(700px 600px at ${200 - drift}px 1500px, ${pal.q}22, transparent 70%)`}} />
        <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(26,31,51,0.10) 1.6px, transparent 1.8px)', backgroundSize: '36px 36px', backgroundPosition: `0px ${(frame * 0.4) % 36}px`, maskImage: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.9), rgba(0,0,0,0) 75%)', WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.9), rgba(0,0,0,0) 75%)'}} />
      </AbsoluteFill>
    );
  return (
    <AbsoluteFill style={{background: COLORS.ink}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 700px at ${540 + drift}px 860px, rgba(95,160,255,0.20), transparent 70%),
            radial-gradient(700px 600px at ${200 - drift}px 1500px, rgba(167,123,255,0.16), transparent 70%),
            radial-gradient(600px 500px at ${900 + drift}px 300px, rgba(242,181,58,0.10), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.10) 1.6px, transparent 1.8px)',
          backgroundSize: '36px 36px',
          backgroundPosition: `0px ${(frame * 0.4) % 36}px`,
          maskImage: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.9), rgba(0,0,0,0) 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.9), rgba(0,0,0,0) 75%)',
        }}
      />
    </AbsoluteFill>
  );
};

export const ManhajiMark: React.FC<{size?: number}> = ({size = 54}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.3, background: `linear-gradient(140deg, ${COLORS.or}, ${COLORS.and})`, position: 'relative', flexShrink: 0}}>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{position: 'absolute', right: size * (0.2 + i * 0.22), bottom: size * 0.22, width: size * 0.15, height: size * (0.18 + i * 0.17), borderRadius: size * 0.05, background: '#fff'}} />
    ))}
  </div>
);

const Header: React.FC<{frame: number; out: number; meta: HookFrameProps['meta']}> = ({frame, out, meta}) => {
  const p = ramp(frame, 0.05, 0.6, EASE.out);
  const pal = usePalette();
  return (
    <div dir="rtl" style={{position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: p * (1 - out), transform: `translateY(${(1 - p) * 20 - out * 60}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
        <ManhajiMark />
        <span style={{fontFamily: FONTS.display, fontWeight: 900, fontSize: 56, color: pal.text}}>منهجي</span>
      </div>
      <div style={{fontFamily: FONTS.text, fontWeight: 500, fontSize: 30, color: pal.sub}}>
        درس <span style={{color: pal.accent, fontWeight: 700}}>{meta.lesson_ar}</span> · {meta.subject_ar} {meta.grade_ar}
      </div>
    </div>
  );
};

/** Default overlay: the hook sentence appears word by word with the spoken clip; key word glows on the hold. */
const HookTextCard: React.FC<{frame: number; clipT: number; clipSec: number; inHold: boolean; out: number; top: number; text: string; keyWord?: string}> = ({
  frame,
  clipT,
  clipSec,
  inHold,
  out,
  top,
  text,
  keyWord,
}) => {
  const p = pop(frame, 0.25, {damping: 16, stiffness: 130});
  const pal = usePalette();
  const words = text.split(/\s+/).filter(Boolean);
  const shown = interpolate(clipT, [0.2, Math.max(0.3, clipSec - 0.3)], [0, words.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top, minHeight: 200, opacity: clamp01(p) * (1 - out), transform: `translateY(${(1 - p) * 60 + out * 80}px)`}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 36, background: pal.mode === 'light' ? '#FFFFFF' : 'linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))', border: `1.5px solid ${inHold ? pal.p : pal.line}`, boxShadow: `0 30px 80px rgba(0,0,0,${pal.mode === 'light' ? 0.12 : 0.45})${inHold ? `, 0 0 50px ${pal.p}66` : ''}`}} />
      <div dir="rtl" style={{position: 'relative', padding: '34px 40px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 18, fontFamily: FONTS.display, fontWeight: 800, fontSize: 58, lineHeight: 1.45}}>
        {words.map((w, i) => {
          const on = clamp01(shown - i);
          const isKey = keyWord && w.includes(keyWord);
          return (
            <span key={i} style={{opacity: 0.18 + 0.82 * on, color: isKey ? pal.p : pal.text, transform: `scale(${isKey && inHold ? 1.15 : 1})`, display: 'inline-block', textShadow: isKey && on > 0.5 ? `0 0 26px ${COLORS.orGlow}` : undefined}}>
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
