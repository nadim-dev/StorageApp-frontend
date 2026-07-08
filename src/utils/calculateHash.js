import { createSHA256 } from "hash-wasm";

const CHUNK_SIZE = 4 * 1024 * 1024;

export async function calculateSHA256(file, onProgress) {
  const sha256 = await createSHA256();

  let processed = 0;

  for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);

    const buffer = await chunk.arrayBuffer();

    sha256.update(new Uint8Array(buffer));

    processed += chunk.size;

    if (onProgress) {
      onProgress(Math.round((processed / file.size) * 100));
    }
  }

  return sha256.digest("hex");
}