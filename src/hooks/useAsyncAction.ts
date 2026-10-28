import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Wraps an async handler so it can only run once at a time.
 * Extra calls while it is running are ignored (no double submits), and
 * `loading` stays true until the handler settles.
 *
 *   const [save, saving] = useAsyncAction(async () => { ... });
 *   <Button loading={saving} onClick={save}>Save</Button>
 *
 * Pass `{ queue: true }` for data loaders: a call made while one is running
 * is not dropped — it runs once more after the current one finishes (several
 * such calls collapse into that single extra run). Use this for "reload the
 * list" so a refresh after a save is never skipped.
 */
export function useAsyncAction<A extends unknown[], R>(
  fn: (...args: A) => Promise<R> | R,
  options?: { queue?: boolean }
) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const queueRef = useRef(!!options?.queue);
  queueRef.current = !!options?.queue;

  const busy = useRef(false);
  const current = useRef<Promise<R | undefined> | null>(null);
  const queued = useRef<Promise<R | undefined> | null>(null);
  const mounted = useRef(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const runRef = useRef<(...args: A) => Promise<R | undefined>>(null!);
  runRef.current = (...args: A): Promise<R | undefined> => {
    if (busy.current) {
      if (!queueRef.current || !current.current) return Promise.resolve(undefined);
      if (!queued.current) {
        queued.current = current.current
          .catch(() => undefined)
          .then(() => {
            queued.current = null;
            return runRef.current(...args);
          });
      }
      return queued.current;
    }

    busy.current = true;
    setLoading(true);
    const p = (async () => {
      try {
        return await fnRef.current(...args);
      } finally {
        busy.current = false;
        current.current = null;
        if (mounted.current) setLoading(false);
      }
    })();
    current.current = p;
    return p;
  };

  const run = useCallback((...args: A) => runRef.current(...args), []);

  return [run, loading] as const;
}

/**
 * Same idea as useAsyncAction, but tracks each item separately — for row
 * actions in tables (delete row 5 while row 7 stays clickable).
 *
 *   const remove = useKeyedAction(async (id: number) => api.delete(id));
 *   <Button loading={remove.isPending(row.id)} onClick={() => remove.run(row.id)} />
 */
export function useKeyedAction<K extends string | number, A extends unknown[], R>(
  fn: (key: K, ...args: A) => Promise<R> | R
) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const busy = useRef(new Set<K>());
  const mounted = useRef(true);
  const [pendingKeys, setPendingKeys] = useState<ReadonlySet<K>>(new Set());

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const sync = () => {
    if (mounted.current) setPendingKeys(new Set(busy.current));
  };

  const run = useCallback(async (key: K, ...args: A): Promise<R | undefined> => {
    if (busy.current.has(key)) return undefined;
    busy.current.add(key);
    sync();
    try {
      return await fnRef.current(key, ...args);
    } finally {
      busy.current.delete(key);
      sync();
    }
  }, []);

  const isPending = useCallback((key: K) => pendingKeys.has(key), [pendingKeys]);

  return { run, isPending, anyPending: pendingKeys.size > 0 };
}
