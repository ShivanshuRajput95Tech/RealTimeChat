import mongoose from 'mongoose';
import config from '../config/env.js';
import logger from './logger.js';

// Function to connect to the mongodb database
export const connectDB = async () => {
  try {
    mongoose.connection.on('connected', () => {
      logger.info('Database connected');
    });

    mongoose.connection.on('error', (error) => {
      logger.error('Database connection error', error);
    });

    await mongoose.connect(config.mongodb.uri);
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
};
