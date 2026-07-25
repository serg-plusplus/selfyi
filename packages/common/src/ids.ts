import { monotonicFactory, ulid as ulidBase } from "ulid";

/**
 * ULIDs are lexicographically sortable by creation time, which makes cursor
 * pagination trivial (`id < cursor` == "created before the cursor"). Used as
 * the primary key for every row (infra spec §2).
 */
export const ulid = ulidBase;

/**
 * Monotonic factory guarantees strictly increasing ULIDs even within the same
 * millisecond — important when several rows are created in a tight loop and we
 * rely on id ordering for pagination.
 */
export const monotonicUlid = monotonicFactory();
