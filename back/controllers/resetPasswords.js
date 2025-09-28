const db = require("../config/db");
const bcrypt = require("bcryptjs");

async function resetAllPasswords() {
  try {
    const newPassword = "user1234";
    const hashed = bcrypt.hashSync(newPassword, 10);

    const sql = "UPDATE users SET password = ?";
    await db.promise().query(sql, [hashed]);

    console.log("✅ All user passwords updated to 'user1234'");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error resetting passwords:", err);
    process.exit(1);
  }
}

resetAllPasswords();
