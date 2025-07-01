#!/bin/bash

# CONFIGURACIÓN la vemos con: which python  en el terminal le quitamos python a la que nos salga
VENV_PATH="/home/jcm/Desktop/sparkdb/sensores/venv/bin/activate"

cd "$(dirname "$0")"
tmux new-session -d -s sensores

# PANE 0 - Servidor Node.js
tmux send-keys -t sensores "echo '🌐 Iniciando servidor...'; source $VENV_PATH &&  npm run dev" C-m

# PANE 1 - Productor Kafka con entorno virtual
tmux split-window -v -t sensores
tmux send-keys -t sensores "echo '�� Iniciando productor...'; source $VENV_PATH && python3 producer.py" C-m

# PANE 2 - Sensor Spark (usando alias definido en .bashrc)
tmux split-window -h -t sensores
tmux send-keys -t sensores "echo '📡 Iniciando sensor Spark...'; source $VENV_PATH &&  spark-submit --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.5 sensor.py" C-m

# ORGANIZAR Y MOSTRAR MENSAJE
tmux select-layout tiled
tmux display-message "✅ Servidor, productor y sensor en marcha (Kafka se lanza aparte)"
tmux attach -t sensores
