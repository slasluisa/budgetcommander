type DeploymentEnvironment = "production" | "preview" | "development";

const VERCEL_ENVIRONMENTS = new Set<DeploymentEnvironment>([
  "production",
  "preview",
  "development",
]);

export function resolveDeploymentEnvironment(env: NodeJS.ProcessEnv = process.env): DeploymentEnvironment {
  const vercelEnvironment = env.VERCEL_ENV;

  if (vercelEnvironment && VERCEL_ENVIRONMENTS.has(vercelEnvironment as DeploymentEnvironment)) {
    return vercelEnvironment as DeploymentEnvironment;
  }

  if (env.NODE_ENV === "production") {
    return "production";
  }

  return "development";
}

export function resolveDatabaseSchema(env: NodeJS.ProcessEnv = process.env): string {
  const deploymentEnvironment = resolveDeploymentEnvironment(env);

  switch (deploymentEnvironment) {
    case "production":
      return env.POSTGRES_SCHEMA_PRODUCTION ?? env.POSTGRES_SCHEMA ?? "production";
    case "preview":
      return env.POSTGRES_SCHEMA_PREVIEW ?? env.POSTGRES_SCHEMA ?? "preview";
    case "development":
      return env.POSTGRES_SCHEMA_DEVELOPMENT ?? env.POSTGRES_SCHEMA ?? "development";
  }
}

export function withDatabaseSchema(
  connectionString: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const url = new URL(connectionString);

  url.searchParams.set("schema", resolveDatabaseSchema(env));

  return url.toString();
}
