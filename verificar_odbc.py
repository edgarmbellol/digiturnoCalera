"""
Script para verificar drivers ODBC disponibles en el sistema
"""
import pyodbc

print("=" * 60)
print("Verificando Drivers ODBC Disponibles")
print("=" * 60)
print()

drivers = [x for x in pyodbc.drivers()]

if not drivers:
    print("❌ No se encontraron drivers ODBC instalados")
    print()
    print("Por favor instale ODBC Driver para SQL Server:")
    print("https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server")
else:
    print(f"✅ Se encontraron {len(drivers)} driver(s) ODBC:")
    print()
    for i, driver in enumerate(drivers, 1):
        print(f"{i}. {driver}")
        if "SQL Server" in driver:
            print(f"   👉 Este driver sirve para conectarse a SQL Server")
    print()
    
    # Buscar el mejor driver para SQL Server
    sql_server_drivers = [d for d in drivers if "SQL Server" in d]
    
    if sql_server_drivers:
        print("=" * 60)
        print("Drivers recomendados para SQL Server:")
        print("=" * 60)
        for driver in sql_server_drivers:
            print(f"✅ {driver}")
        
        # Encontrar el más reciente
        if "ODBC Driver 18 for SQL Server" in sql_server_drivers:
            recommended = "ODBC Driver 18 for SQL Server"
        elif "ODBC Driver 17 for SQL Server" in sql_server_drivers:
            recommended = "ODBC Driver 17 for SQL Server"
        elif "ODBC Driver 13 for SQL Server" in sql_server_drivers:
            recommended = "ODBC Driver 13 for SQL Server"
        else:
            recommended = sql_server_drivers[0]
        
        print()
        print(f"👉 Driver recomendado a usar: {recommended}")
        print()
        print(f"Actualiza el archivo backend/config.py con:")
        print(f'SQL_DRIVER = "{recommended}"')
    else:
        print("⚠️  No se encontró ningún driver específico para SQL Server")
        print()
        print("Drivers genéricos encontrados (pueden funcionar):")
        for driver in drivers:
            print(f"  - {driver}")

print()
print("=" * 60)
print("Fin de verificación")
print("=" * 60)

