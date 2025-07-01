// /js/usuarios.js

document.addEventListener("DOMContentLoaded", function () {
    cargarUsuarios();

    // Activar enlace actual en la barra lateral
    const currentPath = window.location.pathname.replace(/\/$/, "");
    document.querySelectorAll("nav li a").forEach((link) => {
        const linkPath = new URL(link.href).pathname.replace(/\/$/, "");
        if (linkPath === currentPath) {
            link.classList.add("active");
        }
    });

    // Buscador
    document.getElementById('busqueda').addEventListener('input', function () {
        const filtro = this.value.toLowerCase();
        const filas = document.querySelectorAll('#tablaUsuarios tr');

        filas.forEach(fila => {
            const texto = fila.innerText.toLowerCase();
            fila.style.display = texto.includes(filtro) ? '' : 'none';
        });
    });

    // Agregar usuario
    document.getElementById('formAgregarUsuario').addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch('/api/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email, password })
            });

            const data = await res.text();
            document.getElementById('mensaje').innerText = data;
            cargarUsuarios(); // Recargar tabla
        } catch (err) {
            console.error("❌ Error al agregar usuario:", err);
        }
    });
});

async function cargarUsuarios() {
    const res = await fetch('/api/usuarios');
    const usuarios = await res.json();
    const tabla = document.getElementById('tablaUsuarios');
    tabla.innerHTML = '';

    usuarios.forEach(usuario => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${usuario.nombre}</td>
            <td>${usuario.email}</td>
            <td>
              <button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${usuario.ID})">🗑️ Borrar</button>
            </td>
        `;
        tabla.appendChild(fila);
    });
}

async function eliminarUsuario(id) {
    if (confirm("¿Estás seguro de eliminar este usuario?")) {
        await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
        cargarUsuarios();
    }
}
