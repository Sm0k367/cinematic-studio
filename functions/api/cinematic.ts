/// <reference types="@cloudflare/workers-types" />

// @ts-nocheck
// This file intentionally embeds a large self-contained HTML UI.
// The above directive keeps the Pages build happy.

interface Env {
  KV: KVNamespace;
  R2: R2Bucket;
  AI: any;
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/api/cinematic" && request.method === "POST") return handleCinematic(request, env);
    if (path === "/api/chat" && request.method === "POST") return handleChat(request, env);
    if (path === "/api/auth" && request.method === "POST") return handleAuth(request, env);
    if (path === "/api/vault" && request.method === "POST") return handleVault(request, env);

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
      // Pixverse v6 is powerful but availability can vary by account.
      // If it 500s, the frontend will show a friendly message.
      const videoResult: any = await env.AI.run("@cf/pixverse/v6", {
        prompt: `${prompt}, cinematic, smooth motion, dramatic lighting`,
      });

      if (!videoResult?.video) throw new Error("Video model returned no data");

      const filename = `video-${Date.now()}.mp4`;
      await env.R2.put(filename, videoResult.video, { httpMetadata: { contentType: "video/mp4" } });

      return Response.json({
        success: true,
        type: "video",
        url: `https://epic-ai-media.r2.dev/${filename}`,
        prompt
      });
    } else {
      const imageResult: any = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
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
    const msg = e?.message || "Generation failed. The model may be temporarily busy.";
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}

// ====================== CHAT ======================
async function handleChat(request: Request, env: Env) {
  try {
    const { message } = await request.json();
    const result = await env.AI.run("@cf/moonshotai/kimi-k2.6", {
      messages: [
        { role: "system", content: "You are a helpful, creative cinematic AI assistant for Epic Tech AI Studio. Keep answers concise and inspiring." },
        { role: "user", content: message }
      ]
    });
    return Response.json({ success: true, reply: result.response || result });
  } catch (e: any) {
    return Response.json({ success: false, reply: "The assistant is taking a creative break. Please try again in a moment." });
  }
}

