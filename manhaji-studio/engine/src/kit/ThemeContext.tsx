import React, {createContext, useContext} from 'react';
import {DARK, LIGHT, type Palette} from './theme';

const Ctx = createContext<Palette>(DARK);
export const ThemeProvider: React.FC<{mode?: 'dark' | 'light'; children: React.ReactNode}> = ({mode = 'dark', children}) => (
  <Ctx.Provider value={mode === 'light' ? LIGHT : DARK}>{children}</Ctx.Provider>
);
/** Current episode palette (dark by default). */
export const usePalette = () => useContext(Ctx);
