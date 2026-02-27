import { Db, MongoClient } from "mongodb";

const DEFAULT_DB_NAME = "portfolio_analytics";

let cachedClient: MongoClient | null = null;
let cachedClientPromise: Promise<MongoClient> | null = null;

function getRequiredMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing required env var: MONGODB_URI");
  }
  return uri;
}

function getMongoDbName(): string {
  return process.env.MONGODB_DB_NAME || DEFAULT_DB_NAME;
}

export async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  if (cachedClientPromise) {
    return cachedClientPromise;
  }

  const client = new MongoClient(getRequiredMongoUri(), {
    retryWrites: true,
    w: "majority",
  });

  cachedClientPromise = client
    .connect()
    .then((connectedClient) => {
      cachedClient = connectedClient;
      return connectedClient;
    })
    .catch((error) => {
      cachedClientPromise = null;
      cachedClient = null;
      throw error;
    });

  return cachedClientPromise;
}

export async function getDatabase(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(getMongoDbName());
}
