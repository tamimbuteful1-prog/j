import React from 'react';

/** 'camera' = Tamim on camera with graphics around him; 'vo' = voice-over only, graphics fill the frame */
export type Variant = 'camera' | 'vo';
export const VariantCtx = React.createContext<Variant>('camera');
export const useVariant = () => React.useContext(VariantCtx);
