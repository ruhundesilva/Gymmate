import * as SecureStore from "expo-secure-store";

// ponytail: SecureStore caps each value at ~2048 bytes but a Supabase session
// (access + refresh token + user object) regularly exceeds that. Split across
// numbered keys instead of falling back to AsyncStorage (docs/09-security.md
// requires tokens stay in the Keychain). Upgrade path: only needed if a single
// chunk ever needs to exceed a few hundred KB.
const CHUNK_SIZE = 1800;

async function getChunkCount(key: string): Promise<number> {
  const raw = await SecureStore.getItemAsync(`${key}_chunks`);
  return raw ? parseInt(raw, 10) : 0;
}

export const chunkedSecureStore = {
  async getItem(key: string): Promise<string | null> {
    const count = await getChunkCount(key);
    if (count === 0) return null;
    const parts = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        SecureStore.getItemAsync(`${key}_${i}`)
      )
    );
    return parts.every((p) => p !== null) ? parts.join("") : null;
  },

  async setItem(key: string, value: string): Promise<void> {
    await chunkedSecureStore.removeItem(key);
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await Promise.all(
      chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}_${i}`, chunk))
    );
    await SecureStore.setItemAsync(`${key}_chunks`, String(chunks.length));
  },

  async removeItem(key: string): Promise<void> {
    const count = await getChunkCount(key);
    await Promise.all(
      Array.from({ length: count }, (_, i) =>
        SecureStore.deleteItemAsync(`${key}_${i}`)
      )
    );
    await SecureStore.deleteItemAsync(`${key}_chunks`);
  },
};