// ====================== MEMORY VAULT (KV backed) ======================
async function handleVault(request: Request, env: Env) {
  const { action, email, item } = await request.json();

  const key = `vault:${email}`;

  if (action === "save") {
    const existing = JSON.parse((await env.KV.get(key)) || "[]");
    existing.unshift(item);
    // Keep only last 24 items
    await env.KV.put(key, JSON.stringify(existing.slice(0, 24)));
    return Response.json({ success: true });
  }

  if (action === "load") {
    const items = JSON.parse((await env.KV.get(key)) || "[]");
    return Response.json({ success: true, items });
  }

  return Response.json({ success: false }, { status: 400 });
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
          <h2 class="text-sm font-semibold tracking-[2px] mb-4 text-cyan-400/70">CREATIVE PIPELINE</h2>
          <div class="space-y-3 text-sm">
            <div class="flex items-center gap-3 px-3 py-2 rounded-2xl bg-white/5">
              <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span class="text-white/90">Concept Writer</span>
            </div>
            <div class="flex items-center gap-3 px-3 py-2 rounded-2xl bg-white/5">
              <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span class="text-white/90">Cinematic Director</span>
            </div>
            <div class="flex items-center gap-3 px-3 py-2 rounded-2xl bg-white/5">
              <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span class="text-white/90">Frame Editor</span>
            </div>
            <div class="mt-4 pt-4 border-t border-white/10 text-[10px] text-white/40 leading-tight">
              Powered by<br>Cloudflare AI + Flux + Pixverse
            </div>
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

        <!-- Quick Actions (Variations + Enhance) -->
        <div id="quick-actions" class="hidden glass rounded-3xl p-4">
          <div class="flex items-center justify-between mb-3 px-1">
            <div class="text-sm text-cyan-400 font-medium">Refine this generation</div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <button onclick="generateVariations()" 
                    class="py-4 text-sm font-semibold bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/30 rounded-2xl transition flex items-center justify-center gap-2">
              <i class="fas fa-magic"></i> 
              <span>Variations (4)</span>
            </button>
            <button onclick="enhanceImage()" 
                    class="py-4 text-sm font-semibold bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-400/30 rounded-2xl transition flex items-center justify-center gap-2">
              <i class="fas fa-rocket"></i> 
              <span>Enhance / Upscale</span>
            </button>
          </div>
          <div class="text-[10px] text-white/40 text-center mt-2">Powered by prompt engineering • Results saved to vault</div>
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
    let currentUser = null;
    let lastPrompt = '';
    let lastType = 'image';

    function showLogin() { document.getElementById('loginModal').classList.remove('hidden'); }
    function hideLogin() { document.getElementById('loginModal').classList.add('hidden'); }

    async function login() {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const res = await fetch('/api/auth', { method: 'POST', body: JSON.stringify({action:'login', email, password}) });
      const data = await res.json();
      if (data.success) {
        currentUser = email;
        document.getElementById('loginBtn').innerHTML = `👤 ${email.split('@')[0]}`;
        hideLogin();
        await loadVault();
      } else {
        alert(data.message);
      }
    }

    async function register() {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const res = await fetch('/api/auth', { method: 'POST', body: JSON.stringify({action:'register', email, password}) });
      const data = await res.json();
      alert(data.message || "Account created!");
    }

    async function loadVault() {
      if (!currentUser) return;
      try {
        const res = await fetch('/api/vault', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ action: 'load', email: currentUser })
        });
        const data = await res.json();
        if (data.success && data.items) {
          history = data.items;
          renderHistory();
          renderVaultSidebar();
        }
      } catch (e) {}
    }

    async function saveToVault(item) {
      if (!currentUser) return;
      try {
        await fetch('/api/vault', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ action: 'save', email: currentUser, item })
        });
      } catch (e) {}
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
        const mediaHTML = data.type === 'video' 
          ? `<video src="${data.url}" controls autoplay loop class="w-full h-full object-cover"></video>`
          : `<img src="${data.url}" class="w-full h-full object-cover">`;

        content.innerHTML = `
          <div class="relative w-full h-full group">
            ${mediaHTML}
            <div class="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
              <a href="${data.url}" download class="px-4 py-2 text-sm bg-black/70 hover:bg-black rounded-2xl border border-white/20 flex items-center gap-2">
                <i class="fas fa-download"></i> <span>Download</span>
              </a>
            </div>
          </div>`;

        const vaultItem = {url: data.url, prompt: prompt.substring(0,55), type: data.type, ts: Date.now()};
        history.unshift(vaultItem);
        renderHistory();
        renderVaultSidebar();
        await saveToVault(vaultItem);

        // Enable quick actions for this generation
        lastPrompt = prompt;
        lastType = data.type;
        const actions = document.getElementById('quick-actions');
        if (actions) actions.classList.remove('hidden');

        // Gentle reminder for first-time R2 setup
        if (!localStorage.getItem('r2_notified')) {
          setTimeout(() => {
            const note = document.createElement('div');
            note.className = 'absolute top-4 left-4 px-3 py-1.5 text-[10px] bg-black/80 text-cyan-400 rounded-2xl border border-cyan-400/30';
            note.innerHTML = 'Tip: Make your R2 bucket public for reliable URLs';
            content.appendChild(note);
            setTimeout(() => note.remove(), 6500);
          }, 1800);
          localStorage.setItem('r2_notified', '1');
        }
      } else {
        alert(data.error || "Generation failed. Check your models and R2 bucket.");
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

    function renderVaultSidebar() {
      const el = document.getElementById('vault');
      if (!el) return;
      if (!history.length) {
        el.innerHTML = `<div class="text-xs text-white/40">Sign in to persist your generations across sessions.</div>`;
        return;
      }
      el.innerHTML = history.slice(0, 6).map(h => `
        <div onclick="window.open('${h.url}')" class="glass p-2 rounded-2xl text-xs cursor-pointer hover:ring-1 hover:ring-cyan-400/50 flex gap-2 items-center">
          ${h.type === 'video' ? '🎬' : '🖼️'}
          <span class="truncate">${h.prompt}</span>
        </div>
      `).join('');
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

    // ==================== VARIATIONS + ENHANCE ====================
    async function generateVariations() {
      if (!lastPrompt || lastType !== 'image') {
        return alert("Variations are currently available for images only. Generate an image first.");
      }
      const container = document.getElementById('content');
      const originalHTML = container.innerHTML;

      // Show loading in preview area
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center p-8">
          <div class="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mb-4"></div>
          <p class="text-cyan-400">Crafting 4 cinematic variations...</p>
        </div>`;

      const base = lastPrompt;
      const variationPrompts = [
        `${base}, wide cinematic establishing shot, dramatic atmosphere`,
        `${base}, intimate close-up, moody lighting, shallow depth of field`,
        `${base}, epic wide angle, golden hour, sweeping composition`,
        `${base}, ultra detailed macro, intricate textures, filmic color grade`
      ];

      const results = [];
      for (let i = 0; i < variationPrompts.length; i++) {
        try {
          const res = await fetch('/api/cinematic', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ prompt: variationPrompts[i], mode: 'image' })
          });
          const data = await res.json();
          if (data.success) results.push(data);
        } catch (e) {}
      }

      // Restore original + show variations modal
      container.innerHTML = originalHTML;

      if (results.length === 0) {
        alert("Could not generate variations right now. Please try again.");
        return;
      }

      showVariationsModal(results);
    }

    function enhanceImage() {
      if (!lastPrompt) return alert("Generate an image first.");
      const enhanced = `${lastPrompt}, 8k ultra high resolution, masterpiece, razor sharp details, award-winning cinematography, dramatic volumetric lighting, film grain, hyper detailed`;
      
      // Set the textarea to the enhanced prompt so user sees it
      document.getElementById('prompt').value = enhanced;
      
      // Trigger a new generation
      generate('image');
    }

    function showVariationsModal(variations) {
      // Create modal if it doesn't exist
      let modal = document.getElementById('variationsModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'variationsModal';
        modal.className = 'fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="glass rounded-3xl max-w-6xl w-full p-8 relative">
          <button onclick="document.getElementById('variationsModal').remove()" 
                  class="absolute top-4 right-4 text-white/60 hover:text-white text-2xl">×</button>
          
          <div class="flex items-center justify-between mb-6">
            <div>
              <div class="text-2xl font-bold">4 Cinematic Variations</div>
              <div class="text-sm text-white/50">Click any to load into the main preview • All saved to your vault</div>
            </div>
            <button onclick="document.getElementById('variationsModal').remove()" 
                    class="px-5 py-2 text-sm rounded-2xl bg-white/10 hover:bg-white/20">Close</button>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            ${variations.map((v, idx) => `
              <div onclick="loadVariationIntoPreview('${v.url}', '${v.prompt.replace(/'/g, "\\'")}'); document.getElementById('variationsModal').remove();" 
                   class="group cursor-pointer overflow-hidden rounded-2xl border border-white/10 hover:border-cyan-400/50 transition">
                <div class="relative">
                  <img src="${v.url}" class="w-full h-56 object-cover group-hover:scale-[1.02] transition">
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <div class="text-[10px] text-white/70">Variation ${idx + 1}</div>
                  </div>
                </div>
                <div class="p-3 text-xs text-white/60 line-clamp-2">${v.prompt}</div>
              </div>
            `).join('')}
          </div>

          <div class="mt-6 text-center text-xs text-white/40">
            Generated with refined prompt engineering • Saved automatically if signed in
          </div>
        </div>
      `;
    }

    function loadVariationIntoPreview(url, promptText) {
      const content = document.getElementById('content');
      content.innerHTML = `
        <div class="relative w-full h-full group">
          <img src="${url}" class="w-full h-full object-cover">
          <div class="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
            <a href="${url}" download class="px-4 py-2 text-sm bg-black/70 hover:bg-black rounded-2xl border border-white/20 flex items-center gap-2">
              <i class="fas fa-download"></i> <span>Download</span>
            </a>
          </div>
        </div>`;

      // Update history and vault
      const item = {url, prompt: promptText.substring(0,55), type: 'image', ts: Date.now()};
      history.unshift(item);
      renderHistory();
      renderVaultSidebar();
      saveToVault(item);

      lastPrompt = promptText;
      lastType = 'image';
      document.getElementById('quick-actions').classList.remove('hidden');
    }

    // Initial state
    document.getElementById('vault').innerHTML = `<div class="text-xs text-white/40">Sign in to persist generations.</div>`;
  </script>
</body>
</html>`;
