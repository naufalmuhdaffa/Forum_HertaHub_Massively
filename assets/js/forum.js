if (localStorage.getItem("isLoggedIn") !== "true") {
  alert("Silakan login terlebih dahulu untuk mengakses halaman ini.");
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

function getThreads() {
  try {
    const raw = localStorage.getItem("forumThreads");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("⚠️ Data forumThreads korup! Reset ke [].", e);
    safeSetItem("forumThreads", JSON.stringify([]));
    return [];
  }
}


function showError(message) {
  const t = document.getElementById("toast");
  t.textContent = "⚠️ " + message;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

const form = document.getElementById("threadForm");
const threadList = document.getElementById("threadList");
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const titleInput = document.getElementById("title");
const titleCount = document.getElementById("titleCount");
const MAX = 100;

titleInput.addEventListener("input", () => {
  const used = titleInput.value.length;
  titleCount.textContent = `${MAX - used} karakter tersisa`;
});

document.getElementById("searchForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const keyword = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();
  filterThreads(keyword);
});

function filterThreads(keyword) {
  const allThreads = getThreads();
  const filtered = allThreads.filter(
    (thread) =>
      thread.title.toLowerCase().includes(keyword) ||
      thread.content.toLowerCase().includes(keyword)
  );

  displayThreads(filtered);
}

function loadThreads() {
  const threads = getThreads();
  displayThreads(threads);
}

function getUserData(username) {
  const data = localStorage.getItem("user_" + username);
  return data ? JSON.parse(data) : null;
}

function displayThreads(threads) {
  threadList.innerHTML = "";

  if (threads.length === 0) {
    threadList.innerHTML = "<p>Thread tidak ditemukan</p>";
    return;
  }

  threads.forEach((thread, index) => {
    const post = document.createElement("article");
    post.classList.add("forum-thread");
    const userData = getUserData(thread.author) || {};
    const avatarUrl =
      userData.profile?.avatar || "../../images/Default_Avatar.jpg";
    const borderName = userData.profile?.border;

    let replyHTML = "";
    let borderUrl = "../../images/borders/Default_Border.png";
    if (borderName) {
      const custom = JSON.parse(localStorage.getItem("customBorders") || "[]");
      const found = custom.find((c) => c.name === borderName);
      borderUrl = found ? found.url : `../../images/borders/${borderName}`;
    }
    if (thread.replies && thread.replies.length > 0) {
      replyHTML = `<div class="replies"><h4>Balasan:</h4><ul>`;
      thread.replies.forEach((reply, rIndex) => {
        const isReplyOwner = reply.author === localStorage.getItem("username");
        const isAdmin = localStorage.getItem("userRole") === "admin";
        const showDelete = isAdmin || isReplyOwner;

        replyHTML += `
  <li style="border-left: 4px solid ${
    reply.role === "admin" ? "red" : "#666"
  }; padding-left: 0.5em;">
    <strong>${reply.author}</strong>: ${reply.text}
    <br/>
    <small style="font-style: italic; color: ${
      reply.role === "admin" ? "red" : "#555"
    };">
      (${reply.role || "user"})
    </small>
    ${
      showDelete
        ? `
      <button class="delete-reply" data-thread-index="${index}" data-reply-index="${rIndex}" style="margin-left: 10px;">Hapus</button>
    `
        : ""
    }
    ${
      isReplyOwner || isAdmin
        ? `
      <button class="edit-reply" data-thread-index="${index}" data-reply-index="${rIndex}" style="margin-left: 10px;">Edit</button>
    `
        : ""
    }
  </li>
`;
      });
      replyHTML += `</ul></div>`;
    }

    post.innerHTML = `
    <div class="thread-actions">
    ${
      localStorage.getItem("username") === thread.author ||
      localStorage.getItem("userRole") === "admin"
        ? `<button class="edit-btn" data-index="${index}">Edit</button>`
        : ""
    }
  </div>

  <div class="thread-author">
    <div class="avatar-thumb">
      <img src="${avatarUrl}" class="avatar-img" alt="Avatar ${
      thread.author
    }" />
      <img src="${borderUrl}" class="avatar-border" alt="Border ${
      borderName || "Default"
    }" />
    </div>
    <div class="author-info">
      <strong>${thread.author}</strong> <span class="role" style="color:${
      thread.role === "admin" ? "red" : "#333"
    }">(${thread.role})</span>
    </div>
  </div>

    <header>
                <h3>${thread.title}</h3>
            </header>
            <pre>${thread.content}</pre>
${new Date(thread.timestamp).toLocaleString()}
    </small>

    ${
      thread.media
        ? (() => {
            const type = thread.media.split(";")[0];
            if (type.startsWith("data:image/")) {
              return `<div class="thread-media"><img src="${thread.media}" alt="Media" style="max-width:100%; border-radius:10px; margin-top:1em;" /></div>`;
            } else if (type.startsWith("data:audio/")) {
              return `<div class="thread-media"><audio controls style="margin-top:1em; width:100%;"><source src="${thread.media}"></audio></div>`;
            } else if (type.startsWith("data:video/")) {
              return `<div class="thread-media"><video controls style="margin-top:1em; max-width:100%; border-radius:10px;"><source src="${thread.media}"></video></div>`;
            } else {
              return `<div class="thread-media"><a href="${thread.media}" download="file" class="button small" style="margin-top:1em;">Download File</a></div>`;
            }
          })()
        : ""
    }

    ${replyHTML}
    <form class="reply-form" data-index="${index}">
        <input type="text" placeholder="Tulis balasan..." required />
        <button type="submit" class="button small">Reply</button>
        ${
          thread.author === localStorage.getItem("username") ||
          localStorage.getItem("userRole") === "admin"
            ? `<button type="button" class="button small alt delete-btn" data-index="${index}">Hapus</button>`
            : ""
        }

    </form>`;

    threadList.prepend(post);
  });

  document.querySelectorAll(".reply-form").forEach((form) => {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const index = this.getAttribute("data-index");
      const input = this.querySelector("input");
      const replyText = input.value.trim();

      const threads = getThreads();
      if (replyText) {
        threads[index].replies = threads[index].replies || [];
        threads[index].replies.push({
          text: replyText,
          author: localStorage.getItem("username"),
          role: localStorage.getItem("userRole"),
        });
        safeSetItem("forumThreads", JSON.stringify(threads));
        loadThreads();
      }
    });
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const index = this.getAttribute("data-index");
      if (confirm("Yakin mau hapus thread ini?")) {
        const threads = getThreads();
        threads.splice(index, 1);
        safeSetItem("forumThreads", JSON.stringify(threads));
        loadThreads();
      }
    });
  });

  document.querySelectorAll(".delete-reply").forEach((btn) => {
    btn.addEventListener("click", function () {
      const threadIndex = this.dataset["threadIndex"];
      const replyIndex = this.dataset["replyIndex"];
      const li = this.closest("li");

      li.classList.add("fade-out");

      setTimeout(() => {
        const threads = getThreads();
        threads[threadIndex].replies.splice(replyIndex, 1);
        safeSetItem("forumThreads", JSON.stringify(threads));
        loadThreads();
      }, 300);
    });
  });

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const index = this.getAttribute("data-index");
      const threads = getThreads();
      const thread = threads[index];

      const newTitle = prompt("Edit judul thread:", thread.title);
      const newContent = prompt("Edit konten thread:", thread.content);

      if (newTitle !== null && newContent !== null) {
        thread.title = newTitle.trim();
        thread.content = newContent.trim();
        threads[index] = thread;
        safeSetItem("forumThreads", JSON.stringify(threads));
        loadThreads();
      }
    });
  });

  document.querySelectorAll(".edit-reply").forEach((btn) => {
    btn.addEventListener("click", function () {
      const threadIndex = this.getAttribute("data-thread-index");
      const replyIndex = this.getAttribute("data-reply-index");

      const threads = getThreads();
      const reply = threads[threadIndex].replies[replyIndex];

      const newText = prompt("Edit balasan:", reply.text);
      if (newText !== null) {
        reply.text = newText.trim();
        threads[threadIndex].replies[replyIndex] = reply;
        safeSetItem("forumThreads", JSON.stringify(threads));
        loadThreads();
      }
    });
  });
}

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  const mediaInput = document.getElementById("media");
  const file = mediaInput.files[0];

  if (!title || !content) return;

  if (file) {
    if (file.size > MAX_FILE_SIZE) {
      alert(`Ukuran file terlalu besar! Maksimal ${MAX_FILE_SIZE_MB}MB ya`);
      return;
    }

    const reader = new FileReader();
    reader.onload = function () {
      const mediaData = reader.result;
      saveThread(title, content, mediaData);
    };
    reader.readAsDataURL(file);
  } else {
    saveThread(title, content, null);
  }
});

