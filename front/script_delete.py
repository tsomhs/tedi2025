import mysql.connector

# DB connection
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='9004',
    database='auction_db'
)
cursor = conn.cursor()

# Delete all items
# If you have foreign keys with ON DELETE CASCADE for bids, they will be removed automatically
cursor.execute("DELETE FROM items")
conn.commit()

cursor.close()
conn.close()

print("All items deleted successfully. Categories are preserved.")
