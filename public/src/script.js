// ── Smooth opacity helper ──
function fadeTo(el, opacity, durationMs) {
  return new Promise(resolve => {
    el.style.transition    = `opacity ${durationMs}ms ease`;
    el.style.opacity       = opacity;
    el.style.pointerEvents = opacity > 0 ? 'all' : 'none';
    setTimeout(resolve, durationMs);
  });
}

// ── ON LOAD ──
window.addEventListener('DOMContentLoaded', () => {
  const flash = document.getElementById('flash');
  const isRefresh = performance.getEntriesByType('navigation')[0]?.type === 'reload';

  if (isRefresh) {
    // Refresh: snap flash away instantly
    flash.style.transition    = 'none';
    flash.style.opacity       = '0';
    flash.style.pointerEvents = 'none';
  } else {
    // Navigation arrival: CSS starts at opacity 1, smooth fade out
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fadeTo(flash, 0, 700);
    }));
  }

  // ── Auth ──
  const user = getUser();
  console.log("USER:", user);

  if (user) {
    const name  = user.name || user.display_name || "User";
    const email = user.email || "";
    const slack = user.slack_id || "";

    let avatar = user.picture || user.avatar_url || user.image || "";
    if (!avatar) avatar = "https://api.dicebear.com/7.x/initials/svg?seed=" + name;

    document.getElementById("pfp").src           = avatar;
    document.getElementById("pfpHud").src        = avatar;
    document.getElementById("name").innerText    = name;
    document.getElementById("nameHud").innerText = name;
    document.getElementById("email").innerText   = email;
    document.getElementById("slack").innerText   = "Slack: " + slack;
  }
});

// ── NAVIGATE: blur (100ms) → flash fade in (110ms) → navigate ──
async function goWithFlash(url) {
  const flash = document.getElementById('flash');
  document.querySelectorAll('.btn').forEach(b => b.disabled = true);

  // 1. Blur over 100ms
  document.body.style.transition = 'filter 0.1s ease';
  document.body.style.filter     = 'blur(10px)';
  await delay(100);

  // 2. Flash fade in over 110ms
  await fadeTo(flash, 1, 130);

  // 3. Navigate
  window.location.href = url;
}

// Alias
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
