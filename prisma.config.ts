import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import { withDatabaseSchema } from "./src/lib/database-schema";

config({ path: ".env.local" });
config();

const prismaDatasourceUrl = process.env["POSTGRES_URL_NON_POOLING"] ?? process.env["POSTGRES_PRISMA_URL"] ?? "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: prismaDatasourceUrl ? withDatabaseSchema(prismaDatasourceUrl) : "",
  },
});
