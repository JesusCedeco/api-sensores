#Ejecutar: spark-submit --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.5 sensor.py

#Importación sesión y función
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, split, from_json
from pyspark.sql.types import StructType, StringType, IntegerType, DoubleType, LongType
import socketio
from dotenv import load_dotenv
import os


load_dotenv()
 
PORT_Sio = os.getenv('PORT_Sio')
#Conexión a socketio (se conecta al node.js (dashboard))
sio = socketio.Client()
sio.connect(PORT_Sio)




#Creación sesión
spark = SparkSession.builder\
    .appName("camara")\
    .getOrCreate()

PORT_Kafka = os.getenv('PORT_Kafka')
#Extracción de datos
df_camera = spark.readStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", PORT_Kafka) \
        .option("subscribe", "sensor-detector") \
        .option("startingOffsets", "latest") \
        .load()

#Estructuración de datos
schema =StructType()\
    .add("evento", StringType())\
    .add("timestamp", LongType())\
    .add("nivel", DoubleType())

#Selección del formatro de archivos a json
events = df_camera.selectExpr("CAST(value AS STRING) as json") \
    .select(from_json(col("json"), schema).alias("data")) \
    .select("data.*")

#Definición de la función send
def send(df_camera, _):
    for fila in df_camera.collect():
        sio.emit("evento", fila.asDict())

#Ejecutar el stream
events.writeStream \
    .foreachBatch(send) \
    .start() \
    .awaitTermination()

#Ejecutar:
#spark-submit --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.5 sensor.py