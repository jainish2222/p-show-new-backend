const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('redis');

// Initialize Prisma and Redis Clients
const prisma = new PrismaClient();

const redisClient = createClient({
  username: 'default',
  password: 'O3UX9CAPYevNNGUFN1qs2OJKETuqarD4',
  socket: {
    host: 'redis-19587.c267.us-east-1-4.ec2.redns.redis-cloud.com',
    port: 19587,
  },
});

// Redis error handling
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
    console.log('✅ Connected to Redis');
  } catch (err) {
    console.error('❌ Redis connection failed:', err);
  }
})();

const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 5000;

// ---------------- ROUTES ---------------- //

app.post('/submit-form', async (req, res, next) => {
  try {
    const {
      email, name, surname, college, branch,
      graduationStart, graduationEnd, projectName,
      projectDescription, githubLink, liveLink, img, agreeTerms
    } = req.body;

    if (!email || !projectName) {
      return res.status(400).json({ error: 'Email and Project Name are required' });
    }

    const formData = await prisma.formData.create({
      data: {
        email, name, surname, college, branch,
        graduationStart: graduationStart ? new Date(graduationStart) : null,
        graduationEnd: graduationEnd ? new Date(graduationEnd) : null,
        projectName, projectDescription, githubLink, liveLink, img, agreeTerms
      }
    });

    await redisClient.del('form_data');
    console.log('✅ Form data submitted, Redis cache cleared');
    res.status(201).json({ formData });
  } catch (err) {
    next(err);
  }
});

app.get('/fetch-form', async (req, res, next) => {
  try {
    const cachedData = await redisClient.get('form_data');
    if (cachedData) {
      console.log('✅ Serving data from Redis cache');
      return res.json(JSON.parse(cachedData));
    }

    const formData = await prisma.formData.findMany();
    await redisClient.setEx('form_data', 200, JSON.stringify(formData));
    console.log('✅ Fetched from DB and cached');
    res.json(formData);
  } catch (err) {
    next(err);
  }
});

app.get('/fetch-projects/:email', async (req, res, next) => {
  try {
    const { email } = req.params;
    const projects = await prisma.formData.findMany({ where: { email } });

    if (!projects.length) {
      return res.status(404).json({ error: 'No projects found' });
    }

    res.json(projects);
  } catch (err) {
    next(err);
  }
});

app.delete('/delete-project/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await prisma.formData.delete({ where: { id: Number(id) } });

    await redisClient.del('form_data');
    console.log(`✅ Deleted project ID ${id} and cleared cache`);
    res.json({ message: 'Deleted', project });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Project not found' });
    }
    next(err);
  }
});

// ---------------- GLOBAL ERROR HANDLER ---------------- //

app.use((err, req, res, next) => {
  console.error('❌ Internal error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ---------------- SERVER LISTEN ---------------- //

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// ---------------- CLEAN EXIT HANDLING ---------------- //

process.on('SIGINT', async () => {
  console.log('\n🛑 Gracefully shutting down...');
  await prisma.$disconnect();
  await redisClient.quit();
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('🔥 Unhandled Promise Rejection:', reason);
});
