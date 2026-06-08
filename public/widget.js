(function () {
  "use strict";

  // --- Config ---
  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

  var BUSINESS_ID = script.getAttribute("data-business-id") || "";
  var API_BASE = script.getAttribute("data-api-url") || "https://app.prospekto.ai";
  var PRIMARY_COLOR = script.getAttribute("data-color") || "#6C47FF";
  var BOT_NAME = script.getAttribute("data-name") || "Asistente";
  var WELCOME_MSG = script.getAttribute("data-welcome") || "Hola 👋 ¿En qué te puedo ayudar?";
  var PLACEHOLDER = script.getAttribute("data-placeholder") || "Escribe tu mensaje...";

  if (!BUSINESS_ID) {
    console.warn("[Prospekto Widget] Falta data-business-id");
    return;
  }

  // --- Session ID ---
  var SESSION_KEY = "prospekto_session_" + BUSINESS_ID;
  function getSessionId() {
    var id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  // --- CSS ---
  var css = `
    #pkt-widget * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #pkt-bubble {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 56px; height: 56px; border-radius: 50%;
      background: ${PRIMARY_COLOR}; color: #fff;
      border: none; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,.25);
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s, box-shadow .2s;
    }
    #pkt-bubble:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(0,0,0,.3); }
    #pkt-bubble svg { width: 28px; height: 28px; fill: #fff; }
    #pkt-window {
      position: fixed; bottom: 90px; right: 24px; z-index: 9999;
      width: 360px; max-width: calc(100vw - 32px);
      height: 520px; max-height: calc(100vh - 120px);
      background: #fff; border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,.18);
      display: flex; flex-direction: column; overflow: hidden;
      transition: opacity .2s, transform .2s;
    }
    #pkt-window.pkt-hidden { opacity: 0; transform: translateY(12px) scale(.97); pointer-events: none; }
    #pkt-header {
      background: ${PRIMARY_COLOR}; color: #fff;
      padding: 14px 16px; display: flex; align-items: center; gap: 10px; flex-shrink: 0;
    }
    #pkt-header-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255,255,255,.25);
      display: flex; align-items: center; justify-content: center; font-size: 18px;
    }
    #pkt-header-info { flex: 1; }
    #pkt-header-name { font-weight: 600; font-size: 15px; }
    #pkt-header-status { font-size: 12px; opacity: .85; }
    #pkt-close {
      background: none; border: none; color: #fff; cursor: pointer;
      padding: 4px; opacity: .8; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
    }
    #pkt-close:hover { opacity: 1; background: rgba(255,255,255,.15); }
    #pkt-messages {
      flex: 1; overflow-y: auto; padding: 16px 12px;
      display: flex; flex-direction: column; gap: 8px;
      background: #f7f7f8;
    }
    #pkt-messages::-webkit-scrollbar { width: 4px; }
    #pkt-messages::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
    .pkt-msg { max-width: 82%; padding: 10px 13px; border-radius: 14px; font-size: 14px; line-height: 1.45; word-break: break-word; }
    .pkt-msg-bot { background: #fff; color: #1a1a2e; border-bottom-left-radius: 4px; align-self: flex-start; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
    .pkt-msg-user { background: ${PRIMARY_COLOR}; color: #fff; border-bottom-right-radius: 4px; align-self: flex-end; }
    .pkt-typing { display: flex; gap: 5px; align-items: center; padding: 10px 14px; }
    .pkt-typing span {
      width: 7px; height: 7px; border-radius: 50%; background: #aaa;
      animation: pkt-bounce .9s infinite ease-in-out;
    }
    .pkt-typing span:nth-child(2) { animation-delay: .15s; }
    .pkt-typing span:nth-child(3) { animation-delay: .3s; }
    @keyframes pkt-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
    #pkt-footer { padding: 10px 12px; border-top: 1px solid #eee; background: #fff; flex-shrink: 0; }
    #pkt-form { display: flex; gap: 8px; align-items: flex-end; }
    #pkt-input {
      flex: 1; border: 1.5px solid #e0e0e0; border-radius: 22px;
      padding: 10px 14px; font-size: 14px; resize: none; outline: none;
      max-height: 100px; overflow-y: auto; line-height: 1.4;
      transition: border-color .2s;
    }
    #pkt-input:focus { border-color: ${PRIMARY_COLOR}; }
    #pkt-send {
      width: 38px; height: 38px; border-radius: 50%; border: none;
      background: ${PRIMARY_COLOR}; color: #fff; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: opacity .2s;
    }
    #pkt-send:disabled { opacity: .45; cursor: default; }
    #pkt-send svg { width: 17px; height: 17px; fill: #fff; }
    #pkt-powered { text-align: center; font-size: 11px; color: #bbb; padding: 4px 0 2px; }
    #pkt-powered a { color: #bbb; text-decoration: none; }
    #pkt-powered a:hover { color: #999; }
  `;

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // --- HTML ---
  var container = document.createElement("div");
  container.id = "pkt-widget";
  container.innerHTML = `
    <button id="pkt-bubble" title="Chat" aria-label="Abrir chat">
      <svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>
    </button>
    <div id="pkt-window" class="pkt-hidden" role="dialog" aria-label="Chat">
      <div id="pkt-header">
        <div id="pkt-header-avatar">🤖</div>
        <div id="pkt-header-info">
          <div id="pkt-header-name">${BOT_NAME}</div>
          <div id="pkt-header-status">En línea</div>
        </div>
        <button id="pkt-close" aria-label="Cerrar chat">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div id="pkt-messages"></div>
      <div id="pkt-footer">
        <form id="pkt-form">
          <textarea id="pkt-input" rows="1" placeholder="${PLACEHOLDER}" aria-label="Mensaje"></textarea>
          <button type="submit" id="pkt-send" aria-label="Enviar">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </form>
        <div id="pkt-powered">Chat por <a href="https://prospekto.ai" target="_blank" rel="noopener">Prospekto</a></div>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  var bubble = document.getElementById("pkt-bubble");
  var win = document.getElementById("pkt-window");
  var msgs = document.getElementById("pkt-messages");
  var input = document.getElementById("pkt-input");
  var form = document.getElementById("pkt-form");
  var sendBtn = document.getElementById("pkt-send");
  var closeBtn = document.getElementById("pkt-close");

  var isOpen = false;
  var isLoading = false;
  var welcomed = false;

  function open() {
    isOpen = true;
    win.classList.remove("pkt-hidden");
    bubble.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    input.focus();
    if (!welcomed) {
      welcomed = true;
      addMessage("bot", WELCOME_MSG);
    }
  }

  function close() {
    isOpen = false;
    win.classList.add("pkt-hidden");
    bubble.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>';
  }

  bubble.addEventListener("click", function () { isOpen ? close() : open(); });
  closeBtn.addEventListener("click", close);

  function addMessage(from, text) {
    var div = document.createElement("div");
    div.className = "pkt-msg pkt-msg-" + from;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function showTyping() {
    var div = document.createElement("div");
    div.className = "pkt-msg pkt-msg-bot pkt-typing";
    div.id = "pkt-typing";
    div.innerHTML = "<span></span><span></span><span></span>";
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideTyping() {
    var t = document.getElementById("pkt-typing");
    if (t) t.remove();
  }

  // Auto-resize textarea
  input.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 100) + "px";
  });

  // Submit on Enter (Shift+Enter = nueva línea)
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    }
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text || isLoading) return;

    input.value = "";
    input.style.height = "auto";
    isLoading = true;
    sendBtn.disabled = true;

    addMessage("user", text);
    showTyping();

    try {
      var res = await fetch(API_BASE + "/api/chat/widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: BUSINESS_ID,
          session_id: getSessionId(),
          message: text,
        }),
      });

      var data = await res.json();
      hideTyping();
      addMessage("bot", data.reply || "Lo siento, hubo un error. Intenta de nuevo.");
    } catch (err) {
      hideTyping();
      addMessage("bot", "No pude conectarme. Por favor intenta más tarde.");
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
      input.focus();
    }
  });
})();
