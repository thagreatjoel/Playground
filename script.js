let navigating = false;

function goWithFlash(url) {
  if (navigating) return;
  navigating = true;

  const flash = document.getElementById("flash");

  // STEP 1: blur first
  document.body.classList.add("blur");

  // STEP 2: slight delay, then flash
  setTimeout(() => {
    flash.classList.add("active");
  }, 120);

  // STEP 3: navigate after full effect
  setTimeout(() => {
    window.location.href = url;
  }, 140);
}

// RESET (fix white screen on back)
function resetFlash() {
  const flash = document.getElementById("flash");

  if (flash) {
    flash.classList.remove("active");
    flash.style.animation = "none";
    void flash.offsetHeight;
    flash.style.animation = "";
  }

  document.body.classList.remove("blur");
  navigating = false;
}

window.addEventListener("pageshow", resetFlash);
window.addEventListener("DOMContentLoaded", resetFlash);
