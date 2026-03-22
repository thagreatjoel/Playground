// ── Page arrival: flash out + blur out ──
window.addEventListener('DOMContentLoaded', () => {
  const flash = document.getElementById('flash');

  // Start fully white
  flash.style.opacity = '1';
  flash.style.transition = 'none';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Fade out white flash
      flash.style.transition = 'opacity 0.6s ease';
      flash.style.opacity = '0';

      // Un-blur the body
      document.body.style.transition = 'filter 0.65s ease, opacity 0.65s ease';
      document.body.classList.remove('arrive-blurred');
    });
  });
});

// ── Single transition function used by ALL buttons ──
async function goWithFlash(url) {
  const flash = document.getElementById('flash');

  // Disable all buttons to prevent double-clicks
  document.querySelectorAll('.btn, #goBtn').forEach(b => b.disabled = true);

  // Step 1: blur + dim the whole page
  document.body.style.transition = 'filter 0.4s ease, opacity 0.4s ease';
  document.body.style.filter = 'blur(14px)';
  document.body.style.opacity = '0.4';

  // Step 2: white flash
  await delay(350);
  flash.style.transition = 'opacity 0.22s ease';
  flash.style.opacity = '1';
  flash.style.pointerEvents = 'all';

  // Step 3: navigate while screen is white
  await delay(200);
  window.location.href = url;
}

// Alias so Test button (navigateTo) also works
const navigateTo = goWithFlash;

const delay = ms => new Promise(r => setTimeout(r, ms));


// ── Auth ──
function getUser() {
  const match = document.cookie.match(/user=([^;]+)/);
  if (!match) return null;
  return JSON.parse(decodeURIComponent(match[1]));
}

const user = getUser();
console.log("USER:", user);

if (user) {
  const name  = user.name || user.display_name || "User";
  const email = user.email || "";
  const slack = user.slack_id || "";

  let avatar = user.picture || user.avatar_url || user.image || "";
  if (!avatar) avatar = "https://api.dicebear.com/7.x/initials/svg?seed=" + name;

  document.getElementById("pfp").src       = avatar;
  document.getElementById("pfpHud").src    = avatar;
  document.getElementById("name").innerText      = name;
  document.getElementById("nameHud").innerText   = name;
  document.getElementById("email").innerText     = email;
  document.getElementById("slack").innerText     = "Slack: " + slack;
}

function logout() {
  document.cookie = "user=; Path=/; Max-Age=0";
  window.location.href = "/";
}
