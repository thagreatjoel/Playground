let navigating = false;

// 🚀 NAVIGATION WITH GTA EFFECT
function goWithFlash(url) {
  if (navigating) return;
  navigating = true;

  function goWithFlash(url) {
  if (navigating) return;
  navigating = true;

  const flash = document.getElementById("flash");

  document.body.classList.add("gta");

  if (flash) {
    flash.classList.add("active");

    // FORCE render before navigation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          window.location.href = url;
        }, 150); // small delay so flash is visible
      });
    });
  }
  }
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
