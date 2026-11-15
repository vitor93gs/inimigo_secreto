import { MongoClient } from "mongodb";

export const DRAW_COLLECTION = process.env.MONGODB_DRAWS_COLLECTION || "draws";

let clientPromise: Promise<MongoClient> | undefined;
let indexesPromise: Promise<void> | undefined;

export function mongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI não configurada");
  if (!clientPromise) clientPromise = new MongoClient(uri).connect().catch((error) => {
    clientPromise = undefined;
    throw error;
  });
  return clientPromise;
}

export async function database() {
  const db = (await mongo()).db(process.env.MONGODB_DB || "amigo_secreto");
  if (!indexesPromise) indexesPromise = Promise.all([
    db.collection("loginTokens").createIndex({ digest: 1 }, { unique: true }),
    db.collection("loginTokens").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("loginAttempts").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]).then(() => undefined).catch((error) => { indexesPromise = undefined; throw error; });
  await indexesPromise;
  return db;
}
