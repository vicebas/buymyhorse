function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizeOrigin(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return stripTrailingSlash(new URL(trimmed).origin);
  } catch {
    return null;
  }
}

export function getAppOrigin(req?: Request) {
  const configuredOrigin =
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL || "") ||
    normalizeOrigin(process.env.NEXTAUTH_URL || "");

  if (configuredOrigin) {
    return configuredOrigin;
  }

  if (req) {
    const forwardedProto = req.headers.get("x-forwarded-proto");
    const forwardedHost = req.headers.get("x-forwarded-host");

    if (forwardedProto && forwardedHost) {
      return stripTrailingSlash(`${forwardedProto}://${forwardedHost}`);
    }

    return stripTrailingSlash(new URL(req.url).origin);
  }

  return "http://localhost:3000";
}
