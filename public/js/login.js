
function cancelar() {
    window.location.href = "./";
}

document.addEventListener("DOMContentLoaded", function () {
    const currentPath = window.location.pathname.replace(/\/$/, ""); // quita el slash final si existe
    document.querySelectorAll("nav li a").forEach((link) => {
        const linkPath = new URL(link.href).pathname.replace(/\/$/, "");
        if (linkPath === currentPath) {
            link.classList.add("active");
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "1") {
      const mensaje = document.getElementById("mensaje-error");
      if (mensaje) mensaje.style.display = "block";
    }
  });