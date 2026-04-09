const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const bcrypt = require('bcryptjs');

const User = require('./src/models/User');

const authRoutes = require('./src/routes/authRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const taskRoutes = require('./src/routes/taskRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const seedDefaultUsers = async () => {
  const defaultUsers = [
    { username: 'teacher1', password: 'teacher123', role: 'teacher' },
    { username: 'student1', password: 'student123', role: 'student' },
    { username: 'student2', password: 'student123', role: 'student' },
  ];

  for (const user of defaultUsers) {
    const existingUser = await User.findOne({ username: user.username });
    if (!existingUser) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      await User.create({
        username: user.username,
        passwordHash,
        role: user.role,
      });
      console.log(`Seeded ${user.role} user: ${user.username}`);
    }
  }
};

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  }),
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/tasks', taskRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const startServer = async () => {
  await connectDB();
  await seedDefaultUsers();

  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error(`Server startup failed: ${error.message}`);
  process.exit(1);
});
