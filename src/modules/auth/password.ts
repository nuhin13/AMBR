import "server-only";
import { hash, verify } from "@node-rs/argon2";

// OWASP-recommended argon2id parameters
const opts = { memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 } as const;

export const hashPassword = (plain: string) => hash(plain, opts);

export async function verifyPassword(hashed: string, plain: string) {
  try {
    return await verify(hashed, plain);
  } catch {
    return false;
  }
}
