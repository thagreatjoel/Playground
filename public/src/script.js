// ── Smooth opacity helper ──
function fadeTo(el, opacity, durationMs) {
  return new Promise(resolve => {
    el.style.transition    = `opacity ${durationMs}ms ease`;
    el.style.opacity       = opacity;
    el.style.pointerEvents = opacity > 0 ? 'all' : 'none';
    setTimeout(resolve, durationMs);
  });
}

const delay = ms => new Promise(r => setTimeout(r, ms));

// ── Auth helpers ──
function getUser() {
  try {
    const match = document.cookie.match(/user=([^;]+)/);
    if (!match) return null;
    return JSON.parse(decodeURIComponent(match[1]));
  } catch { return null; }
}

function logout() {
  document.cookie = "user=; Path=/; Max-Age=0";
  window.location.href = "/";
}

// ── Fix white screen on browser back (bFCache) ──
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    try {
      const flash = document.getElementById('flash');
      if (flash) { flash.style.transition = 'none'; flash.style.opacity = '0'; flash.style.pointerEvents = 'none'; }
      document.body.style.transition = 'none';
      document.body.style.filter     = 'none';
      document.body.style.opacity    = '1';
    } catch {}
  }
});

// ── ON LOAD ──
window.addEventListener('DOMContentLoaded', () => {
  try {
    // Strip ?code= from URL
    if (window.location.search.includes('code=')) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    const flash = document.getElementById('flash');
    if (flash) {
      const isRefresh = performance.getEntriesByType('navigation')[0]?.type === 'reload';
      if (isRefresh) {
        flash.style.transition    = 'none';
        flash.style.opacity       = '0';
        flash.style.pointerEvents = 'none';
      } else {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          fadeTo(flash, 0, 700);
        }));
      }
    }
  } catch(e) { console.error('flash error:', e); }

  // ── Auth ──
  try {
    const user = getUser();
    if (user) {
      const name   = user.name || user.display_name || "User";
      const email  = user.email || "";
      const slack  = user.slack_id || "";
      const userId = user.user_id || "";

      let avatar = user.picture || user.avatar_url || user.image || user.avatar || "";
      if (!avatar) avatar = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

      const pfpEl     = document.getElementById("pfp");
      const pfpHudEl  = document.getElementById("pfpHud");
      const nameEl    = document.getElementById("name");
      const nameHudEl = document.getElementById("nameHud");
      const emailEl   = document.getElementById("email");
      const slackEl   = document.getElementById("slack");

      if (pfpEl)     pfpEl.src           = avatar;
      if (pfpHudEl)  pfpHudEl.src        = avatar;
      if (nameEl)    nameEl.innerText     = name;
      if (nameHudEl) nameHudEl.innerText  = name;
      if (emailEl)   emailEl.innerText    = email;
      if (slackEl)   slackEl.innerText    = "Slack: " + slack;

      // Fetch latest avatar from DB in background
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
  } catch(e) { console.error('auth error:', e); }
});

// ── NAVIGATE ──
async function goWithFlash(url) {
  try {
    const flash = document.getElementById('flash');
    const hud   = document.querySelector('.hud-card');
    document.querySelectorAll('.btn').forEach(b => b.disabled = true);

    document.body.style.transition = 'filter 0.1s ease';
    document.body.style.filter     = 'blur(10px)';
    if (hud) { hud.style.transition = 'none'; hud.style.filter = 'blur(0)'; }
    await delay(100);

    if (flash) await fadeTo(flash, 1, 110);
    window.location.href = url;
  } catch(e) {
    window.location.href = url;
  }
}

const navigateTo = goWithFlash;
