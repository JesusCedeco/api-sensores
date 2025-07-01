window.addEventListener("DOMContentLoaded", () => {
    const ctx = document.getElementById('graficoNivelMovimiento').getContext('2d');

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Nivel de Movimiento',
                data: [],
                borderWidth: 2,
                fill: false,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: { display: true, text: 'Hora' }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Nivel' }
                }
            }
        }
    });

    const socket = io("http://192.168.74.10:5008");

    socket.on("connect", () => {
        console.log("✅ Conectado al servidor WebSocket");
    });

    socket.on("evento", (data) => {
        console.log("📡 Evento recibido:", data);
        socket.emit("evento", data); // opcional, según lo necesite tu backend

        const tiempo = new Date(data.timestamp).toLocaleTimeString();
        const nivel = data.nivel;

        chart.data.labels.push(tiempo);
        chart.data.datasets[0].data.push(nivel);

        if (chart.data.labels.length > 20) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }

        chart.update();

        const celda = document.getElementById("celda-movimiento");
        if (celda) {
            celda.innerText = `Movimiento: ${data.evento} 🕒 ${tiempo}`;
        }
    });

    socket.on("disconnect", () => {
        console.warn("❌ Desconectado del servidor");
    });
});


document.addEventListener("DOMContentLoaded", function () {
    const currentPath = window.location.pathname.replace(/\/$/, ""); // quita el slash final si existe
    document.querySelectorAll("nav li a").forEach((link) => {
        const linkPath = new URL(link.href).pathname.replace(/\/$/, "");
        if (linkPath === currentPath) {
            link.classList.add("active");
        }
    });
});
