const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { connectDB, closeDB } = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received, shutting down`);
      server.close(async () => {
        await closeDB();
        process.exit(0);
      });
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    await closeDB();
    process.exit(1);
  }
};

startServer();
