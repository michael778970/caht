export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = [];
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") === "websocket") {
      const [client, server] = Object.values(new WebSocketPair());
      this.handleSession(server);
      return new Response(null, { status: 101, webSocket: client });
    }
    return new Response("Expected WebSocket", { status: 400 });
  }

  handleSession(ws) {
    ws.accept();
    this.sessions.push(ws);

    ws.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message" && typeof data.text === "string") {
          this.broadcast({ type: "message", text: data.text });
        }
      } catch (err) {
        console.error(err);
      }
    });

    ws.addEventListener("close", () => {
      this.sessions = this.sessions.filter(s => s !== ws);
    });
  }

  broadcast(msg) {
    const data = JSON.stringify(msg);
    for (const ws of this.sessions) {
      try { ws.send(data); } catch {}
    }
  }
}

export default {
  async fetch(request, env) {
    const id = env.CHAT_ROOM.idFromName("main");
    const stub = env.CHAT_ROOM.get(id);
    return stub.fetch(request);
  }
};

