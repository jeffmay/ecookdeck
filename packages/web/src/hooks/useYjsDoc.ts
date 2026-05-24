import { useEffect, useRef } from "react";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";

export interface YjsDocResult {
  readonly doc: Y.Doc;
  readonly whenSynced: Promise<unknown>;
}

export function useYjsDoc(userName: string): YjsDocResult {
  const docRef = useRef<Y.Doc>(new Y.Doc());
  const whenSyncedRef = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    const persistence = new IndexeddbPersistence(userName, docRef.current);
    whenSyncedRef.current = persistence.whenSynced;
    return () => {
      persistence.destroy();
    };
  }, [userName]);

  return { doc: docRef.current, whenSynced: whenSyncedRef.current };
}
