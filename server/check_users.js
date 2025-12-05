const db = require('./src/database');

console.log('Checking users in the database...\n');

db.all("SELECT id, username, role, full_name FROM users", (err, users) => {
  if (err) {
    console.error("ERROR:", err.message);
    db.close();
    return;
  }

  if (users.length === 0) {
    console.log("⚠️  NO USERS FOUND IN DATABASE!");
    console.log("The application requires users to be created first.");
    console.log("\nYou need to:");
    console.log("1. Create an admin account through the registration page");
    console.log("2. Or manually insert a user into the database\n");
  } else {
    console.log(`✓ Found ${users.length} user(s):\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. Username: ${user.username}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Full Name: ${user.full_name || 'N/A'}`);
      console.log('');
    });
  }

  db.close();
});
