import {useVideoConfig} from 'remotion';

export const C = {
  bg0: '#0B0E12',
  bg1: '#12161D',
  bg2: '#1A2029',
  line: '#262E39',
  muted: '#8792A2',
  text: '#F3F5F7',
  teal: '#22D3C5',
  tealDeep: '#0F8F86',
  orange: '#FF8A3D',
  yellow: '#FFC845',
  red: '#FF4D5E',
  green: '#4ADE80',
};

export const F = {
  kufi: "'Kufi', 'Plex', sans-serif",
  plex: "'Plex', 'Kufi', sans-serif",
  mono: "'Mono', monospace",
};

export const useLayout = () => {
  const {width: W, height: H} = useVideoConfig();
  const isV = H > W;
  /** pick a value for landscape / vertical */
  const p = <T,>(land: T, vert: T): T => (isV ? vert : land);
  return {W, H, isV, p};
};
