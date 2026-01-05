declare global {
  interface Window {
    __BRIDGE_DEBUG__?: boolean;
  }
}

export function readDebugFlag(): boolean {
  return typeof window !== "undefined" && window.__BRIDGE_DEBUG__ === true;
}
