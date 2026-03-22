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

// ── NAVIGATE: blur → flash → navigate ──
async function goWithFlash(url) {
  const flash = document.getElementById('flash');
  document.querySelectorAll('.btn').forEach(b => b.disabled = true);

  // 1. Blur the page — visible before flash covers it
  document.body.style.transition = 'filter 0.3s ease';
  document.body.style.filter     = 'blur(10px)';

  await delay(300);

  // 2. Fade flash in over the blurred page
  await fadeTo(flash, 1, 350);

  // 3. Navigate while fully covered
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





async function addCurrency() {
    const user     = getUser();
    const slack_id = user.sub || user.slack_id;

    const res  = await fetch('/.netlify/functions/addcurrency', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ slack_id }),
    });

    const data = await res.json();

    // Update UI instantly
    document.getElementById('silicon').innerText      = data.silicon;
    document.getElementById('conductor').innerText    = data.conductor;
    document.getElementById('diode').innerText        = data.diode;
    document.getElementById('siliconHud').innerText   = data.silicon;
    document.getElementById('conductorHud').innerText = data.conductor;
    document.getElementById('diodeHud').innerText     = data.diode;
  }



