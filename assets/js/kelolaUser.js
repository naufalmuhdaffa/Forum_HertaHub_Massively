if (localStorage.getItem("userRole") !== "admin") {
  alert("Kamu bukan admin! Akses ditolak! 😤");
  window.location.href = "login.html";
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e.name === "QuotaExceededError" || e.code === 22) {
      showError("Kapasitas local storage penuh!");
    } else {
      console.error("Error saat setItem:", e);
    }
    return false;
  }
}

function showError(message) {
  const t = document.getElementById("toast");
  t.textContent = "⚠️ " + message;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

document.addEventListener("DOMContentLoaded", () => {
  renderUserTable();
});

async function hashSHA256(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateSalt(length = 16) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getAllUsers() {
  const users = [];
  for (let key in localStorage) {
    if (key.startsWith("user_")) {
      const username = key.replace("user_", "");
      const data = JSON.parse(localStorage.getItem(key));
      users.push({ username, ...data });
    }
  }
  return users;
}

function renderUserTable() {
  const tbody = document.getElementById("userTableBody");
  tbody.innerHTML = "";

  const users = getAllUsers();
  users.forEach((user) => {
    const tr = document.createElement("tr");

    const tdUsername = document.createElement("td");
    tdUsername.textContent = user.username;

    const tdRole = document.createElement("td");
    tdRole.textContent = user.role || "user";

    const tdActions = document.createElement("td");

    const promoteBtn = document.createElement("button");
    promoteBtn.textContent = "Promote ke Admin";
    promoteBtn.onclick = () => promoteUser(user.username);

    const demoteBtn = document.createElement("button");
    demoteBtn.textContent = "Demote ke User";
    demoteBtn.onclick = () => demoteUser(user.username);

    const updateBtn = document.createElement("button");
    updateBtn.textContent = "Update";
    updateBtn.onclick = () => updateUser(user.username);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Hapus";
    deleteBtn.onclick = () => deleteUser(user.username);

    tdActions.append(promoteBtn, demoteBtn, updateBtn, deleteBtn);
    tr.append(tdUsername, tdRole, tdActions);
    tbody.appendChild(tr);

    tdUsername.setAttribute("data-label", "Username");
    tdRole.setAttribute("data-label", "Role");
    tdActions.setAttribute("data-label", "Aksi");
  });
}

function promoteUser(username) {
  const userKey = "user_" + username;
  const userData = JSON.parse(localStorage.getItem(userKey));
  if (!userData) return alert("User tidak ditemukan!");

  // 1. Ubah role di profile
  userData.role = "admin";
  safeSetItem(userKey, JSON.stringify(userData));

  // 2. Jika ini admin sedang ganti role sendiri, update sesi
  if (username === localStorage.getItem("username")) {
    safeSetItem("userRole", "admin");
  }

  // 3. Update semua thread dan reply milik user
  const threads = getThreads();  // helper yang sudah kamu buat
  threads.forEach(thread => {
    if (thread.author === username) {
      thread.role = "admin";
    }
    if (thread.replies) {
      thread.replies.forEach(reply => {
        if (reply.author === username) {
          reply.role = "admin";
        }
      });
    }
  });
  safeSetItem("forumThreads", JSON.stringify(threads));

  alert("User " + username + " sekarang adalah admin! 🛡️");
  renderUserTable();
  loadThreads();  // refresh tampilan forum
}

function demoteUser(username) {
  const userKey = "user_" + username;
  const userData = JSON.parse(localStorage.getItem(userKey));
  if (!userData) return alert("User tidak ditemukan!");

  // 1. Ubah role di profile
  userData.role = "user";
  safeSetItem(userKey, JSON.stringify(userData));

  // 2. Jika ini admin sendiri, update sesi
  if (username === localStorage.getItem("username")) {
    safeSetItem("userRole", "user");
  }

  // 3. Update semua thread dan reply milik user
  const threads = getThreads();
  threads.forEach(thread => {
    if (thread.author === username) {
      thread.role = "user";
    }
    if (thread.replies) {
      thread.replies.forEach(reply => {
        if (reply.author === username) {
          reply.role = "user";
        }
      });
    }
  });
  safeSetItem("forumThreads", JSON.stringify(threads));

  alert("User " + username + " sudah di-demote jadi user biasa. 😶");
  renderUserTable();
  loadThreads();
}


async function updateUser(username) {
  const newUsername = prompt("Masukkan username baru untuk " + username);
  const newPassword = prompt("Masukkan password baru");

  if (!newUsername || !newPassword) {
    alert("Username dan password harus diisi!");
    return;
  }

  const salt = generateSalt();
  const hash = await hashSHA256(newPassword + salt);

  const oldUserData = JSON.parse(localStorage.getItem("user_" + username));
  const updatedUser = {
    ...oldUserData,
    hash,
    salt,
  };

  localStorage.removeItem("user_" + username);
  safeSetItem("user_" + newUsername, JSON.stringify(updatedUser));

  alert("User berhasil diupdate! 🎉");
  renderUserTable();
}

function deleteUser(username) {
  if (confirm("Yakin mau hapus user " + username + " ?")) {
    localStorage.removeItem("user_" + username);
    alert("User berhasil dihapus! 🗑️");
    renderUserTable();
  }
}
