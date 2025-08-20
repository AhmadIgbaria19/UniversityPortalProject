// hash.js
const bcrypt = require("bcrypt");

async function hashPassword() {
  const plainPassword = "oren123"; // ✅ הסיסמה שלך
  const saltRounds = 10;
  const hash = await bcrypt.hash(plainPassword, saltRounds);
  console.log("Hashed Password:", hash);
}

hashPassword();
