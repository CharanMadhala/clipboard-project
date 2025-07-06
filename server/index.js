import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
let db;
let client;

// Enhanced error logging and validation
console.log('🔍 Checking environment variables...');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
if (process.env.MONGODB_URI) {
  // Log a sanitized version (hide password)
  const sanitizedUri = process.env.MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
  console.log('MONGODB_URI format:', sanitizedUri);
}

// Check if MONGODB_URI is defined
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  console.error('Please check your .env file in the project root');
  process.exit(1);
}

// Create MongoDB client with additional options for better error handling
client = new MongoClient(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
});

async function connectToDatabase() {
  try {
    console.log('🔄 Attempting to connect to MongoDB Atlas...');
    await client.connect();
    
    // Test the connection
    await client.db('admin').command({ ping: 1 });
    
    db = client.db('clipboard');
    console.log('✅ Connected to MongoDB Atlas successfully');
    console.log('📊 Using database: clipboard');
    
    // Test if we can access the clips collection
    const collections = await db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB Atlas:');
    console.error('Error details:', error.message);
    
    // Provide specific guidance based on common error types
    if (error.message.includes('authentication failed')) {
      console.error('🔐 Authentication issue: Check your username and password in the MongoDB URI');
    } else if (error.message.includes('network')) {
      console.error('🌐 Network issue: Check your internet connection and MongoDB Atlas network access settings');
      console.error('💡 Ensure 0.0.0.0/0 is added to your IP Access List in MongoDB Atlas');
    } else if (error.message.includes('timeout')) {
      console.error('⏱️  Connection timeout: MongoDB Atlas might be unreachable');
    }
    
    process.exit(1);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected'
  });
});

// Routes

// Get all clips
app.get('/api/clips', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const clips = await db.collection('clips').find({}).sort({ createdAt: 1 }).toArray();
    console.log(`📋 Retrieved ${clips.length} clips`);
    res.json(clips);
  } catch (error) {
    console.error('❌ Error fetching clips:', error);
    res.status(500).json({ error: 'Failed to fetch clips' });
  }
});

// Create new clip
app.post('/api/clips', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const newClip = {
      title,
      content,
      createdAt: new Date()
    };

    const result = await db.collection('clips').insertOne(newClip);
    const clip = { ...newClip, _id: result.insertedId };
    
    console.log('✅ Created new clip:', clip.title);
    res.status(201).json(clip);
  } catch (error) {
    console.error('❌ Error creating clip:', error);
    res.status(500).json({ error: 'Failed to create clip' });
  }
});

// Update clip
app.put('/api/clips/:id', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const { id } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const result = await db.collection('clips').updateOne(
      { _id: new ObjectId(id) },
      { $set: { title, content } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    const updatedClip = await db.collection('clips').findOne({ _id: new ObjectId(id) });
    console.log('✅ Updated clip:', updatedClip.title);
    res.json(updatedClip);
  } catch (error) {
    console.error('❌ Error updating clip:', error);
    res.status(500).json({ error: 'Failed to update clip' });
  }
});

// Delete clip
app.delete('/api/clips/:id', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const { id } = req.params;
    
    const result = await db.collection('clips').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    console.log('🗑️  Deleted clip with ID:', id);
    res.json({ message: 'Clip deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting clip:', error);
    res.status(500).json({ error: 'Failed to delete clip' });
  }
});

// Serve static files from the Vite build
const require = createRequire(import.meta.url);
app.use(express.static(join(__dirname, '../dist')));

// For any route not starting with /api, serve index.html (for React Router)
app.get('*', (req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(join(__dirname, '../dist/index.html'));
  } else {
    next();
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server only after successful database connection
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log('📡 API endpoints available:');
    console.log('  GET    /api/clips');
    console.log('  POST   /api/clips');
    console.log('  PUT    /api/clips/:id');
    console.log('  DELETE /api/clips/:id');
  });
}).catch((error) => {
  console.error('💥 Failed to start server due to database connection error');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  if (client) {
    await client.close();
    console.log('📴 MongoDB connection closed');
  }
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});