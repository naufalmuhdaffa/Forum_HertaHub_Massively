let mode = "login";
let bypassValidation = false;

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

function toggleMode() {
  if (mode === "login") {
    switchToRegister();
  } else {
    switchToLogin();
  }
}

function switchToRegister() {
  mode = "register";
  document.getElementById("formTitle").textContent = "Register";
  document.getElementById("submitBtn").textContent = "Daftar";
  document.getElementById("toggleBtn").textContent = "Sudah punya akun? Login";

  document.getElementById("confirmDiv").classList.remove("hidden");
  document.getElementById("confirmPassword").required = true;

  document.getElementById("captchaDiv").classList.remove("hidden");
  document.getElementById("captchaInput").required = true;
  document.getElementById("loginLaterBtn").classList.add("hidden");

  generateCaptcha();
}

function switchToLogin() {
  mode = "login";
  document.getElementById("formTitle").textContent = "Login";
  document.getElementById("submitBtn").textContent = "Login";
  document.getElementById("toggleBtn").textContent =
    "Belum punya akun? Register";

  document.getElementById("confirmDiv").classList.add("hidden");
  document.getElementById("confirmPassword").required = false;

  document.getElementById("captchaDiv").classList.remove("hidden");
  document.getElementById("captchaInput").required = true;
  document.getElementById("loginLaterBtn").classList.remove("hidden");

  generateCaptcha();
}

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

document
  .getElementById("authForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    if (bypassValidation) return;

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (mode === "login") {
      const captchaInput = document.getElementById("captchaInput").value;

      if (parseInt(captchaInput) !== captchaAnswer) {
        alert("CAPTCHA salah!");
        generateCaptcha();
        return;
      }

      const userData = localStorage.getItem("user_" + username);
      if (!userData) {
        alert("User tidak ditemukan!");
        return;
      }

      const { salt, hash, role } = JSON.parse(userData);
      const attemptedHash = await hashSHA256(password + salt);

      safeSetItem("userRole", role);

      if (attemptedHash === hash) {
        safeSetItem("isLoggedIn", "true");
        safeSetItem("userRole", role);
        safeSetItem("username", username);

        const profile = JSON.parse(userData).profile || {};
        safeSetItem("profileAvatar", profile.avatar || "");
        safeSetItem("profileBg", profile.bg || "");
        safeSetItem("profileBorder", profile.border || "");

        safeSetItem("loginTime", new Date().toISOString());

        const form = document.querySelector(".form-container");
        const portal = document.getElementById("portalTransition");

        form.classList.add("form-break");

        setTimeout(() => {
          portal.classList.remove("hidden");
          portal.classList.add("show");
        }, 2000);

        setTimeout(() => {
          window.location.href = "/index.html";
        }, 3000);
      } else {
        alert("Password salah!");
        generateCaptcha();
      }
    }
    if (mode === "register") {
      const confirmPassword = document.getElementById("confirmPassword").value;
      const captchaInput = document.getElementById("captchaInput").value;

      if (password !== confirmPassword) {
        alert("Password dan konfirmasi tidak sama! Hmph!");
        return;
      }

      if (parseInt(captchaInput) !== captchaAnswer) {
        alert("Jawaban CAPTCHA-nya salah yaa~ Coba lagi dong!");
        generateCaptcha();
        return;
      }

      if (localStorage.getItem("user_" + username)) {
        alert("Username sudah dipakai. Cari yang lain dong~");
        return;
      }

      const salt = generateSalt();
      const hashedPassword = await hashSHA256(password + salt);

      const userObj = {
        salt: salt,
        hash: hashedPassword,
        role: "user",
        profile: {
          avatar: "",
          bg: "",
          border: "",
        },
      };

      safeSetItem("user_" + username, JSON.stringify(userObj));

      alert("Registrasi berhasil! Silakan login sekarang~");
      safeSetItem("username", username);
      switchToLogin();
    }
  });

function loginLater() {
  document.getElementById("authForm").noValidate = true;
  bypassValidation = true;

  safeSetItem("isLoggedIn", "later");

  const form = document.querySelector(".form-container");
  const portal = document.getElementById("portalTransition");

  form.classList.add("form-break");

  setTimeout(() => {
    portal.classList.remove("hidden");
    portal.classList.add("show");
  }, 2000);

  setTimeout(() => {
    window.location.href = "/index.html";
  }, 3000);
}
let captchaAnswer = null;

function generateCaptcha() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  captchaAnswer = a + b;
  document.getElementById(
    "captchaLabel"
  ).textContent = `Berapa hasil dari ${a} + ${b} ?`;
}

document.querySelector(".form-container").classList.add("fade-slide");
setTimeout(() => {
  document.querySelector(".form-container").classList.remove("fade-slide");
}, 400);

generateCaptcha();

function updateUserProfile(username, profileData) {
  const userKey = "user_" + username;
  const userData = localStorage.getItem(userKey);
  if (!userData) return;

  const userObj = JSON.parse(userData);
  userObj.profile = {
    ...userObj.profile,
    ...profileData,
  };

  safeSetItem(userKey, JSON.stringify(userObj));
}
