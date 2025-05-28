function goToProfile() {
  if (localStorage.getItem("isLoggedIn") === "true") {
    window.location.href = "pages/profile.html";
  } else {
    alert("Harus login terlebih dahulu untuk mengakses halaman ini.");
    window.location.href = "pages/login.html";
  }
}

function goToForum() {
  if (localStorage.getItem("isLoggedIn") === "true") {
    window.location.href = "pages/forum.html";
  } else {
    alert("Harus login terlebih dahulu untuk mengakses halaman ini.");
    window.location.href = "pages/login.html";
  }
}

function logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");

    window.location.href = "pages/login.html";
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
      authLink.href = "pages/login.html";
      authLink.onclick = null;
    }
  };