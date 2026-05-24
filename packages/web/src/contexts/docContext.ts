import { createContext, useContext } from "react";
import * as Y from "yjs";

export interface DocContextValue {
  readonly doc: Y.Doc;
  readonly whenSynced: Promise<unknown>;
}

export const DocContext = createContext<DocContextValue | null>(null);

export function useDoc(): Y.Doc {
  const ctx = useContext(DocContext);
  if (ctx === null) throw new Error("useDoc must be called inside a DocContext.Provider");
  return ctx.doc;
}

export function useDocContext(): DocContextValue {
  const ctx = useContext(DocContext);
  if (ctx === null) throw new Error("useDocContext must be called inside a DocContext.Provider");
  return ctx;
}
