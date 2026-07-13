import { defaultProvider } from "@aws-sdk/credential-provider-node"
import { formatUrl } from "@aws-sdk/util-format-url"
import { Sha256 } from "@aws-crypto/sha256-js"
import { SignatureV4 } from "@smithy/signature-v4"
import { HttpRequest } from "@smithy/protocol-http"
import { Pool } from "pg"

type DbAuthMode = "database-url" | "rds-iam"

const BUILD_TIME_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/postgres"

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

function optionalEnv(name: string): string | null {
  return process.env[name] || null
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
    connectionString: optionalEnv("DATABASE_URL") || BUILD_TIME_DATABASE_URL
  })
}

function createRdsIamPool() {
  const hostname = optionalEnv("RDSHOST")
  const region = optionalEnv("AWS_REGION")

  if (!hostname || !region) {
    return createDatabaseUrlPool()
  }

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
