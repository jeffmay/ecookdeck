import { useEffect, useState } from "react";
import {
  type RecipeFolder,
  type RecipeFolderId,
  createRecipeFolder,
  deleteRecipeFolder,
  getRecipeFolderYmap,
  getRecipeFolders,
  getRecipeFoldersFlat,
  updateRecipeFolder,
} from "@recipe-book/shared";
import { useDoc } from "../contexts/doc_context.js";

export interface RecipeFolderStore {
  readonly folders: RecipeFolder[];
  readonly flat_folders: Array<Omit<RecipeFolder, "children">>;
  readonly create_folder: (name: string, parent_id?: RecipeFolderId) => RecipeFolder;
  readonly update_folder: (folder: RecipeFolder) => void;
  readonly delete_folder: (id: RecipeFolderId) => void;
}

export function useRecipeFolderStore(): RecipeFolderStore {
  const doc = useDoc();
  const [folders, set_folders] = useState<RecipeFolder[]>(() => getRecipeFolders(doc));
  const [flat_folders, set_flat_folders] = useState(() => getRecipeFoldersFlat(doc));

  useEffect(() => {
    const map = getRecipeFolderYmap(doc);
    function update() {
      set_folders(getRecipeFolders(doc));
      set_flat_folders(getRecipeFoldersFlat(doc));
    }
    map.observe(update);
    return () => map.unobserve(update);
  }, [doc]);

  return {
    folders,
    flat_folders,
    create_folder: (name, parent_id) => createRecipeFolder(doc, name, parent_id),
    update_folder: (folder) => updateRecipeFolder(doc, folder),
    delete_folder: (id) => deleteRecipeFolder(doc, id),
  };
}
