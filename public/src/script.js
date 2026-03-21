let navigating = false;

function goWithFlash(url) {
  try {
    if (navigating) return;
    navigating = true;

    const flash = document.getElementById("flash");
    if (!flash) {
      window.location.href = url;
      return;
    }

    // reset state
    flash.style.transition = "none";
    flash.style.opacity = "0";

    // force apply
    flash.offsetHeight;

    // next frame → fade in
    requestAnimationFrame(() => {
      flash.style.transition = "opacity 0.25s ease";
      flash.style.opacity = "1";

      setTimeout(() => {
        window.location.href = url;
      }, 250);
    });

  } catch (e) {
    console.error(e);
    window.location.href = url; // fallback
  }
}


// fade out on load
function resetFlash() {
  const flash = document.getElementById("flash");
  if (!flash) return;

  flash.style.transition = "none";
  flash.style.opacity = "1";

  requestAnimationFrame(() => {
    flash.style.transition = "opacity 0.3s ease";
    flash.style.opacity = "0";
  });

  setTimeout(() => {
    navigating = false;
  }, 400);
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
