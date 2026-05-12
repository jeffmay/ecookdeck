import { useState, type FormEvent } from "react";
import "./ProfileSettingsPage.css";

interface ProfileSettingsPageProps {
  readonly current_name: string;
  readonly onSave: (name: string) => void;
  readonly onCancel: () => void;
}

export function ProfileSettingsPage({
  current_name,
  onSave,
  onCancel,
}: ProfileSettingsPageProps) {
  const [name, set_name] = useState(current_name);
  const trimmed = name.trim();
  const is_unchanged = trimmed === current_name;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (trimmed !== "" && !is_unchanged) onSave(trimmed);
  }

  return (
    <main className="profile-settings-page">
      <h1 className="profile-settings-title">Profile Settings</h1>
      <form className="profile-settings-form" onSubmit={handleSubmit}>
        <label className="profile-settings-label" htmlFor="profile-name-input">
          Your name
        </label>
        <input
          id="profile-name-input"
          className="profile-settings-input"
          type="text"
          value={name}
          onChange={(e) => set_name(e.target.value)}
          autoComplete="name"
        />
        <div className="profile-settings-actions">
          <button
            type="submit"
            className="profile-settings-save"
            disabled={trimmed === "" || is_unchanged}
          >
            Save
          </button>
          <button type="button" className="profile-settings-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
