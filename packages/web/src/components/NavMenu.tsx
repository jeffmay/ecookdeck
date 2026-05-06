import "./NavMenu.css";

type NavPage = "bulk_ingredient_editor";

interface NavMenuProps {
  readonly on_navigate: (page: NavPage) => void;
}

export function NavMenu({ on_navigate }: NavMenuProps) {
  return (
    <details className="nav-menu">
      <summary className="nav-menu-trigger" aria-label="Navigation menu">
        ☰
      </summary>
      <nav className="nav-menu-dropdown" aria-label="Main navigation">
        <button
          className="nav-menu-item"
          onClick={() => on_navigate("bulk_ingredient_editor")}
        >
          Ingredients
        </button>
      </nav>
    </details>
  );
}
