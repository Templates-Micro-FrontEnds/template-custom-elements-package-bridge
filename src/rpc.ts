import type { BridgeEnvelope, Unsubscribe } from "./types";
import { emitEnvelope, onEnvelope } from "./event-bus";

const RPC_REQ = "rpc:req";
const RPC_RES = "rpc:res";

type Pending = {
  resolve: (v: any) => void;
  reject: (e: any) => void;
  timeout?: any;
};

const pending = new Map<string, Pending>();

function id() {
  return (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function createRpc(
  source: string,
  getMetaBase: () => Omit<BridgeEnvelope["meta"], "ts">
) {
  const off = onEnvelope((env) => {
    if (env.type !== RPC_RES) return;

    const { requestId, ok, data, error } = env.payload ?? {};
    if (!requestId) return;

    const p = pending.get(requestId);
    if (!p) return;

    pending.delete(requestId);
    if (p.timeout) clearTimeout(p.timeout);

    ok ? p.resolve(data) : p.reject(new Error(error ?? "RPC error"));
  });

  function request<Req, Res>(
    type: string,
    payload: Req,
    opts?: { timeoutMs?: number; target?: string }
  ): Promise<Res> {
    const requestId = id();
    const timeoutMs = opts?.timeoutMs ?? 8000;
    const traceId = id();

    return new Promise<Res>((resolve, reject) => {
      const t = setTimeout(() => {
        pending.delete(requestId);
        reject(new Error(`RPC timeout: ${type}`));
      }, timeoutMs);

      pending.set(requestId, { resolve, reject, timeout: t });

      emitEnvelope({
        type: RPC_REQ,
        payload: { requestId, reqType: type, data: payload },
        meta: {
          ...getMetaBase(),
          ts: Date.now(),
          traceId,
          target: opts?.target,
        },
      });
    });
  }

  function register<Req, Res>(
    type: string,
    handler: (payload: Req, env: BridgeEnvelope) => Promise<Res> | Res
  ): Unsubscribe {
    return onEnvelope(async (env) => {
      if (env.type !== RPC_REQ) return;

      const { requestId, reqType, data } = env.payload ?? {};
      if (!requestId || reqType !== type) return;

      try {
        const res = await handler(data as Req, env);
        emitEnvelope({
          type: RPC_RES,
          payload: { requestId, ok: true, data: res },
          meta: {
            ...getMetaBase(),
            ts: Date.now(),
            traceId: env.meta?.traceId,
            target: env.meta?.source, // resposta volta pro chamador (source)
          },
        });
      } catch (e: any) {
        emitEnvelope({
          type: RPC_RES,
          payload: { requestId, ok: false, error: e?.message ?? String(e) },
          meta: {
            ...getMetaBase(),
            ts: Date.now(),
            traceId: env.meta?.traceId,
            target: env.meta?.source,
          },
        });
      }
    });
  }

  return { request, register, destroy: off };
}
