import { MongoClient } from "mongodb";

const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

// Reuse one client across hot reloads and serverless invocations.
export function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  if (!globalForMongo._mongoClientPromise) {
    // Fail fast instead of hanging for the 30s driver default.
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000, connectTimeoutMS: 10_000 });
    globalForMongo._mongoClientPromise = client.connect().catch((err) => {
      // Don't cache a failed connection; let the next request retry.
      globalForMongo._mongoClientPromise = undefined;
      throw err;
    });
  }
  return globalForMongo._mongoClientPromise;
}

export async function getDb() {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DB || "interview");
}
