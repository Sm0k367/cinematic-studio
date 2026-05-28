export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/api/cinematic" && request.method === "POST") return handleCinematic(request, env);
    if (path === "/api/chat" && request.method === "POST") return handleChat(request, env);
    if (path === "/api/auth" && request.method === "POST") return handleAuth(request, env);

    return new Response(HTML, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
};

// ====================== AUTH ======================
async function handleAuth(request: Request, env: Env) {
  const { action, email, password } = await request.json();
  const key = `user:${email}`;

  if (action === "register") {
    await env.KV.put(key, JSON.stringify({ password, created: Date.now() }));
    return Response.json({ success: true, message: "Account created successfully!" });
  }
  if (action === "login") {
    const data = await env.KV.get(key);
    if (data && JSON.parse(data).password === password) {
      return Response.json({ success: true, email });
    }
  }
  return Response.json({ success: false, message: "Invalid email or password" }, { status: 401 });
}

// ====================== CINEMATIC GENERATION ======================
async function handleCinematic(request: Request, env: Env) {
  try {
    const { prompt, mode = "image" } = await request.json();

    if (!prompt) return Response.json({ success: false, error: "Prompt is required" }, { status: 400 });

    if (mode === "video") {
      const videoResult = await env.AI.run("@cf/pixverse/v6", {
        prompt: `${prompt}, cinematic, smooth motion, dramatic`,
      });
      const filename = `video-${Date.now()}.mp4`;
      await env.R2.put(filename, videoResult.video, { httpMetadata: { contentType: "video/mp4" } });

      return Response.json({
        success: true,
        type: "video",
        url: `https://epic-ai-media.r2.dev/${filename}`,
        prompt
      });
    } else {
      const imageResult = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
        prompt: `${prompt}, cinematic masterpiece, dramatic lighting, film grain, highly detailed`,
        width: 1024,
        height: 576,
      });
      const filename = `cinematic-${Date.now()}.jpg`;
      await env.R2.put(filename, imageResult.image, { httpMetadata: { contentType: "image/jpeg" } });

      return Response.json({
        success: true,
        type: "image",
        url: `https://epic-ai-media.r2.dev/${filename}`,
        prompt
      });
    }
  } catch (e: any) {
    return Response.json({ success: false, error: "Pipeline hiccup - Try again later" }, { status: 500 });
  }
}

// ====================== CHAT ======================
async function handleChat(request: Request, env: Env) {
  const { message } = await request.json();
  const reply = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
    messages: [
      { role: "system", content: "You are a helpful, creative cinematic AI assistant for Epic Tech AI Studio." },
      { role: "user", content: message }
    ]
  });
  return Response.json({ reply: reply.response });
}

