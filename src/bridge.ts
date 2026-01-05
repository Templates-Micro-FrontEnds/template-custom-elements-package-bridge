import type { Bridge, BridgeEnvelope, BridgeMeta, Unsubscribe } from "./types";
import { emitEnvelope, onEnvelope } from "./event-bus";
import { createRpc } from "./rpc";
import { readDebugFlag } from "./devtool";

function id() {
  return (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function createBridge(opts: { source: string; selfId: string }): Bridge {
  const { source, selfId } = opts;

  let debug = readDebugFlag();

  const metaBase = () => ({ source });

  const rpc = createRpc(source, metaBase);

  function shouldReceive(env: BridgeEnvelope) {
    if (env.meta?.source === source) return false;
    if (env.meta?.broadcast) return true;
    if (env.meta?.target) return env.meta.target === selfId;
    return true;
  }

  function log(direction: "in" | "out", env: BridgeEnvelope) {
    if (!debug) return;
    const t = new Date(env.meta.ts).toISOString();
    console.log(`[bridge:${selfId}] ${direction} ${env.type}`, {
      ts: t,
      meta: env.meta,
      payload: env.payload,
    });
  }

  function setDebug(enabled: boolean) {
    debug = enabled;
  }

  function emit<T extends string, P>(
    type: T,
    payload: P,
    meta?: Partial<BridgeMeta>
  ) {
    const env: BridgeEnvelope<T, P> = {
      type,
      payload,
      meta: {
        ...metaBase(),
        ts: Date.now(),
        traceId: meta?.traceId ?? id(),
        ...meta,
      },
    };
    log("out", env as any);
    emitEnvelope(env as any);
  }

  function on<T extends string, P>(
    type: T,
    handler: (payload: P, env: BridgeEnvelope<T, P>) => void
  ): Unsubscribe {
    return onEnvelope((env) => {
      if (env.type !== type) return;
      if (!shouldReceive(env)) return;
      log("in", env);
      handler(env.payload as P, env as BridgeEnvelope<T, P>);
    });
  }

  function ready(meta?: Partial<BridgeMeta>) {
    emit("mfe:ready", { id: selfId }, { broadcast: true, ...meta });
  }

  function mounted(meta?: Partial<BridgeMeta>) {
    emit("mfe:mounted", { id: selfId }, { broadcast: true, ...meta });
  }

  return {
    setDebug,
    emit,
    on,
    request: (t, p, o) => rpc.request(t, p, o),
    register: rpc.register as Bridge["register"],
    ready,
    mounted,
  };
}
