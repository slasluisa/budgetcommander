import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { resolveDatabaseSchema, withDatabaseSchema } from "@/lib/database-schema";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.POSTGRES_PRISMA_URL;
  if (!connectionString) {
    throw new Error("POSTGRES_PRISMA_URL environment variable is not set");
  }
  // Strip sslmode from connection string — pg treats sslmode=require as verify-full,
  // which rejects self-signed certs. We handle SSL via the ssl option instead.
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  const schema = resolveDatabaseSchema();
  const adapter = new PrismaPg({
    connectionString: withDatabaseSchema(url.toString()),
    ssl: { rejectUnauthorized: false },
  }, { schema });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
