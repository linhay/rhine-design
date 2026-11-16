import { createContext, useContext, type ReactNode } from 'react';

export type Density = 'regular' | 'compact';
const ConfigContext = createContext<{ density: Density }>({ density: 'regular' });

export function ConfigProvider({ density = 'regular', children }: { density?: Density; children: ReactNode }) {
  return <ConfigContext.Provider value={{ density }}><div className="rhine-config" data-density={density} data-rhine-density={density}>{children}</div></ConfigContext.Provider>;
}
export function useConfig() { return useContext(ConfigContext); }
