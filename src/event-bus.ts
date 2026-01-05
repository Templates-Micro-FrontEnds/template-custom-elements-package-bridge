import type { BridgeEnvelope, Unsubscribe } from "./types";

export const BUS_EVENT = "__mfe_bridge__";

export function emitEnvelope(env: BridgeEnvelope) {
  window.dispatchEvent(
    new CustomEvent(BUS_EVENT, {
      detail: env,
      bubbles: false,
      composed: true,
    })
  );
}

export function onEnvelope(
  handler: (env: BridgeEnvelope) => void
): Unsubscribe {
  const fn = (e: Event) => {
    const ce = e as CustomEvent;
    handler(ce.detail as BridgeEnvelope);
  };
  window.addEventListener(BUS_EVENT, fn as EventListener);
  return () => window.removeEventListener(BUS_EVENT, fn as EventListener);
}
