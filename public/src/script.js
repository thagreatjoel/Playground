window.addEventListener('DOMContentLoaded', () => {
    const flash   = document.getElementById('flash');
    const content = document.getElementById('page-content');

    // Start fully white
    flash.style.opacity    = '1';
    flash.style.transition = 'none';
    content.style.transition = 'none';

    requestAnimationFrame(() => {
      requestAnimationFrame(async () => {
        // Fade out the white flash
        flash.style.transition = 'opacity 0.55s ease';
        flash.style.opacity    = '0';

        // Simultaneously un-blur the content
        content.style.transition = 'filter 0.65s ease, opacity 0.65s ease';
        content.classList.remove('arrive-blurred');
      });
    });
  });

  async function navigateTo(url) {
    const content = document.getElementById('page-content');
    const flash   = document.getElementById('flash');
    const btn     = document.getElementById('goBtn');

    btn.disabled = true;

    content.classList.add('blurring');
    await delay(400);
    flash.style.transition = 'opacity 0.25s ease';
    flash.style.opacity    = '1';
    flash.style.pointerEvents = 'all';

    await delay(220);
    window.location.href = url;
  }

  const delay = ms => new Promise(r => setTimeout(r, ms));






  

function getUser() {
  const match = document.cookie.match(/user=([^;]+)/);
  if (!match) return null;
  return JSON.parse(decodeURIComponent(match[1]));
}

const user = getUser();
console.log("USER:", user);

if (user) {
  const name = user.name || user.display_name || "User";
  const email = user.email || "";
  const slack = user.slack_id || "";

  // 🔥 FIXED AVATAR
  let avatar =
    user.picture ||
    user.avatar_url ||
    user.image ||
    "";

  // fallback avatar
  if (!avatar) {
    avatar = "https://api.dicebear.com/7.x/initials/svg?seed=" + name;
  }

  // set UI
  document.getElementById("pfp").src = avatar;
  document.getElementById("pfpHud").src = avatar;

  document.getElementById("name").innerText = name;
  document.getElementById("nameHud").innerText = name;

  document.getElementById("email").innerText = email;
  document.getElementById("slack").innerText = "Slack: " + slack;
}





function logout() {
  // 🔥 delete cookie
  document.cookie = "user=; Path=/; Max-Age=0";

  // redirect to home
  window.location.href = "/";
}
