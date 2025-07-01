#python3 producer.py
from kafka import KafkaProducer
import json
import requests
import time
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()

CAM_IP = os.getenv("CAM_IP")
CAM_PORT = os.getenv("CAM_PORT")
SENSORS_URL = f"http://{CAM_IP}:{CAM_PORT}/sensors.json"

KAFKA_SERVER = os.getenv("KAFKA_SERVER")
TOPIC = os.getenv("TOPIC")

# Crear productor Kafka que envía JSON
producer = KafkaProducer(
    bootstrap_servers=KAFKA_SERVER,
    value_serializer=lambda v: json.dumps(v).encode("utf-8")
)

print("📡 Monitor de cámara activo...")

while True:
    try:
        response = requests.get(SENSORS_URL, timeout=3)
        data = response.json()

        motion_event = data.get("motion_event", {}).get("data", [])
        motion_level = data.get("motion", {}).get("data", [])

        if motion_event and motion_event[0][1][0] == 1:
            nivel = motion_level[-1][1][0] if motion_level else 0

            evento = {
                "evento": "movimiento",
                "timestamp": int(time.time() * 1000),
                "nivel": nivel
            }

            producer.send(TOPIC, evento)
            print("📤 Evento enviado a Kafka:", evento)
        else:
            print("😴 Sin movimiento")

    except Exception as e:
        print("⚠️ Error leyendo sensores:", e)

    time.sleep(3) #Carga cada tres segundos
