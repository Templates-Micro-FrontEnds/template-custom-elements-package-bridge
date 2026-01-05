export type Unsubscribe = () => void;

export type BridgeMeta = {
  source: string;
  ts: number;
  traceId?: string;

  target?: string;
  broadcast?: boolean;
};

export type BridgeEnvelope<TType extends string = string, TPayload = any> = {
  type: TType;
  payload: TPayload;
  meta: BridgeMeta;
};

export type Bridge = {
  setDebug(enabled: boolean): void;

  emit<T extends string, P>(
    type: T,
    payload: P,
    meta?: Partial<BridgeMeta>
  ): void;

  on<T extends string, P>(
    type: T,
    handler: (payload: P, env: BridgeEnvelope<T, P>) => void
  ): Unsubscribe;

  request<TReq extends string, Req, Res>(
    type: TReq,
    payload: Req,
    opts?: { timeoutMs?: number; target?: string }
  ): Promise<Res>;

  register<TReq extends string, Req, Res>(
    type: TReq,
    handler: (
      payload: Req,
      env: BridgeEnvelope<TReq, Req>
    ) => Promise<Res> | Res
  ): Unsubscribe;

  ready(meta?: Partial<BridgeMeta>): void;
  mounted(meta?: Partial<BridgeMeta>): void;
};

export type ShellCapabilities = {
  navigate(to: string): void;
};

export type ShellContext = {
  mfeId: string;
  assetBase: string;
  theme: "light" | "dark";
  locale: string;
  user?: { id: string; name?: string };
  token?: string;

  capabilities: ShellCapabilities;
};
