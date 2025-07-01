import os
import subprocess
import time
import socket

# CONFIGURA TUS VARIABLES
IP_BROKER = "192.168.74.10"
KAFKA_DIR = "/home/jcm/kafka"
CONFIG_PATH = f"{KAFKA_DIR}/config/kraft-server.properties"
KAFKA_START_SCRIPT = f"{KAFKA_DIR}/kafka-start.sh"
KAFKA_STOP_SCRIPT = f"{KAFKA_DIR}/kafka-stop.sh"
TOPIC_NAME = "sensor-detector"

# FUNCIONES EXTRA
def esperar_kafka(ip, puerto, intentos=10):
    for intento in range(intentos):
        try:
            with socket.create_connection((ip, puerto), timeout=2):
                print(f"✅ Kafka está escuchando en {ip}:{puerto}")
                return True
        except Exception:
            print(f"⌛ Esperando a Kafka en {ip}:{puerto}... ({intento + 1}/{intentos})")
            time.sleep(2)
    return False

# 1. BORRAR METADATOS ANTERIORES
print("🧹 Limpiando metadatos...")
os.system("rm -rf /tmp/kraft-meta")
os.system("rm -rf /tmp/kraft-combined-logs")

# 2. COMPROBAR CONFIGURACIÓN
if not os.path.exists(CONFIG_PATH):
    print("⚙️  kraft-server.properties no existe. Creándolo...")
    with open(CONFIG_PATH, "w") as f:
        f.write(f"""# Archivo generado por script
process.roles=broker,controller
node.id=1
listeners=PLAINTEXT://{IP_BROKER}:9092,CONTROLLER://{IP_BROKER}:9093
advertised.listeners=PLAINTEXT://{IP_BROKER}:9092
listener.security.protocol.map=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
inter.broker.listener.name=PLAINTEXT
controller.listener.names=CONTROLLER
controller.quorum.voters=1@{IP_BROKER}:9093
log.dirs=/tmp/kraft-combined-logs
metadata.log.dir=/tmp/kraft-meta
num.partitions=1
auto.create.topics.enable=true
log.retention.hours=168
log.segment.bytes=1073741824
log.retention.check.interval.ms=300000
""")
else:
    print("✅ Archivo kraft-server.properties ya existe.")

# 3. FORMATEO DEL STORAGE
print("🧱 Formateando almacenamiento...")
uuid_command = f"{KAFKA_DIR}/bin/kafka-storage.sh random-uuid"
uuid = subprocess.check_output(uuid_command.split()).decode().strip()
format_command = f"{KAFKA_DIR}/bin/kafka-storage.sh format -t {uuid} -c {CONFIG_PATH}"
os.system(format_command)

# 4. INICIO DEL SERVICIO
print("🚀 Iniciando Kafka...")
service_status = os.system("systemctl is-enabled kafka.service > /dev/null 2>&1")
if service_status == 0:
    os.system("sudo systemctl restart kafka.service")
    print("✅ Kafka iniciado mediante systemd.")
else:
    print("⚠️ No se encontró el servicio kafka. Usando script manual...")
    os.system(f"{KAFKA_STOP_SCRIPT}")
    os.system(f"{KAFKA_START_SCRIPT}")

# 5. ESPERA ACTIVA A KAFKA
print("🕒 Esperando a que Kafka esté completamente operativo...")
if esperar_kafka(IP_BROKER, 9092):
    print("📦 Creando tópico si no existe...")
    create_topic_command = f"{KAFKA_DIR}/bin/kafka-topics.sh --create --if-not-exists --topic {TOPIC_NAME} --bootstrap-server {IP_BROKER}:9092 --partitions 1 --replication-factor 1"
    os.system(create_topic_command)
    print("✅ Tópico creado.")
else:
    print("❌ Kafka no respondió. Abortando creación de tópico.")
    exit(1)

# 6. ABRIR CONSUMIDOR Y PRODUCTOR EN TERMINALES SEPARADOS
CONSUMER_CMD = f"{KAFKA_DIR}/bin/kafka-console-consumer.sh --bootstrap-server {IP_BROKER}:9092 --partition 0 --topic {TOPIC_NAME} --from-beginning"
PRODUCER_CMD = f"{KAFKA_DIR}/bin/kafka-console-producer.sh --bootstrap-server {IP_BROKER}:9092 --topic {TOPIC_NAME}"

print("🎯 Detectando entorno para lanzar consumidor y productor...")
time.sleep(3)

if os.environ.get("DISPLAY"):
    print("🪟 Entorno gráfico detectado. Abriendo terminales con gnome-terminal.")
    subprocess.Popen(['gnome-terminal', '--', 'bash', '-c', f"{CONSUMER_CMD}; exec bash"])
    subprocess.Popen(['gnome-terminal', '--', 'bash', '-c', f"{PRODUCER_CMD}; exec bash"])
else:
    print("📟 No hay entorno gráfico. Iniciando sesión tmux con consumidor y productor...")
    os.system("tmux kill-session -t kafka_demo 2>/dev/null")
    os.system(f"tmux new-session -d -s kafka_demo '{CONSUMER_CMD}'")
    os.system(f"tmux split-window -h -t kafka_demo '{PRODUCER_CMD}'")
    os.system("tmux attach-session -t kafka_demo")


# 7. INICIO DEL REST PROXY DE CONFLUENT
print("🔄 Iniciando REST Proxy de Confluent...")

CONFLUENT_DIR = "/opt/confluent"
REST_PROPERTIES = f"{CONFLUENT_DIR}/etc/kafka-rest/kafka-rest.properties"
REST_START_CMD = f"{CONFLUENT_DIR}/bin/kafka-rest-start {REST_PROPERTIES}"

subprocess.Popen(REST_START_CMD.split())
time.sleep(5)  # Espera unos segundos para que arranque

# 8. COMPROBACIÓN CON CURL
print("🌐 Comprobando REST Proxy con curl...")
try:
    response = subprocess.check_output(["curl", "http://192.168.74.10:8082/topics"], stderr=subprocess.DEVNULL)
    print(f"📋 Tópicos disponibles en REST Proxy: {response.decode()}")
except subprocess.CalledProcessError:
    print("❌ No se pudo conectar al REST Proxy en http://localhost:8082")
