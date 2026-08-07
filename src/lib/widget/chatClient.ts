// Cliente WebSocket para el canal Web del bot de SoporteXperto.
//
// Se conecta a {apiBase}/ws/chat/{externalId} (el mismo endpoint que usa el widget
// del cliente final) y normaliza los mensajes entrantes a una lista de eventos
// que el componente ChatWidget renderiza. Disparar la misma logica del backend
// (FlowEngine + LLM + persistencia) que usa el canal Telegram: desde el punto de
// vista del bot, el cliente web y el de Telegram son indistinguibles.
//
// Formato del protocolo (definido en backend/app/channels/web/router.py):
//   - Server -> cliente: {"type": "message"|"system", "sender": "bot"|"agent", "text": "..."}
//   - Cliente -> server: texto plano (string) por websocket.send_text()

export type ChatRole = "bot" | "agent" | "customer" | "system";
export type ChatStatus = "connecting" | "open" | "closed" | "error";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  at: number;
}

export interface ChatClientOptions {
  apiBase: string;
  externalId: string;
  onMessage?: (message: ChatMessage) => void;
  onStatusChange?: (status: ChatStatus) => void;
}

export class ChatClient {
  private ws: WebSocket | null = null;
  private readonly opts: ChatClientOptions;
  private status: ChatStatus = "connecting";

  constructor(opts: ChatClientOptions) {
    this.opts = opts;
  }

  connect(): void {
    const url = `${this.opts.apiBase.replace(/^http/, "ws")}/ws/chat/${encodeURIComponent(this.opts.externalId)}`;
    this.setStatus("connecting");
    this.ws = new WebSocket(url);

    this.ws.onopen = () => this.setStatus("open");
    this.ws.onclose = () => this.setStatus("closed");
    this.ws.onerror = () => this.setStatus("error");
    this.ws.onmessage = (event) => this.handleIncoming(event.data);
  }

  private handleIncoming(raw: string): void {
    let payload: { type?: string; sender?: string; text?: string };
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }
    const text = payload.text ?? "";
    if (!text) return;
    const role: ChatRole =
      payload.type === "system"
        ? "system"
        : (payload.sender as ChatRole) === "agent"
          ? "agent"
          : "bot";
    this.opts.onMessage?.({
      id: crypto.randomUUID(),
      role,
      text,
      at: Date.now(),
    });
  }

  send(text: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(text);
      this.opts.onMessage?.({
        id: crypto.randomUUID(),
        role: "customer",
        text,
        at: Date.now(),
      });
    }
  }

  private setStatus(status: ChatStatus): void {
    this.status = status;
    this.opts.onStatusChange?.(status);
  }

  getStatus(): ChatStatus {
    return this.status;
  }

  close(): void {
    this.ws?.close();
    this.ws = null;
  }
}