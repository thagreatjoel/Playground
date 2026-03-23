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
// ── Fix white screen on browser back (bFCache restore) ──
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    // Page restored from bFCache — snap flash away instantly
    const flash = document.getElementById('flash');
    if (flash) {
      flash.style.transition  = 'none';
      flash.style.opacity     = '0';
      flash.style.pointerEvents = 'none';
    }
    // Also reset body blur
    document.body.style.transition = 'none';
    document.body.style.filter     = 'none';
    document.body.style.opacity    = '1';
  }
});

window.addEventListener('DOMContentLoaded', () => {
  // Strip any ?code= from URL (leftover from OAuth)
  if (window.location.search.includes('code=')) {
    window.history.replaceState({}, '', window.location.pathname);
  }

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

    // Set from cookie immediately — use null checks since not all pages have all elements
    const pfpEl     = document.getElementById("pfp");
    const pfpHudEl  = document.getElementById("pfpHud");
    const nameEl    = document.getElementById("name");
    const nameHudEl = document.getElementById("nameHud");
    const emailEl   = document.getElementById("email");
    const slackEl   = document.getElementById("slack");

    if (pfpEl)     pfpEl.src             = avatar;
    if (pfpHudEl)  pfpHudEl.src          = avatar;
    if (nameEl)    nameEl.innerText      = name;
    if (nameHudEl) nameHudEl.innerText   = name;
    if (emailEl)   emailEl.innerText     = email;
    if (slackEl)   slackEl.innerText     = "Slack: " + slack;

    // Fetch latest avatar from DB in background
    const userId = user.user_id;
    if (userId && userId !== 'null') {
      fetch('/.netlify/functions/profile?user_id=' + encodeURIComponent(userId))
        .then(r => r.json())
        .then(d => {
          if (d.success && d.user.avatar) {
            if (pfpEl)    pfpEl.src    = d.user.avatar;
            if (pfpHudEl) pfpHudEl.src = d.user.avatar;
          }
        })
        .catch(() => {});
    }
  }
});

// ── NAVIGATE: blur (100ms) → flash fade in (110ms) → navigate ──
async function goWithFlash(url) {
  const flash = document.getElementById('flash');
  const hud   = document.querySelector('.hud-card');
  document.querySelectorAll('.btn').forEach(b => b.disabled = true);

  // 1. Blur page but NOT the HUD
  document.body.style.transition = 'filter 0.1s ease';
  document.body.style.filter     = 'blur(10px)';
  if (hud) {
    hud.style.transition = 'none';
    hud.style.filter     = 'blur(0)';
  }
  await delay(100);

  // 2. Flash fade in over 110ms
  await fadeTo(flash, 1, 110);

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
