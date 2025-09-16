import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/exam-portal';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Preload all models to ensure they're registered with Mongoose
 * This helps prevent "MissingSchemaError" when models reference each other
 */

export const preloadModels = async () => {
  // Import all models to ensure they're registered
  await import('../models/Batch');
  await import('../models/College');
  await import('../models/Course');
  await import('../models/Exam');
  await import('../models/Question');
  await import('../models/Result');
  await import('../models/SecurityIncident');
  await import('../models/Setting');
  await import('../models/StudentSubscription');
  await import('../models/Subject');
  await import('../models/SubscriptionPlan');
  await import('../models/User');
  await import('../models/ExamSuspension');
};

// Simple in-memory mutex for preventing race conditions
// Key will be a string like "suspension:studentId:examId"
const locks = new Map<string, boolean>();

/**
 * Acquire a lock for a particular operation on a particular resource
 * @param key Unique identifier for the lock
 * @param timeout Time in ms to wait for lock before failing
 * @returns A function that releases the lock
 */
export async function acquireLock(key: string, timeout = 10000): Promise<() => void> {
  const startTime = Date.now();

  while (locks.get(key)) {
    // Lock is held, wait a bit
    await new Promise(resolve => setTimeout(resolve, 50));

    // Check for timeout
    if (Date.now() - startTime > timeout) {
      throw new Error(`Failed to acquire lock for ${key} after ${timeout}ms`);
    }
  }

  // Acquire lock
  locks.set(key, true);

  // Return a function to release the lock
  return () => {
    locks.delete(key);
  };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
      connectTimeoutMS: 10000, // Timeout after 10s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      retryWrites: true, // Retry write operations on error
      retryReads: true, // Retry read operations on error
    };

    console.log('Connecting to MongoDB Atlas...');
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then(async mongoose => {
        console.log('Connected to MongoDB Atlas');
        // Preload all models after connection
        await preloadModels();
        return mongoose;
      })
      .catch(err => {
        console.error('MongoDB connection error:', err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