// ====================== FULL CINEMATIC UI ======================
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Epic Tech AI Cinematic Studio</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet">
  <style>
    body { background: #0a0a0a; color: #fff; font-family: system-ui; }
    .glass { background: rgba(15,23,42,0.85); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.12); }
    .neon { text-shadow: 0 0 20px #67e8f9; }
    .tab-btn.active { border-bottom: 4px solid #67e8f9; color: #67e8f9; font-weight: 600; }
  </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-950">
  <div class="max-w-7xl mx-auto p-6">
    <!-- Header -->
    <header class="flex justify-between items-center mb-10">
      <div class="flex items-center gap-4">
        <span class="text-5xl">🎥</span>
        <div>
          <h1 class="text-4xl font-bold neon">Epic Tech AI</h1>
          <p class="text-cyan-400 text-lg">Cinematic Studio</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <button onclick="showLogin()" id="loginBtn" class="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition">Sign In</button>
        <a href="https://buy.stripe.com/7sI3dlgcQ4uL0gMeUW" target="_blank" class="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl font-bold hover:scale-105 transition">❤️ Support My Work</a>
      </div>
    </header>

    <div class="grid grid-cols-12 gap-6">
      <!-- LEFT AGENTS -->
      <div class="col-span-2">
        <div class="glass rounded-3xl p-6 sticky top-6">
          <h2 class="text-xl font-bold mb-6 flex items-center gap-2"><i class="fas fa-robot"></i> AGENTS</h2>
          <div class="space-y-4">
            <div class="glass p-4 rounded-2xl flex items-center gap-3"><div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>Writer</div>
            <div class="glass p-4 rounded-2xl flex items-center gap-3"><div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>Director</div>
            <div class="glass p-4 rounded-2xl flex items-center gap-3"><div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>Editor</div>
          </div>
        </div>
      </div>

      <!-- CENTER STUDIO -->
      <div class="col-span-7 space-y-6">
        <!-- Example Prompts -->
        <div class="flex flex-wrap gap-2">
          <button onclick="usePrompt(this)" class="px-5 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-full border border-cyan-400/30">Lone samurai neon rain</button>
          <button onclick="usePrompt(this)" class="px-5 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-full border border-cyan-400/30">Flying cars cyberpunk city</button>
          <button onclick="usePrompt(this)" class="px-5 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-full border border-cyan-400/30">Dragon misty mountains</button>
          <button onclick="usePrompt(this)" class="px-5 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-full border border-cyan-400/30">Astronaut alien planet</button>
        </div>

        <!-- Prompt -->
        <div class="glass rounded-3xl p-8">
          <textarea id="prompt" rows="4" class="w-full bg-transparent text-lg focus:outline-none" placeholder="Describe your cinematic vision..."></textarea>
          <div class="flex gap-4 mt-6">
            <button onclick="generate('image')" class="flex-1 py-7 text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 rounded-3xl hover:scale-105 transition">📸 Generate Image</button>
            <button onclick="generate('video')" class="flex-1 py-7 text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl hover:scale-105 transition">🎬 Generate Video (8s)</button>
          </div>
        </div>

        <!-- Preview -->
        <div id="preview" class="glass rounded-3xl min-h-[520px] relative overflow-hidden bg-black">
          <div id="content" class="w-full h-full"></div>
          <div id="loading" class="hidden absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <div class="animate-spin w-20 h-20 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
            <p id="status" class="mt-8 text-cyan-400 text-lg">Generating cinematic masterpiece...</p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="glass rounded-3xl p-6">
          <div class="flex border-b border-gray-700 mb-6">
            <button onclick="switchTab(0)" class="tab-btn active px-8 py-4">Generation History</button>
            <button onclick="switchTab(1)" class="tab-btn px-8 py-4">Gallery</button>
          </div>
          <div id="tabContent" class="min-h-[300px]"></div>
        </div>
      </div>

      <!-- RIGHT SIDEBAR -->
      <div class="col-span-3 space-y-6">
        <div class="glass rounded-3xl p-6 h-80 overflow-auto">
          <h2 class="font-semibold mb-4">Memory Vault</h2>
          <div id="vault" class="space-y-3"></div>
        </div>

        <div class="glass rounded-3xl p-6 flex flex-col h-96">
          <h2 class="font-semibold mb-4">Epic Assistant</h2>
          <div id="chat" class="flex-1 overflow-auto space-y-4 text-sm"></div>
          <div class="flex gap-2">
            <input id="chatInput" type="text" placeholder="Ask for ideas..." class="flex-1 bg-slate-900 rounded-2xl px-5 py-3">
            <button onclick="sendChat()" class="bg-cyan-500 px-6 rounded-2xl font-medium">Send</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Login Modal -->
  <div id="loginModal" class="hidden fixed inset-0 bg-black/90 flex items-center justify-center z-50">
    <div class="glass rounded-3xl p-10 w-full max-w-md">
      <h2 class="text-3xl font-bold text-center mb-8">Welcome Back</h2>
      <input id="email" placeholder="Email" class="w-full mb-4 bg-slate-900 rounded-2xl px-6 py-5 text-lg">
      <input id="password" type="password" placeholder="Password" class="w-full mb-8 bg-slate-900 rounded-2xl px-6 py-5 text-lg">
      <div class="grid grid-cols-2 gap-4">
        <button onclick="login()" class="py-5 bg-cyan-500 rounded-2xl font-bold text-lg">Login</button>
        <button onclick="register()" class="py-5 bg-purple-600 rounded-2xl font-bold text-lg">Register</button>
      </div>
      <button onclick="hideLogin()" class="mt-6 text-gray-400 w-full">Close</button>
    </div>
  </div>

  <script>
    let history = [];

    function showLogin() { document.getElementById('loginModal').classList.remove('hidden'); }
    function hideLogin() { document.getElementById('loginModal').classList.add('hidden'); }

    async function login() {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const res = await fetch('/api/auth', { method: 'POST', body: JSON.stringify({action:'login', email, password}) });
      const data = await res.json();
      if (data.success) {
        document.getElementById('loginBtn').innerHTML = `✓ ${email.split('@')[0]}`;
        hideLogin();
      } else alert(data.message);
    }

    async function register() {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const res = await fetch('/api/auth', { method: 'POST', body: JSON.stringify({action:'register', email, password}) });
      const data = await res.json();
      alert(data.message || "Account created!");
    }

    function usePrompt(el) {
      document.getElementById('prompt').value = el.textContent;
    }

    async function generate(mode) {
      const prompt = document.getElementById('prompt').value.trim();
      if (!prompt) return alert("Please enter a prompt");

      document.getElementById('loading').classList.remove('hidden');
      document.getElementById('status').textContent = mode === 'video' ? 'Generating 8s video...' : 'Generating image...';

      const res = await fetch('/api/cinematic', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ prompt, mode })
      });

      const data = await res.json();
      document.getElementById('loading').classList.add('hidden');

      if (data.success) {
        const content = document.getElementById('content');
        if (data.type === 'video') {
          content.innerHTML = `<video src="${data.url}" controls autoplay loop class="w-full h-full object-cover"></video>`;
        } else {
          content.innerHTML = `<img src="${data.url}" class="w-full h-full object-cover">`;
        }

        history.unshift({url: data.url, prompt: prompt.substring(0,55), type: data.type});
        renderHistory();
      } else {
        alert(data.error || "Generation failed");
      }
    }

    function renderHistory() {
      document.getElementById('tabContent').innerHTML = `
        <div class="grid grid-cols-3 gap-4">
          ${history.map(h => `
            <div onclick="window.open('${h.url}')" class="cursor-pointer glass rounded-2xl overflow-hidden hover:ring-2 hover:ring-cyan-400 transition">
              ${h.type === 'video' ? 
                `<video src="${h.url}" class="h-44 w-full object-cover"></video>` : 
                `<img src="${h.url}" class="h-44 w-full object-cover">`}
              <p class="p-3 text-xs text-gray-300">${h.prompt}...</p>
            </div>
          `).join('')}
        </div>`;
    }

    function switchTab(n) {
      document.querySelectorAll('.tab-btn').forEach((b,i) => b.classList.toggle('active', i === n));
      renderHistory();
    }

    async function sendChat() {
      const input = document.getElementById('chatInput');
      const msg = input.value.trim();
      if (!msg) return;

      const chat = document.getElementById('chat');
      chat.innerHTML += `<div class="text-right"><div class="bg-cyan-600 px-4 py-2 rounded-3xl inline-block">${msg}</div></div>`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: msg})
      });
      const data = await res.json();

      chat.innerHTML += `<div><div class="bg-slate-700 px-4 py-2 rounded-3xl inline-block">${data.reply}</div></div>`;
      chat.scrollTop = chat.scrollHeight;
      input.value = '';
    }

    document.getElementById('chatInput').addEventListener('keypress', e => {
      if (e.key === 'Enter') sendChat();
    });
  </script>
</body>
</html>`;
