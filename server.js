const redis = require('redis');
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { createClient } =require('redis');

// Initialize Prisma and Redis Clients
const prisma = new PrismaClient();

const client = createClient({
    username: 'default',
    password: 'O3UX9CAPYevNNGUFN1qs2OJKETuqarD4',
    socket: {
        host: 'redis-19587.c267.us-east-1-4.ec2.redns.redis-cloud.com',
        port: 19587
    }
});

client.on('error', (err) => console.error('Redis error:', err));

// Connect Redis
(async () => {
  try {
    await client.connect();
    console.log('Connected to Redis');
  } catch (err) {
    console.error('Redis connection error:', err);
  }
})();

const app = express();
app.use(express.json()); // Use express.json() for parsing JSON
app.use(cors());

const PORT = 5000;

// Submit form data and invalidate cache
app.post('/submit-form', async (req, res) => {
  try {
    const {
      email, name, surname, college, branch,
      graduationStart, graduationEnd, projectName,
      projectDescription, githubLink, liveLink, img, agreeTerms
    } = req.body;

    const formData = await prisma.formData.create({
      data: {
        email, name, surname, college, branch,
        graduationStart: graduationStart ? new Date(graduationStart) : null,
        graduationEnd: graduationEnd ? new Date(graduationEnd) : null,
        projectName, projectDescription, githubLink, liveLink, img, agreeTerms
      }
    });

    await client.del('form_data');
    console.log('Form data submitted, cache cleared');
    res.json({ formData });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fetch form data with Redis caching
app.get('/fetch-form', async (req, res) => {
  try {
    const cachedData = await client.get('form_data');

    if (cachedData) {
      console.log('Serving form data from Redis cache');
      return res.json(JSON.parse(cachedData));
    }

    const formData = await prisma.formData.findMany();
    await client.setEx('form_data', 200, JSON.stringify(formData));
    console.log('Fetched form data from database, cached in Redis');
    res.json(formData);
  } catch (error) {
    console.error('Error fetching form data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to get project data by email
app.get('/fetch-projects/:email', async (req, res) => {
  const { email } = req.params;
  
  try {
    const projects = await prisma.formData.findMany({
      where: {
        email: email
      }
    });

    if (projects.length === 0) {
      return res.status(404).json({ error: 'No projects found for this email' });
    }

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects by email:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to delete a particular project by ID
app.delete('/delete-project/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const project = await prisma.formData.delete({
      where: {
        id: Number(id) // Ensure the ID is treated as a number
      }
    });

    // Invalidate cache after deletion
    await client.del('form_data');
    console.log(`Project with ID ${id} deleted and cache cleared`);

    res.json({ message: 'Project deleted successfully', project });
  } catch (error) {
    console.error('Error deleting project:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
