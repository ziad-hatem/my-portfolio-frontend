import { MongoClient } from "mongodb";

let mongoClient: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export async function getMongoClient() {
  // Return existing client if we have one
  if (mongoClient) {
    return mongoClient;
  }

  // If there's already a connection attempt in progress, return that promise
  if (clientPromise) {
    return clientPromise;
  }

  const mongoUri =
    "mongodb+srv://ziadhatem2022_db_user:QeRSnpqf3HHUahPt@cluster0.gflnrym.mongodb.net/?appName=Cluster0";
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  console.log("🔌 Attempting MongoDB connection...");

  // Create a new MongoClient with minimal, compatible options
  const client = new MongoClient(mongoUri, {
    // Use minimal options for better compatibility
    retryWrites: true,
    w: "majority",
  });

  // Store the promise so multiple concurrent calls don't create multiple connections
  clientPromise = client
    .connect()
    .then((connectedClient) => {
      console.log("✅ Connected to MongoDB");
      mongoClient = connectedClient;
      clientPromise = null; // Reset after successful connection
      return connectedClient;
    })
    .catch((error) => {
      console.error("❌ MongoDB connection error:", error);
      clientPromise = null; // Reset on error so next call can retry
      mongoClient = null;
      throw error;
    });

  return clientPromise;
}

export async function getDatabase() {
  const client = await getMongoClient();
  return client.db("portfolio_analytics");
}

// Graceful cleanup on process termination
if (typeof process !== "undefined") {
  process.on("SIGINT", async () => {
    if (mongoClient) {
      await mongoClient.close();
      console.log("MongoDB connection closed");
      process.exit(0);
    }
  });
}
