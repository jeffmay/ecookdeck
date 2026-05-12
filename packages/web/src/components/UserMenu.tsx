import "./UserMenu.css";

interface UserMenuProps {
  readonly user_name: string;
  readonly onProfile: () => void;
}

export function UserMenu({ user_name, onProfile }: UserMenuProps) {
  return (
    <details className="user-menu">
      <summary className="user-menu-trigger" aria-label={`User menu for ${user_name}`}>
        {user_name} ▾
      </summary>
      <div className="user-menu-dropdown" role="menu">
        <button
          className="user-menu-item"
          role="menuitem"
          onClick={onProfile}
        >
          Profile settings
        </button>
      </div>
    </details>
  );
}
