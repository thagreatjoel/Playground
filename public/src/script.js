
let navigating = false;

function goWithFlash(url) {
  if (navigating) return;
  navigating = true;

  const flash = document.getElementById("flash");

  // Step 1: ensure starting state
  flash.style.opacity = "0";

  // Step 2: next frame → trigger fade IN
  requestAnimationFrame(() => {
    flash.style.opacity = "1";

    // Step 3: wait for visible, then navigate
    setTimeout(() => {
      window.location.href = url;
    }, 300);
  });
}


// 🔄 fade OUT on new page
function resetFlash() {
  const flash = document.getElementById("flash");
  if (!flash) return;

  // start white
  flash.style.opacity = "1";

  // next frame → fade out
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      flash.style.opacity = "0";
    });
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