const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("media");
const fileInfo = document.getElementById("fileInfo");
const mediaPreview = document.getElementById("mediaPreview");

function showFileInfo(file) {
  mediaPreview.innerHTML = "";
  if (!file) {
    fileInfo.textContent = "";
    return;
  }

  const sizeMB = (file.size / 1024 / 1024).toFixed(2);
  if (file.size > MAX_FILE_SIZE) {
    fileInfo.innerHTML = `❌ File terlalu besar (${sizeMB} MB). Maksimal ${MAX_FILE_SIZE_MB}MB ya 😤`;
    fileInput.value = "";
    return;
  }

  fileInfo.textContent = `✅ ${file.name} (${sizeMB} MB)`;

  const reader = new FileReader();
  reader.onload = function (e) {
    const src = e.target.result;
    const type = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("audio/")
      ? "audio"
      : file.type.startsWith("video/")
      ? "video"
      : "other";

    let previewEl;
    switch (type) {
      case "image":
        previewEl = document.createElement("img");
        previewEl.src = src;
        previewEl.style.maxWidth = "100%";
        previewEl.style.borderRadius = "10px";
        break;
      case "audio":
        previewEl = document.createElement("audio");
        previewEl.controls = true;
        previewEl.style.width = "100%";
        previewEl.innerHTML = `<source src="${src}">Your browser does not support audio.`;
        break;
      case "video":
        previewEl = document.createElement("video");
        previewEl.controls = true;
        previewEl.style.maxWidth = "100%";
        previewEl.style.borderRadius = "10px";
        previewEl.innerHTML = `<source src="${src}">Your browser does not support video.`;
        break;
      default:
        previewEl = document.createElement("a");
        previewEl.href = src;
        previewEl.download = file.name;
        previewEl.textContent = `Download ${file.name}`;
        previewEl.classList.add("button", "small");
        break;
    }
    mediaPreview.appendChild(previewEl);
  };
  reader.readAsDataURL(file);
}

