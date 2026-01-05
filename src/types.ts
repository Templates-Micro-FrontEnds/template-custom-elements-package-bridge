export type Unsubscribe = () => void;

export type BridgeMeta = {
  source: string; // "shell" | "mfe-angular" | "mfe-react" | etc
  ts: number;
  traceId?: string;

  // targeting
  target?: string; // id do MFE (ex: "boards", "react-hello")
  broadcast?: boolean; // true = todo mundo pode ouvir
};

export type BridgeEnvelope<TType extends string = string, TPayload = any> = {
  type: TType;
  payload: TPayload;
  meta: BridgeMeta;
};

export type Bridge = {
  // config
  setDebug(enabled: boolean): void;

  // pub/sub
  emit<T extends string, P>(
    type: T,
    payload: P,
    meta?: Partial<BridgeMeta>
  ): void;

  on<T extends string, P>(
    type: T,
    handler: (payload: P, env: BridgeEnvelope<T, P>) => void
  ): Unsubscribe;

  // rpc
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

  // handshake helpers
  ready(meta?: Partial<BridgeMeta>): void;
  mounted(meta?: Partial<BridgeMeta>): void;
};

export type ShellCapabilities = {
  navigate(to: string): void;
};

export type ShellContext = {
  mfeId: string; // id do MFE atual
  assetBase: string;
  theme: "light" | "dark";
  locale: string;
  user?: { id: string; name?: string };

  capabilities: ShellCapabilities;
  bridge: Bridge;
};
