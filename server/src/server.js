const app = require("./app");
const { initializeReportsTable } = require("./services/initializeDatabase");

const PORT = process.env.PORT || 5000;

// Initialize database tables
initializeReportsTable().catch((err) => {
  console.error("Failed to initialize database tables:", err);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
