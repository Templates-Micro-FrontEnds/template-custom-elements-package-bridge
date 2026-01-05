# Template Custom Elements Package Bridge

Bridge **framework-agnostic** para comunicação entre **Shell** e **Micro Frontends** (Angular/React/Vue/Vanilla) via `CustomEvent` (DOM).

## Features

- Pub/Sub tipado (TS) em cima de um event bus global (`window`)
- **Targeting**: `meta.target = mfeId` para falar com 1 participante
- **Broadcast**: `meta.broadcast = true` para falar com todos
- **Handshake**: `mfe:ready` / `mfe:mounted`
- **Devtool**: `window.__BRIDGE_DEBUG__ = true` habilita logs

---

## Instalação

### Local (workspace / monorepo)

```bash
npm i ../mfe-bridge
```

### Git (repo separado)

```bash
npm i @templates-micro-frontends/bridge
```

### .npmrc global

```bash
@templates-micro-frontends:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=SEU_TOKEN
always-auth=true
```

### SEU_TOKEN

Gere um Token Classic no Github com as permissões de `read:package` e `write:package`.

---

## Uso no Shell (Angular) — com whitelist de segurança

### Regra (mínimo viável)

O Shell **só aceita** eventos:

- `telemetry:*`
- `toast:*`
- `auth:*`

Qualquer outro tipo é **ignorado** (drop silencioso).

### Exemplo (cole no Shell)

```ts
import { createBridge } from "@mfe/bridge";

const allowed = (type: string) =>
  type.startsWith("telemetry:") ||
  type.startsWith("toast:") ||
  type.startsWith("auth:");

export function createShellBridge() {
  const bridge = createBridge({ source: "shell", selfId: "shell" });

  bridge.setDebug((window as any).__BRIDGE_DEBUG__ === true);

  const onSafe = <P>(type: string, handler: (p: P) => void) =>
    bridge.on(type as any, (payload: P, env) => {
      if (!allowed(env.type)) return;
      if (env.meta.target && env.meta.target !== "shell") return;
      handler(payload);
    });

  onSafe<{ message: string }>("toast:show", (p) =>
    console.log("toast:", p.message)
  );
  onSafe<{ name: string; props?: any }>("telemetry:track", (p) =>
    console.log("track:", p.name, p.props)
  );
  onSafe<{}>("auth:refresh", () => console.log("auth refresh requested"));

  bridge.ready({ broadcast: true });

  return bridge;
}
```

### Injetar context no MFE (Shell -> Custom Element)

```ts
const ctx = {
  mfeId: mfe.id,
  assetBase,
  theme,
  locale,
  user,
  capabilities: { navigate: (to: string) => router.navigateByUrl(to) },
  bridge,
};

(node as any).context = ctx;
(node as any).setAttribute("theme", theme);
```

---

## Uso no MFE (Angular/React)

### Emit permitido (ok)

```ts
context.bridge.emit(
  "toast:show",
  { message: "Oi do MFE" },
  { target: "shell" }
);
context.bridge.emit(
  "telemetry:track",
  { name: "mfe_opened" },
  { target: "shell" }
);
context.bridge.emit("auth:refresh", {}, { target: "shell" });
```

### Emit proibido (shell ignora)

```ts
context.bridge.emit("evil:spam", { lol: true }, { target: "shell" });
```

### Handshake do MFE

```ts
context.bridge.mounted({ target: "shell" });
```

---

## Targeting

- `meta.target`: entrega apenas ao participante com `selfId === target`
- `meta.broadcast`: entrega para todos (inclusive MFEs)

Exemplo: Shell falando com um MFE específico:

```ts
bridge.emit("boards:refresh", {}, { target: "boards" });
```

---

## Debug (Devtool)

No console do navegador:

```js
window.__BRIDGE_DEBUG__ = true;
location.reload();
```

Desligar:

```js
window.__BRIDGE_DEBUG__ = false;
location.reload();
```
