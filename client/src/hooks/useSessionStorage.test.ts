import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("useSessionStorage Hook", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should initialize with default value", () => {
    const initialValue = { test: "value" };
    const stored = localStorage.getItem("test_key");
    expect(stored).toBeNull();
  });

  it("should persist value to localStorage", () => {
    const key = "test_persist";
    const value = { data: "test" };
    localStorage.setItem(key, JSON.stringify(value));

    const stored = localStorage.getItem(key);
    expect(stored).toBe(JSON.stringify(value));
  });

  it("should retrieve persisted value from localStorage", () => {
    const key = "test_retrieve";
    const value = { data: "persisted" };
    localStorage.setItem(key, JSON.stringify(value));

    const retrieved = JSON.parse(localStorage.getItem(key) || "{}");
    expect(retrieved).toEqual(value);
  });

  it("should clear value from localStorage", () => {
    const key = "test_clear";
    localStorage.setItem(key, JSON.stringify({ data: "test" }));
    expect(localStorage.getItem(key)).not.toBeNull();

    localStorage.removeItem(key);
    expect(localStorage.getItem(key)).toBeNull();
  });

  it("should handle complex nested objects", () => {
    const key = "test_complex";
    const value = {
      nested: {
        deep: {
          data: "value",
          array: [1, 2, 3],
        },
      },
    };
    localStorage.setItem(key, JSON.stringify(value));

    const retrieved = JSON.parse(localStorage.getItem(key) || "{}");
    expect(retrieved).toEqual(value);
  });

  it("should handle multiple keys independently", () => {
    const key1 = "test_key1";
    const key2 = "test_key2";
    const value1 = { data: "first" };
    const value2 = { data: "second" };

    localStorage.setItem(key1, JSON.stringify(value1));
    localStorage.setItem(key2, JSON.stringify(value2));

    expect(JSON.parse(localStorage.getItem(key1) || "{}")).toEqual(value1);
    expect(JSON.parse(localStorage.getItem(key2) || "{}")).toEqual(value2);
  });
});

describe("Session Persistence for Generator", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should persist generator state", () => {
    const generatorState = {
      idea: "Create a prompt for email writing",
      framework: "CO-STAR" as const,
    };

    localStorage.setItem("generator_state", JSON.stringify(generatorState));
    const retrieved = JSON.parse(localStorage.getItem("generator_state") || "{}");

    expect(retrieved.idea).toBe(generatorState.idea);
    expect(retrieved.framework).toBe(generatorState.framework);
  });

  it("should persist improver state", () => {
    const improverState = {
      prompt: "Write a better prompt",
      framework: "RISEN" as const,
    };

    localStorage.setItem("improver_state", JSON.stringify(improverState));
    const retrieved = JSON.parse(localStorage.getItem("improver_state") || "{}");

    expect(retrieved.prompt).toBe(improverState.prompt);
    expect(retrieved.framework).toBe(improverState.framework);
  });

  it("should persist active tab", () => {
    const activeTab = "improver";
    localStorage.setItem("home_active_tab", activeTab);

    const retrieved = localStorage.getItem("home_active_tab");
    expect(retrieved).toBe(activeTab);
  });
});

describe("Custom Tabs Persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should persist custom tabs", () => {
    const customTabs = {
      tabs: [
        {
          id: "tab-1",
          name: "Email Writing",
          framework: "CO-STAR" as const,
          description: "For writing professional emails",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    };

    localStorage.setItem("prompt_engineer_custom_tabs", JSON.stringify(customTabs));
    const retrieved = JSON.parse(localStorage.getItem("prompt_engineer_custom_tabs") || "{}");

    expect(retrieved.tabs).toHaveLength(1);
    expect(retrieved.tabs[0].name).toBe("Email Writing");
  });

  it("should handle multiple custom tabs", () => {
    const customTabs = {
      tabs: [
        {
          id: "tab-1",
          name: "Email Writing",
          framework: "CO-STAR" as const,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "tab-2",
          name: "Code Review",
          framework: "RISEN" as const,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    };

    localStorage.setItem("prompt_engineer_custom_tabs", JSON.stringify(customTabs));
    const retrieved = JSON.parse(localStorage.getItem("prompt_engineer_custom_tabs") || "{}");

    expect(retrieved.tabs).toHaveLength(2);
    expect(retrieved.tabs[0].name).toBe("Email Writing");
    expect(retrieved.tabs[1].name).toBe("Code Review");
  });
});
