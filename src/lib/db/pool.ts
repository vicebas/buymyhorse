import { defaultProvider } from "@aws-sdk/credential-provider-node"
import { formatUrl } from "@aws-sdk/util-format-url"
import { Sha256 } from "@aws-crypto/sha256-js"
import { SignatureV4 } from "@smithy/signature-v4"
import { HttpRequest } from "@smithy/protocol-http"
import { Pool } from "pg"

type DbAuthMode = "database-url" | "rds-iam"

function getDbAuthMode(): DbAuthMode {
  return process.env.DB_AUTH_MODE === "rds-iam" ? "rds-iam" : "database-url"
}

function requireEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required.`)
  }

  return value
}

async function generateRdsIamToken({
  hostname,
  port,
  region,
  username
}: {
  hostname: string
  port: number
  region: string
  username: string
}) {
  const signer = new SignatureV4({
    credentials: defaultProvider(),
    region,
    service: "rds-db",
    sha256: Sha256
  })

  const request = new HttpRequest({
    protocol: "https:",
    hostname,
    method: "GET",
    port,
    path: "/",
    query: {
      Action: "connect",
      DBUser: username
    },
    headers: {
      host: `${hostname}:${port}`
    }
  })

  const presignedRequest = await signer.presign(request, { expiresIn: 900 })

  return formatUrl(presignedRequest).replace(/^https:\/\//, "")
}

function createDatabaseUrlPool() {
  return new Pool({
    connectionString: requireEnv("DATABASE_URL")
  })
}

function createRdsIamPool() {
  const hostname = requireEnv("RDSHOST")
  const region = requireEnv("AWS_REGION")
  const user = process.env.PGUSER || "postgres"
  const database = process.env.PGDATABASE || "postgres"
  const port = Number(process.env.PGPORT || "5432")

  return new Pool({
    host: hostname,
    port,
    user,
    database,
    ssl: true,
    password: async () =>
      generateRdsIamToken({
        hostname,
        port,
        region,
        username: user
      })
  })
}

export function createPool() {
  return getDbAuthMode() === "rds-iam" ? createRdsIamPool() : createDatabaseUrlPool()
}
