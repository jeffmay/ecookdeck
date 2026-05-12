import { useState } from "react";
import { useUser } from "./hooks/use_user.js";
import { useYjsDoc } from "./hooks/use_yjs_doc.js";
import { DocContext } from "./contexts/doc_context.js";
import { NavMenu } from "./components/NavMenu.js";
import { UserMenu } from "./components/UserMenu.js";
import { SelectUserPage } from "./pages/SelectUserPage.js";
import { ProfileSettingsPage } from "./pages/ProfileSettingsPage.js";
import { BulkIngredientEditorPage } from "./pages/BulkIngredientEditorPage.js";
import { RecipeEditorPage } from "./pages/RecipeEditorPage.js";

type Route = "home" | "profile_settings" | "bulk_ingredient_editor" | "recipe_editor";

interface AppContentProps {
  readonly user_name: string;
  readonly onRename: (name: string) => void;
}

function AppContent({ user_name, onRename }: AppContentProps) {
  const [route, set_route] = useState<Route>("home");
  const doc = useYjsDoc(user_name);

  function handleSaveProfile(name: string) {
    onRename(name);
    set_route("home");
  }

  return (
    <DocContext.Provider value={doc}>
      <div className="app">
        <header className="top-nav">
          <NavMenu onNavigate={(page) => set_route(page)} />
          <span className="app-title">Recipe Book</span>
          <div className="nav-right">
            <button className="undo-btn" aria-label="Undo">↩ Undo</button>
            <UserMenu
              user_name={user_name}
              onProfile={() => set_route("profile_settings")}
            />
          </div>
        </header>

        {route === "profile_settings" ? (
          <ProfileSettingsPage
            current_name={user_name}
            onSave={handleSaveProfile}
            onCancel={() => set_route("home")}
          />
        ) : route === "bulk_ingredient_editor" ? (
          <BulkIngredientEditorPage />
        ) : route === "recipe_editor" ? (
          <RecipeEditorPage user_name={user_name} />
        ) : (
          <main className="page-content">
            <p className="placeholder">Your recipes will appear here.</p>
          </main>
        )}
      </div>
    </DocContext.Provider>
  );
}

export function App() {
  const { user_name, set_user_name } = useUser();

  if (user_name === null) {
    return <SelectUserPage onSelect={set_user_name} />;
  }

  return (
    <AppContent
      key={user_name}
      user_name={user_name}
      onRename={set_user_name}
    />
  );
}
