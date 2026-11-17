/** Synchronous, device-only JSON persistence. There are deliberately no automatic writes,
 * migrations, deletions, retries or default-state effects. Call from onMount or a user action.
 * Domain packages own keys, schema validation, normalization and recovery messages.
 */
export interface LocalStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export type ReadStatus = 'ok' | 'missing' | 'invalid' | 'unavailable';
export interface LocalRead<T> {
  value: T;
  /** false means the saved payload could not be safely consumed, not proof that writes fail. */
  available: boolean;
  status: ReadStatus;
}
export function readLocal<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => boolean = () => true,
  storage?: LocalStore,
): LocalRead<T> {
  let raw: string | null;
  try {
    // Resolve the getter inside try: Safari privacy modes can throw on property access itself.
    raw = (storage ?? globalThis.localStorage).getItem(key);
  } catch {
    return { value: fallback, available: false, status: 'unavailable' };
  }
  if (raw === null) return { value: fallback, available: true, status: 'missing' };
  try {
    const value: unknown = JSON.parse(raw);
    if (!validate(value)) return { value: fallback, available: false, status: 'invalid' };
    return { value: value as T, available: true, status: 'ok' };
  } catch {
    return { value: fallback, available: false, status: 'invalid' };
  }
}
/** Explicit write only. Return failure for denied/quota storage or non-JSON values. */
export function writeLocal(key: string, value: unknown, storage?: LocalStore): boolean {
  try {
    const json = JSON.stringify(value);
    if (json === undefined) return false;
    (storage ?? globalThis.localStorage).setItem(key, json);
    return true;
  } catch {
    return false;
  }
}
