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
