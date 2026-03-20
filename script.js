
let navigating = false;

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
