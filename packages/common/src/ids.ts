import { monotonicFactory, ulid as ulidBase } from "ulid";

export const ulid = ulidBase;

export const monotonicUlid = monotonicFactory();
