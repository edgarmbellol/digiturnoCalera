import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de la base de datos
SQL_SERVER_APLICACION = os.getenv('SQL_SERVER_APLICACION')
SQL_DATABASE_APLICACION = os.getenv('SQL_DATABASE_APLICACION')
SQL_USERNAME_APLICACION = os.getenv('SQL_USERNAME_APLICACION')
SQL_PASSWORD_APLICACION = os.getenv('SQL_PASSWORD_APLICACION')
