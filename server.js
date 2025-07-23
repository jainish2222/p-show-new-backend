const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client
const prisma = new PrismaClient();

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

    console.log('✅ Form data submitted');
    res.status(201).json({ formData });
  } catch (err) {
    next(err);
  }
});

app.get('/fetch-form', async (req, res, next) => {
  try {
    const formData = await prisma.formData.findMany();
    console.log('✅ Fetched form data from DB');
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

    console.log(`✅ Deleted project ID ${id}`);
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
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('🔥 Unhandled Promise Rejection:', reason);
});
