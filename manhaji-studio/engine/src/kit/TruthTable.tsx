import React from 'react';
import {COLORS, FONTS} from './theme';
import {LogicSymbol} from './LogicSymbol';

export type Row = {aish: boolean; samoli: boolean; result: boolean; progress: number; active?: number};

const Mark: React.FC<{v: boolean; size?: number; p: number}> = ({v, size = 46, p}) => {
  const c = v ? COLORS.true : COLORS.false;
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" style={{transform: `scale(${0.5 + 0.5 * p})`, opacity: p}}>
      <circle cx={23} cy={23} r={21} fill={`${c}22`} stroke={c} strokeWidth={3} />
      {v ? (
        <path d="M13 24 L20 31 L34 16" stroke={c} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M15 15 L31 31 M31 15 L15 31" stroke={c} strokeWidth={5} fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
};

/** Compact infographic truth table (RTL): عيش | صامولي | النتيجة */
export const TruthTable: React.FC<{
  x: number;
  y: number;
  rows: Row[];
  op: 'or' | 'and';
  appear: number;
  width?: number;
  highlightResult?: number;
}> = ({x, y, rows, op, appear, width = 780, highlightResult = 0}) => {
  const accent = op === 'or' ? COLORS.or : COLORS.and;
  const rowH = 74;
  const col = (n: number): React.CSSProperties => ({
    flex: n,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });
  return (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        left: x - width / 2,
        top: y,
        width,
        opacity: appear,
        transform: `translateY(${(1 - appear) * 30}px)`,
        borderRadius: 32,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))',
        border: '1.5px solid rgba(255,255,255,0.12)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
        padding: '14px 22px 18px',
        fontFamily: FONTS.display,
        color: COLORS.paper,
        overflow: 'hidden',
      }}
    >
      <div style={{display: 'flex', height: 70, alignItems: 'center', fontWeight: 800, fontSize: 36, borderBottom: '1.5px solid rgba(255,255,255,0.12)'}}>
        <div style={{...col(1), color: COLORS.aish}}>عيش</div>
        <div style={{...col(1), color: COLORS.samoli}}>صامولي</div>
        <div style={{...col(1.3), gap: 12}}>
          <span>النتيجة</span>
          <LogicSymbol op={op} size={30} color={accent} stroke={16} />
        </div>
      </div>
      {rows.map((r, i) => {
        const rc = r.result ? COLORS.true : COLORS.false;
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              height: rowH,
              alignItems: 'center',
              opacity: 0.25 + 0.75 * r.progress,
              background: r.active ? `rgba(255,255,255,${0.07 * r.active})` : undefined,
              borderRadius: 18,
              marginTop: 6,
            }}
          >
            <div style={col(1)}>
              <Mark v={r.aish} p={r.progress} />
            </div>
            <div style={col(1)}>
              <Mark v={r.samoli} p={r.progress} />
            </div>
            <div style={col(1.3)}>
              <span
                dir="ltr"
                style={{
                  fontFamily: FONTS.text,
                  fontWeight: 700,
                  fontSize: 38,
                  letterSpacing: '0.05em',
                  color: rc,
                  opacity: r.progress,
                  textShadow: highlightResult ? `0 0 ${24 * highlightResult}px ${rc}` : undefined,
                  transform: `scale(${1 + 0.08 * highlightResult})`,
                }}
              >
                {r.result ? 'TRUE' : 'FALSE'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
