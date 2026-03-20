
let navigating = false;

function goWithFlash(url) {
  if (navigating) return;
  navigating = true;

  const flash = document.getElementById("flash");

  
  document.body.classList.add("gta");

  
  setTimeout(() => {
    flash.classList.add("active");
  }, 120);


  setTimeout(() => {
    window.location.href = url;
  }, 400);
}


function resetFlash() {
  const flash = document.getElementById("flash");

  if (flash) {
    flash.classList.remove("active");
    flash.style.animation = "none";
    void flash.offsetHeight;
    flash.style.animation = "";
  }

  document.body.classList.remove("gta");
  navigating = false;
}

window.addEventListener("pageshow", resetFlash);
window.addEventListener("DOMContentLoaded", resetFlash);
