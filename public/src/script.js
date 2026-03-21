let navigating = false;

// GTA navigation
function goWithFlash(url) {
  if (navigating) return;

  navigating = true;

  const flash = document.getElementById("flash");

  document.body.classList.add("gta");
  flash.classList.add("active");

  setTimeout(() => {
    window.location.href = url;
  }, 350);
}

// 🔥 HARD RESET (fix white screen on back)
function resetFlash() {
  const flash = document.getElementById("flash");

  if (flash) {
    flash.classList.remove("active");
    flash.style.animation = "none"; // force reset animation
    void flash.offsetHeight;        // reflow (important)
    flash.style.animation = "";
  }

  document.body.classList.remove("gta");
  navigating = false;
}

// When page is shown (back/forward cache)
window.addEventListener("pageshow", resetFlash);

// Normal load
window.addEventListener("DOMContentLoaded", resetFlash);








  

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
