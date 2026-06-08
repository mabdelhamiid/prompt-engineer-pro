import { useState, useCallback } from "react";
import { useSessionStorage } from "./useSessionStorage";

export interface CustomTab {
  id: string;
  name: string;
  description?: string;
  framework: "CO-STAR" | "RISEN" | "RTF" | "CRAFT";
  systemPrompt?: string; // Custom system instructions
  temperature?: number; // AI temperature setting
  createdAt: number;
  updatedAt: number;
}

export interface CustomTabsState {
  tabs: CustomTab[];
}

const CUSTOM_TABS_KEY = "prompt_engineer_custom_tabs";

/**
 * Hook for managing custom generation logic tabs
 */
export function useCustomTabs() {
  const [state, updateState, clearState] = useSessionStorage<CustomTabsState>(
    CUSTOM_TABS_KEY,
    { tabs: [] }
  );

  const createTab = useCallback(
    (tab: Omit<CustomTab, "id" | "createdAt" | "updatedAt">) => {
      const newTab: CustomTab = {
        ...tab,
        id: `tab-${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      updateState({
        tabs: [...state.tabs, newTab],
      });

      return newTab;
    },
    [state.tabs, updateState]
  );

  const updateTab = useCallback(
    (id: string, updates: Partial<Omit<CustomTab, "id" | "createdAt">>) => {
      updateState({
        tabs: state.tabs.map((tab) =>
          tab.id === id
            ? { ...tab, ...updates, updatedAt: Date.now() }
            : tab
        ),
      });
    },
    [state.tabs, updateState]
  );

  const deleteTab = useCallback(
    (id: string) => {
      updateState({
        tabs: state.tabs.filter((tab) => tab.id !== id),
      });
    },
    [state.tabs, updateState]
  );

  const reorderTabs = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newTabs = [...state.tabs];
      const [removed] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, removed);
      updateState({ tabs: newTabs });
    },
    [state.tabs, updateState]
  );

  const getTab = useCallback(
    (id: string) => {
      return state.tabs.find((tab) => tab.id === id);
    },
    [state.tabs]
  );

  const clearAllTabs = useCallback(() => {
    clearState();
  }, [clearState]);

  return {
    tabs: state.tabs,
    createTab,
    updateTab,
    deleteTab,
    reorderTabs,
    getTab,
    clearAllTabs,
  };
}
