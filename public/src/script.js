let navigating = false;

function goWithFlash(url) {
  if (navigating) return;
  navigating = true;

  const flash = document.getElementById("flash");

  // 0ms → start blur (fade in)
  document.body.classList.add("gta");

  // FORCE paint so blur actually starts animating
  document.body.offsetHeight;

  // 100ms → start flash fade in
  setTimeout(() => {
    flash.classList.add("active");
  }, 100);

  // 350ms → WAIT until flash is VISIBLE, then navigate
  setTimeout(() => {
    window.location.href = url;
  }, 350);
}



function resetFlash() {
  const flash = document.getElementById("flash");
  if (!flash) return;

  // start fully white
  flash.style.opacity = "1";

  // fade OUT flash first
  setTimeout(() => {
    flash.style.transition = "opacity 0.3s ease";
    flash.style.opacity = "0";
  }, 50);

  // then remove blur AFTER
  setTimeout(() => {
    document.body.classList.remove("gta");
  }, 300);

  setTimeout(() => {
    flash.classList.remove("active");
    flash.style.transition = "";
    navigating = false;
  }, 600);
}

window.addEventListener("DOMContentLoaded", resetFlash);
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
