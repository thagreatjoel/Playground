let navigating = false;

// 🚀 NAVIGATION WITH GTA EFFECT
function goWithFlash(url) {
  if (navigating) return;
  navigating = true;

  const flash = document.getElementById("flash");

  // Step 1: blur background
  document.body.classList.add("gta");

  // Step 2: trigger white flash
  setTimeout(() => {
    if (flash) flash.classList.add("active");
  }, 120);

  // Step 3: navigate
  setTimeout(() => {
    window.location.href = url;
  }, 400);
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
