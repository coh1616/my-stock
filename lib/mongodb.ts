import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI environment variable");
}

const uri: string = MONGODB_URI;

type MongooseCache = { conn: Promise<typeof mongoose> | null };

const globalWithMongoose = globalThis as typeof globalThis & {
  _mongooseCache?: MongooseCache;
};

const cache: MongooseCache = globalWithMongoose._mongooseCache ?? { conn: null };
globalWithMongoose._mongooseCache = cache;

export async function connectToDatabase() {
  if (!cache.conn) {
    cache.conn = mongoose.connect(uri);
  }
  return cache.conn;
}
