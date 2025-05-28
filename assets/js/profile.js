/* Helper untuk parse JSON aman */
function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/* Simpan ke localStorage dengan penanganan quota */
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e.name === "QuotaExceededError" || e.code === 22) {
      showToast("⚠️ Kapasitas local storage penuh!", 3000);
    } else {
      console.error("Error saat setItem:", e);
    }
    return false;
  }
}

/* Toast untuk notifikasi */
function showToast(msg, dur = 3000) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), dur);
}

function getBorderUrl(name) {
  const custom = safeParse(localStorage.getItem("customBorders"), []);
  const found = custom.find((c) => c.name === name);
  return found ? found.url : `../../images/borders/${name}`;
}

function getUserData(username) {
  const data = localStorage.getItem(`user_${username}`);
  return data ? safeParse(data, null) : null;
}

function setUserData(username, obj) {
  safeSetItem(`user_${username}`, JSON.stringify(obj));
}

function updateUserProfile(username, profileData) {
  const user = getUserData(username);
  if (!user) return;
  user.profile = { ...user.profile, ...profileData };
  setUserData(username, user);
}

function pickImage(callback) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = () => {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.readAsDataURL(file);
  };
  input.click();
}

async function hashSHA256(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getThreads() {
  const raw = localStorage.getItem("forumThreads");
  return raw ? safeParse(raw, []) : [];
}

/* Stub: implement rendering thread sesuai UI kamu */
function loadThreads() {
  const threads = getThreads();
  // TODO: render threads di halaman forum
  console.log("Threads loaded:", threads);
}

/* INISIALISASI UI */
document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (!isLoggedIn) {
    alert("Silakan login terlebih dahulu untuk mengakses halaman ini.");
    return (window.location.href = "login.html");
  }

  const username = localStorage.getItem("username");
  const role = localStorage.getItem("userRole") || "user";

  const adminLink = document.getElementById("admin-only");
  if (role !== "admin") {
    adminLink.textContent = "HertaHub";
    adminLink.href = "#main";
  }

  /* Elemen DOM */
  const profileHeader = document.getElementById("profileHeader");
  const avatarImg = document.getElementById("avatarImg");
  const borderOverlay = document.getElementById("borderOverlay");
  const displayUsername = document.getElementById("displayUsername");

  const usernameInput = document.getElementById("usernameInput");
  const saveUsernameBtn = document.getElementById("saveUsernameBtn");
  const oldPassword = document.getElementById("oldPassword");
  const newPassword = document.getElementById("newPassword");
  const confirmNewPassword = document.getElementById("confirmNewPassword");
  const savePasswordBtn = document.getElementById("savePasswordBtn");

  const roleSelect = document.getElementById("roleSelect");
  const saveRoleBtn = document.getElementById("saveRoleBtn");

  const editAvatarBtn = document.getElementById("editAvatarBtn");
  const editBorderBtn = document.getElementById("editBorderBtn");
  const borderModal = document.getElementById("borderModal");
  const borderGallery = document.getElementById("borderGallery");
  const closeBorderModal = document.getElementById("closeBorderModal");
  const selectedBorderName = document.getElementById("selectedBorderName");
  const addBorderBtn = document.getElementById("addBorderBtn");

  function loadProfile() {
    displayUsername.textContent = username;
    usernameInput.value = username;

    const user = getUserData(username) || {};
    const profile = user.profile || {};

    if (profile.bg)
      profileHeader.style.backgroundImage = `url('${profile.bg}')`;
    if (profile.avatar) avatarImg.src = profile.avatar;

    const sel = profile.border || "";
    if (sel) borderOverlay.src = getBorderUrl(sel);
    selectedBorderName.textContent = sel;

    roleSelect.value = role;
    renderBorderGallery();
  }

  /* Render galeri border */
  function renderBorderGallery() {
    borderGallery.innerHTML = "";

    const defaults = [
      {
        url: "../../images/borders/Default_Border.png",
        name: "Default_Border.png",
      },
      { url: "../../images/borders/We_Heart_It.gif", name: "We_Heart_It.gif" },
    ];

    const custom = safeParse(localStorage.getItem("customBorders"), []);
    const userData = getUserData(username) || {};
    const saved = userData.profile?.border || "";

    const all = [...defaults, ...custom];
    all.forEach(({ url, name }) => {
      const container = document.createElement("div");
      container.className = "border-container";
      container.style.position = "relative";
      container.style.display = "inline-block";
      container.style.margin = "5px";

      const img = document.createElement("img");
      img.src = url;
      img.className = "border-item";
      img.title = name;
      if (name === saved) img.classList.add("selected");
      container.appendChild(img);

      /* Tombol hapus hanya untuk admin pada border custom */
      if (custom.some((c) => c.name === name) && role === "admin") {
        const delBtn = document.createElement("button");
        delBtn.textContent = "Hapus";
        delBtn.className = "delete-border-btn";
        Object.assign(delBtn.style, {
          position: "absolute",
          top: "2px",
          right: "2px",
          background: "rgba(255,255,255,0.7)",
          border: "none",
          cursor: "pointer",
        });
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const filtered = custom.filter((c) => c.name !== name);
          safeSetItem("customBorders", JSON.stringify(filtered));
          if (userData.profile?.border === name) {
            updateUserProfile(username, { border: "" });
            borderOverlay.src = defaults[0].url;
            selectedBorderName.textContent = defaults[0].name;
          }
          renderBorderGallery();
        });
        container.appendChild(delBtn);
      }

      img.addEventListener("click", () => {
        updateUserProfile(username, { border: name });
        borderOverlay.src = url;
        selectedBorderName.textContent = name;
        borderModal.style.display = "none";
        renderBorderGallery();
      });

      borderGallery.appendChild(container);
    });
  }

  /* Event Listeners */
  profileHeader.style.cursor = "pointer";
  profileHeader.addEventListener("click", (e) => {
    if (e.target.closest(".avatar-container") || e.target === editBorderBtn)
      return;
    pickImage((data) => {
      profileHeader.style.backgroundImage = `url('${data}')`;
      updateUserProfile(username, { bg: data });
    });
  });

  editAvatarBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    pickImage((data) => {
      avatarImg.src = data;
      updateUserProfile(username, { avatar: data });
    });
  });

  /* Buka modal border */
  editBorderBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    borderModal.style.display = "flex";
    renderBorderGallery();
    addBorderBtn.style.display = role === "admin" ? "inline-block" : "none";
  });

  /* Tambah border (admin only) */
  function handleAddBorder() {
    if (role !== "admin")
      return showToast("⚠️ Hanya admin yang bisa menambah border!", 3000);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const custom = safeParse(localStorage.getItem("customBorders"), []);
        custom.push({ url: dataUrl, name: file.name });
        safeSetItem("customBorders", JSON.stringify(custom));
        renderBorderGallery();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }
  addBorderBtn.addEventListener("click", handleAddBorder);

  closeBorderModal.addEventListener(
    "click",
    () => (borderModal.style.display = "none")
  );

  /* Simpan username baru */
  saveUsernameBtn.addEventListener("click", () => {
    const newU = usernameInput.value.trim();
    if (!newU) return showToast("⚠️ Username tidak boleh kosong!");

    const oldU = username;
    const userObj = getUserData(oldU);
    if (!userObj) return showToast("⚠️ Data user lama tidak ditemukan!");

    if (!safeSetItem(`user_${newU}`, JSON.stringify(userObj))) return;
    localStorage.removeItem(`user_${oldU}`);
    safeSetItem("username", newU);

    const threads = getThreads();
    threads.forEach((t) => {
      if (t.author === oldU) t.author = newU;
      t.replies?.forEach((r) => {
        if (r.author === oldU) r.author = newU;
      });
    });
    safeSetItem("forumThreads", JSON.stringify(threads));

    displayUsername.textContent = newU;
    usernameInput.value = newU;
    window.dispatchEvent(new Event("profileUpdated"));
    showToast(`Username berhasil diubah ke “${newU}”!`, 3000);
  });

  /* Simpan password baru */
  savePasswordBtn.addEventListener("click", async () => {
    try {
      const userKey = `user_${username}`;
      const data = getUserData(username);
      const oldHash = await hashSHA256(oldPassword.value + data.salt);
      if (oldHash !== data.hash)
        return showToast("⚠️ Password lama salah!", 3000);
      if (newPassword.value !== confirmNewPassword.value)
        return showToast("⚠️ Konfirmasi password baru tidak cocok!", 3000);

      data.hash = await hashSHA256(newPassword.value + data.salt);
      safeSetItem(userKey, JSON.stringify(data));
      showToast("Password berhasil diubah!", 3000);
    } catch {
      showToast("⚠️ Error mengganti password.", 3000);
    }
  });

  /* Simpan role (admin) */
  if (role === "admin") {
    saveRoleBtn.addEventListener("click", () => {
      const user = getUserData(username);
      user.role = roleSelect.value;
      setUserData(username, user);
      safeSetItem("userRole", roleSelect.value);
      showToast("Role berhasil disimpan!", 3000);
    });
  } else {
    document.getElementById("profile-admin-only").style.display = "none";
  }

  /* Render profile dan load threads */
  loadProfile();
  loadThreads();
  window.addEventListener("profileUpdated", loadThreads);
});

/* Authentication link */
window.onload = function () {
  const authLink = document.getElementById("authLink");
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (isLoggedIn) {
    authLink.textContent = "Logout";
    authLink.href = "#";
    authLink.onclick = (e) => {
      e.preventDefault();
      logout();
    };
  } else {
    authLink.textContent = "Login";
    authLink.href = "login.html";
    authLink.onclick = null;
  }
};

function logout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userRole");
  localStorage.removeItem("username");
  window.location.href = "login.html";
}
