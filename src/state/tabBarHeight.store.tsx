import React, { createContext, useContext } from 'react';

const TabBarHeightContext = createContext(0);

export function TabBarHeightProvider({ height, children }: { height: number; children: React.ReactNode }) {
  return React.createElement(TabBarHeightContext.Provider, { value: height }, children);
}

export function useTabBarHeight() {
  return useContext(TabBarHeightContext);
}