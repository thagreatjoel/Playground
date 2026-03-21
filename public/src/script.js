let navigating = false;

// 🚀 NAVIGATION WITH GTA EFFECT (FIXED)
function goWithFlash(url) {
  if (navigating) return;
  navigating = true;

  const flash = document.getElementById("flash");
  const page = document.getElementById("page"); // 🔥 new

  // Step 1: blur + zoom (on wrapper, not body)
  if (page) page.classList.add("gta");

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
  const page = document.getElementById("page");

  if (!flash) return;

  flash.style.opacity = "1";

  setTimeout(() => {
    flash.style.transition = "opacity 0.4s ease";
    flash.style.opacity = "0";

    if (page) page.classList.remove("gta");

    // 🔥 restore scroll
    document.body.style.overflow = "";
  }, 100);

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
