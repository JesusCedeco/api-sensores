fetch("/api/eventos")
    .then(res => res.json())
    .then(data => {
        const tabla = document.getElementById("tabla-eventos");
        data.forEach(evento => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                    <td>${new Date(evento.timestamp).toLocaleString()}</td>
                    <td>${evento.eventos}</td>
                    <td>${evento.nivel}</td>
                  `;
            tabla.appendChild(fila);
        });
    })
    .catch(err => console.error("Error cargando eventos:", err));
