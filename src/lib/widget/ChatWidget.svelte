<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { ChatClient, type ChatMessage, type ChatStatus } from "./chatClient";

  // Props: el unico punto de configuracion. apiBase apunta al backend (en dev
  // http://localhost:8000, en prod https://api.soportexperto.com). logoPath es
  // relativo a /static o una URL absoluta (puede ser la que quieras).
  export let apiBase = "http://localhost:8000";
  export let logoPath = "/widget/logo.png";
  export let title = "SoporteXperto";
  export let subtitle = "Asistente virtual";
  export let accentColor = "#2563eb"; // azul corporativo por defecto
  export let position: "bottom-right" | "bottom-left" = "bottom-right";

  let open = false;
  let messages: ChatMessage[] = [];
  let input = "";
  let status: ChatStatus = "connecting";
  let client: ChatClient | null = null;
  let messagesEl: HTMLDivElement | null = null;

  // externalId persistido en localStorage para que el cliente retome la misma
  // conversacion entre recargas de pagina (igual que Telegram usa el chat_id).
  const STORAGE_KEY = "sx_widget_external_id";

  function getOrCreateExternalId(): string {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = `web-${crypto.randomUUID()}`;
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  }

  function scrollToBottom() {
    if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function toggle() {
    open = !open;
    if (open && !client) {
      client = new ChatClient({
        apiBase,
        externalId: getOrCreateExternalId(),
        onMessage: (msg) => {
          messages = [...messages, msg];
          // $tick(scrollToBottom);
          setTimeout(scrollToBottom, 0);
        },
        onStatusChange: (s) => {
          status = s;
        },
      });
      client.connect();
    }
  }

  function send() {
    const text = input.trim();
    if (!text || !client) return;
    client.send(text);
    input = "";
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  }

  function hideImage(event: Event) {
    const img = event.currentTarget as HTMLImageElement;
    img.style.visibility = "hidden";
  }

  function statusLabel(): string {
    switch (status) {
      case "connecting":
        return "Conectando...";
      case "open":
        return "En linea";
      case "closed":
        return "Desconectado";
      case "error":
        return "Reintentar";
      default:
        return "";
    }
  }

  function bubbleClass(role: ChatMessage["role"]): string {
    if (role === "customer") return "bubble-customer";
    if (role === "system") return "bubble-system";
    return "bubble-bot";
  }

  onMount(() => {});
  onDestroy(() => {
    client?.close();
  });
</script>

<style>
  .sx-widget-host {
    position: fixed;
    z-index: 2147483000;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
      Arial, sans-serif;
    color: #1e293b;
  }
  .sx-widget-host.bottom-right {
    right: 20px;
    bottom: 20px;
  }
  .sx-widget-host.bottom-left {
    left: 20px;
    bottom: 20px;
  }

  /* Boton flotante */
  .sx-fab {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--accent);
    border: none;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease;
    color: #fff;
  }
  .sx-fab:hover {
    transform: scale(1.05);
  }
  .sx-fab img {
    width: 32px;
    height: 32px;
    object-fit: contain;
    border-radius: 50%;
  }
  .sx-fab .sx-fab-icon {
    width: 28px;
    height: 28px;
  }

  /* Ventana de chat */
  .sx-window {
    position: absolute;
    bottom: 76px;
    right: 0;
    width: 360px;
    max-width: calc(100vw - 40px);
    height: 520px;
    max-height: calc(100vh - 120px);
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .bottom-left .sx-window {
    right: auto;
    left: 0;
  }

  /* Header */
  .sx-header {
    background: var(--accent);
    color: #fff;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .sx-header img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    background: #fff;
  }
  .sx-header-titles {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .sx-header h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }
  .sx-header span {
    font-size: 12px;
    opacity: 0.85;
  }
  .sx-close {
    margin-left: auto;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: #fff;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
  }
  .sx-close:hover {
    background: rgba(255, 255, 255, 0.35);
  }

  /* Cuerpo de mensajes */
  .sx-messages {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .bubble {
    max-width: 80%;
    padding: 8px 12px;
    border-radius: 12px;
    font-size: 13px;
    line-height: 1.4;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  .bubble-customer {
    align-self: flex-end;
    background: var(--accent);
    color: #fff;
    border-bottom-right-radius: 4px;
  }
  .bubble-bot {
    align-self: flex-start;
    background: #fff;
    color: #1e293b;
    border: 1px solid #e2e8f0;
    border-bottom-left-radius: 4px;
  }
  .bubble-system {
    align-self: center;
    background: #fef3c7;
    color: #92400e;
    font-size: 12px;
    border: 1px solid #fde68a;
  }

  /* Composer */
  .sx-composer {
    display: flex;
    border-top: 1px solid #e2e8f0;
    padding: 8px;
    background: #fff;
  }
  .sx-composer textarea {
    flex: 1;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 13px;
    resize: none;
    outline: none;
    font-family: inherit;
    max-height: 80px;
  }
  .sx-composer textarea:focus {
    border-color: var(--accent);
  }
  .sx-send {
    margin-left: 8px;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 0 14px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  }
  .sx-send:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
  }

  /* Estado */
  .sx-status {
    padding: 4px 12px 8px;
    font-size: 11px;
    color: #64748b;
    text-align: center;
  }
</style>

<!-- CSS variable driven por props para no pelear con estilos globales del host -->
<div
  class="sx-widget-host {position}"
  style="--accent: {accentColor};"
>
  {#if open}
    <div class="sx-window" role="dialog" aria-label="Chat con SoporteXperto">
      <header class="sx-header">
        <!-- svelte-ignore a11y-missing-attribute -->
        <img src={logoPath} alt="Logo" on:error={hideImage} />
        <div class="sx-header-titles">
          <h3>{title}</h3>
          <span>{subtitle} · {statusLabel()}</span>
        </div>
        <button class="sx-close" on:click={toggle} aria-label="Cerrar">&times;</button>
      </header>

      <div class="sx-messages" bind:this={messagesEl}>
        {#if messages.length === 0 && status === "connecting"}
          <div class="bubble bubble-system">Conectando con un asesor...</div>
        {/if}
        {#each messages as msg (msg.id)}
          <div class="bubble {bubbleClass(msg.role)}">{msg.text}</div>
        {/each}
      </div>

      <div class="sx-composer">
        <textarea
          placeholder="Escribi tu mensaje..."
          rows="1"
          bind:value={input}
          on:keydown={onKeyDown}
          disabled={status !== "open"}
        ></textarea>
        <button class="sx-send" on:click={send} disabled={!input.trim() || status !== "open"}>
          Enviar
        </button>
      </div>
      <div class="sx-status">
        {#if status === "closed" || status === "error"}
          Se corto la conexion. Cerra y abri el chat para reintentar.
        {/if}
      </div>
    </div>
  {:else}
    <button class="sx-fab" on:click={toggle} aria-label="Abrir chat">
      {#if logoPath}
        <!-- svelte-ignore a11y-missing-attribute -->
        <img
          src={logoPath}
          on:error={hideImage}
        />
      {:else}
        <div class="sx-fab-icon">\uD83D\uDCAC</div>
      {/if}
    </button>
  {/if}
</div>