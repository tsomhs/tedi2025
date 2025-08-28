import xml.etree.ElementTree as ET
import mysql.connector
import os
from datetime import datetime

# --- DB connection ---
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='9004',
    database='auction_db'
)
cursor = conn.cursor(buffered=True)

folder_path = "C:/Users/georg/OneDrive/Downloads/ebay.data/ebay-data"

for filename in os.listdir(folder_path):
    if not filename.endswith('.xml'):
        continue

    filepath = os.path.join(folder_path, filename)
    print(f"Processing {filename}...")
    tree = ET.parse(filepath)
    root = tree.getroot()

    for item in root.findall("Item"):
        item_id_xml = item.get("ItemID")
        db_item_id = None

        # --- Try match by ID ---
        if item_id_xml:
            cursor.execute("SELECT id FROM items WHERE id=%s", (item_id_xml,))
            row = cursor.fetchone()
            if row:
                db_item_id = row[0]

        # --- Fallback: match by name + started ---
        if not db_item_id:
            name_el = item.find("Name")
            started_el = item.find("Started")
            if name_el is not None and name_el.text and started_el is not None and started_el.text:
                name = name_el.text.strip()
                started_text = started_el.text.strip()
                try:
                    started_dt = datetime.strptime(started_text, "%b-%d-%y %H:%M:%S")
                except:
                    started_dt = None
                if started_dt:
                    cursor.execute(
                        "SELECT id FROM items WHERE name=%s AND started=%s",
                        (name, started_dt)
                    )
                    row = cursor.fetchone()
                    if row:
                        db_item_id = row[0]

        if not db_item_id:
            print(f"Skipping item '{item_id_xml}' (not found in DB).")
            continue

        # --- Update seller_username ---
        seller_el = item.find("Seller")
        if seller_el is not None and "UserID" in seller_el.attrib:
            seller_username = seller_el.attrib["UserID"]
            cursor.execute(
                "UPDATE items SET seller_username=%s WHERE id=%s",
                (seller_username, db_item_id)
            )

        # --- Clear old bids ---
        cursor.execute("DELETE FROM bids WHERE item_id=%s", (db_item_id,))

        # --- Insert bids ---
        bids_el = item.find("Bids")
        if bids_el is not None:
            for bid in bids_el.findall("Bid"):
                bidder_el = bid.find("Bidder")
                if bidder_el is None or "UserID" not in bidder_el.attrib:
                    continue
                bidder_username = bidder_el.attrib["UserID"]

                # Optional: find bidder_id from users table
                cursor.execute(
                    "SELECT id FROM users WHERE username=%s",
                    (bidder_username,)
                )
                row = cursor.fetchone()
                bidder_id = row[0] if row else None


                # Bid time
                time_el = bid.find("Time")
                if time_el is None or not time_el.text:
                    continue
                time_str = time_el.text.strip()
                try:
                    bid_time = datetime.strptime(time_str, "%b-%d-%y %H:%M:%S")
                except:
                    bid_time = None

                # Amount
                amount_el = bid.find("Amount")
                if amount_el is None or not amount_el.text:
                    continue
                amount_text = amount_el.text.strip().replace("$", "").replace(",", "")
                try:
                    amount = float(amount_text)
                except:
                    continue

                # Insert bid
                cursor.execute(
                    "INSERT INTO bids (item_id, bidder_id, bidder_username, time, amount) VALUES (%s, %s, %s, %s, %s)",
                    (db_item_id, bidder_id, bidder_username, bid_time, amount)
                )
                print(f"Inserted bid ${amount} by {bidder_username} for item_id {db_item_id}")

# --- Commit & close ---
conn.commit()
cursor.close()
conn.close()
print("All items & bids updated successfully.")
