import type { StorageEngine } from "../config.ts";
import config from "../config.ts";
import { LocalFileStore } from "./localFile.ts";
import { LocalMemoryStore } from "./localMemory.ts";
import { NetlifyBlobStore } from "./netlifyBlobs.ts";
import type { DocumentStore } from "./types.ts";

export type { DocumentStore };

export function createDocumentStore(engine?: StorageEngine): DocumentStore {
  const storageEngine = engine ?? config.STORAGE_ENGINE;

  switch (storageEngine) {
    case "local-file":
      return new LocalFileStore("./data");
    case "netlify-blobs": {
      const projectId = config.NETLIFY_PROJECT_ID;
      if (!projectId) {
        throw new Error("NETLIFY_PROJECT_ID is required when STORAGE_ENGINE=netlify-blobs");
      }
      return new NetlifyBlobStore(projectId);
    }
    case "local-memory":
    default:
      return new LocalMemoryStore();
  }
}
