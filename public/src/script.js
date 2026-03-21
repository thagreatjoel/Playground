
let navigating = false;

function goWithFlash(url) {
  if (navigating) return;
  navigating = true;

  const flash = document.getElementById("flash");

  // 0ms → blur
  document.body.classList.add("gta");

  // 100ms → flash IN
  setTimeout(() => {
    if (flash) {
      flash.classList.add("active");
    }
  }, 100);

  // 400ms → navigate
  setTimeout(() => {
    window.location.href = url;
  }, 400);
}


// 🔄 ON NEW PAGE LOAD
function resetFlash() {
  const flash = document.getElementById("flash");
  if (!flash) return;

  // keep white visible initially
  flash.style.opacity = "1";

  // 450ms → flash OUT
  setTimeout(() => {
    flash.style.transition = "opacity 0.2s ease";
    flash.style.opacity = "0";
  }, 50);

  // 500ms → remove blur
  setTimeout(() => {
    document.body.classList.remove("gta");
  }, 100);

  // cleanup
  setTimeout(() => {
    flash.classList.remove("active");
    flash.style.transition = "";
    navigating = false;
  }, 300);
}


// load handlers
window.addEventListener("DOMContentLoaded", resetFlash);
window.addEventListener("pageshow", resetFlash);





// 🔄 RESET + FADE OUT ON LOAD
function resetFlash() {
  const flash = document.getElementById("flash");

  if (!flash) return;

  // Keep white visible initially
  flash.style.opacity = "1";

  // Fade out after slight delay
  setTimeout(() => {
    flash.style.transition = "opacity 0.4s ease";
    flash.style.opacity = "0";

    // remove blur
    document.body.classList.remove("gta");
  }, 100);

  // Cleanup after animation
  setTimeout(() => {
    flash.classList.remove("active");
    flash.style.transition = "";
    navigating = false;
  }, 600);
}


// 🧠 Handle normal load
window.addEventListener("DOMContentLoaded", resetFlash);

// 🔁 Handle back/forward cache (VERY IMPORTANT)
window.addEventListener("pageshow", resetFlash);





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
