import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const COOKIE_NAME = "linguist_session";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const DEV_JWT_SECRET = "dev-jwt-secret-change-this-before-production-2026";
let hasWarnedAboutDevSecret = false;

type TokenPayload = {
  userId: string;
  name: string;
  email: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (secret && secret.length >= 32) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    if (!hasWarnedAboutDevSecret) {
      hasWarnedAboutDevSecret = true;
      console.warn(
        "[auth] JWT_SECRET is missing or too short. Falling back to a local development secret."
      );
    }

    return DEV_JWT_SECRET;
  }

  throw new Error(
    "JWT_SECRET is missing or too short. Set JWT_SECRET in .env to at least 32 characters."
  );
}

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "30d",
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
