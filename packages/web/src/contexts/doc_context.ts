import { createContext, useContext } from "react";
import * as Y from "yjs";

export const DocContext = createContext<Y.Doc | null>(null);

export function use_doc(): Y.Doc {
  const doc = useContext(DocContext);
  if (doc === null) throw new Error("use_doc must be called inside a DocContext.Provider");
  return doc;
}
