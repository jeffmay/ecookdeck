import type { StorageEngine } from "../config.js";
import config from "../config.js";
import { LocalFileStore } from "./localFile.js";
import { LocalMemoryStore } from "./localMemory.js";
import { NetlifyBlobStore } from "./netlifyBlobs.js";
import type { DocumentStore } from "./types.js";

export { DocumentStore };

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
