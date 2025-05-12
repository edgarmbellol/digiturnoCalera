import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()
 
# Configuración de la base de datos
SQL_SERVER = os.getenv('SQL_SERVER')
SQL_DATABASE = os.getenv('SQL_DATABASE')
SQL_USERNAME = os.getenv('SQL_USERNAME')
SQL_PASSWORD = os.getenv('SQL_PASSWORD')