// ── Smooth opacity helper ──
function fadeTo(el, opacity, durationMs) {
  return new Promise(resolve => {
    el.style.transition    = `opacity ${durationMs}ms ease`;
    el.style.opacity       = opacity;
    el.style.pointerEvents = opacity > 0 ? 'all' : 'none';
    setTimeout(resolve, durationMs);
  });
}

// ── ON LOAD: start white, fade out ──
window.addEventListener('DOMContentLoaded', () => {
  const flash = document.getElementById('flash');

  // Start fully white instantly
  flash.style.transition    = 'none';
  flash.style.opacity       = '1';
  flash.style.pointerEvents = 'all';

  // Then smooth fade out
  requestAnimationFrame(() => requestAnimationFrame(() => {
    fadeTo(flash, 0, 700);
  }));

  // ── Auth ──
  const user = getUser();
  console.log("USER:", user);

  if (user) {
    const name  = user.name || user.display_name || "User";
    const email = user.email || "";
    const slack = user.slack_id || "";

    let avatar = user.picture || user.avatar_url || user.image || "";
    if (!avatar) avatar = "https://api.dicebear.com/7.x/initials/svg?seed=" + name;

    document.getElementById("pfp").src          = avatar;
    document.getElementById("pfpHud").src       = avatar;
    document.getElementById("name").innerText   = name;
    document.getElementById("nameHud").innerText = name;
    document.getElementById("email").innerText  = email;
    document.getElementById("slack").innerText  = "Slack: " + slack;
  }
});

// ── NAVIGATE: blur → fade to white → navigate ──
async function goWithFlash(url) {
  const flash = document.getElementById('flash');

  document.querySelectorAll('.btn').forEach(b => b.disabled = true);

  // 1. Blur the page
  document.body.style.transition = 'filter 0.35s ease';
  document.body.style.filter     = 'blur(10px)';

  await delay(300);

  // 2. Smooth fade in to full white
  await fadeTo(flash, 1, 400);

  // 3. Navigate while fully white
  window.location.href = url;
}

// Alias — keeps any old navigateTo() calls working
const navigateTo = goWithFlash;

// ── Auth helpers ──
function getUser() {
  const match = document.cookie.match(/user=([^;]+)/);
  if (!match) return null;
  return JSON.parse(decodeURIComponent(match[1]));
}

function logout() {
  document.cookie = "user=; Path=/; Max-Age=0";
  window.location.href = "/";
}

const delay = ms => new Promise(r => setTimeout(r, ms));
