import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase(uri = env.MONGO_URI) {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    return mongoose.connection;
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error.message}`, { cause: error });
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}
