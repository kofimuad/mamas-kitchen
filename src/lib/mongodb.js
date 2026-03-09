// src/lib/mongodb.js
// MongoDB connection helper — used by Netlify functions
// Not used directly on the frontend, but kept here for reference

import mongoose from 'mongoose'

let isConnected = false

export async function connectDB() {
  if (isConnected) {
    console.log('Using existing MongoDB connection')
    return
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set')
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: 'obaa-yaas-kitchen',
  })

  isConnected = true
  console.log('MongoDB connected')
}

export default connectDB