dropArea.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  showFileInfo(file);
});

dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropArea.classList.add("dragover");
});

dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("dragover");
});

dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  dropArea.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file) {
    fileInput.files = e.dataTransfer.files;
    showFileInfo(file);
  }
});


function saveThread(title, content, mediaData) {
  try {
    const threads = getThreads();
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("userRole");

    const thread = {
      title,
      content,
      timestamp: new Date().toISOString(),
      media: mediaData || null,
      replies: [],
      author: username,
      role: role,
    };

    threads.push(thread);
    const ok = safeSetItem("forumThreads", JSON.stringify(threads));
    if (!ok) return;
    loadThreads();
    form.reset();
    fileInfo.textContent = "";
    mediaPreview.innerHTML = "";
    titleCount.textContent = `${MAX} karakter tersisa`;
  } catch (e) {
    console.error("Gagal menyimpan thread dengan media", e);
    alert("Gagal menyimpan thread: " + e.message);
  }
}

loadThreads();

function applyReadMore(limit = 200) {
  document.querySelectorAll("article.forum-thread pre").forEach((p) => {
    const fullText = p.textContent.trim();
    if (fullText.length <= limit) return;

    const visibleText = fullText.slice(0, limit);
    const hiddenText = fullText.slice(limit);

    p.innerHTML = "";

    const spanVisible = document.createElement("span");
    spanVisible.textContent = visibleText;

    const spanHidden = document.createElement("span");
    spanHidden.className = "read-more-content";
    spanHidden.textContent = hiddenText;

    const toggleLink = document.createElement("span");
    toggleLink.className = "read-more-toggle";
    toggleLink.textContent = "lihat selengkapnya";
    toggleLink.addEventListener("click", () => {
      const isHidden =
        spanHidden.style.display === "none" || !spanHidden.style.display;
      spanHidden.style.display = isHidden ? "inline" : "none";
      toggleLink.textContent = isHidden
        ? "Sembunyikan"
        : "...Lihat Selengkapnya";
    });

    p.appendChild(spanVisible);
    p.appendChild(spanHidden);
    p.appendChild(toggleLink);
  });
}

function loadThreads() {
  const threads = getThreads();
  displayThreads(threads);
  applyReadMore(200);
}

function logout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userRole");
  localStorage.removeItem("username");

  window.location.href = "login.html";
}

window.onload = function () {
  const authLink = document.getElementById("authLink");
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  if (isLoggedIn) {
    authLink.textContent = "Logout";
    authLink.href = "#";
    authLink.onclick = function (e) {
      e.preventDefault();
      logout();
    };
  } else {
    authLink.textContent = "Login";
    authLink.href = "login.html";
    authLink.onclick = null;
  }
};
