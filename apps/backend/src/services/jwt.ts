import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { JWT_TTL_SECONDS } from "@selfie/common";

const enc = new TextEncoder();
const keyOf = (secret: string) => enc.encode(secret);

/** Sign a 30-day HS256 session token with the user id as `sub` (infra §6.1). */
export async function signAppJwt(userId: string, secret: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${JWT_TTL_SECONDS}s`)
    .sign(keyOf(secret));
}

export async function verifyAppJwt(token: string, secret: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, keyOf(secret), {
    algorithms: ["HS256"],
  });
  return payload;
}
