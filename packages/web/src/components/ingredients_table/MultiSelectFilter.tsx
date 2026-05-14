import { useState, useRef, useEffect } from "react";
import "./MultiSelectFilter.css";

export interface MultiSelectFilterProps {
  readonly value: readonly string[];
  readonly onChange: (values: string[]) => void;
  readonly all_options: readonly string[];
  readonly aria_label: string;
}

export function MultiSelectFilter({ value, onChange, all_options, aria_label }: MultiSelectFilterProps) {
  const [open, set_open] = useState(false);
  const [snapshot, set_snapshot] = useState<string[]>([]);
  const [search, set_search] = useState("");
  const container_ref = useRef<HTMLDivElement>(null);
  const search_ref = useRef<HTMLInputElement>(null);

  function openDropdown() {
    if (open) return;
    set_snapshot([...value]);
    set_open(true);
    setTimeout(() => search_ref.current?.focus(), 0);
  }

  function toggleOption(opt: string) {
    const next = value.includes(opt)
      ? value.filter((v) => v !== opt)
      : [...value, opt];
    onChange(next);
  }

  function handleAccept() {
    set_open(false);
    set_search("");
  }

  function handleRevert() {
    onChange(snapshot);
    set_open(false);
    set_search("");
  }

  useEffect(() => {
    if (!open) return;
    function onMousedown(e: MouseEvent) {
      if (
        container_ref.current instanceof Node &&
        !container_ref.current.contains(e.target instanceof Node ? e.target : null)
      ) {
        set_open(false);
        set_search("");
      }
    }
    document.addEventListener("mousedown", onMousedown);
    return () => document.removeEventListener("mousedown", onMousedown);
  }, [open]);

  const visible_options =
    search === ""
      ? all_options
      : all_options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  const summary =
    value.length === 0 ? "" : value.length === 1 ? value[0]! : `${value.length} selected`;

  return (
    <div ref={container_ref} className="msf-wrapper">
      <div className="msf-input-row">
        <input
          type="text"
          className="msf-input"
          value={summary}
          readOnly
          onClick={openDropdown}
          onFocus={openDropdown}
          placeholder="Filter…"
          aria-label={aria_label}
          aria-haspopup="listbox"
          aria-expanded={open}
        />
        {value.length > 0 && (
          <button
            type="button"
            className="msf-clear-btn"
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
            }}
            aria-label={`Clear ${aria_label}`}
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className="msf-dropdown" role="listbox" aria-multiselectable>
          <input
            ref={search_ref}
            type="text"
            className="msf-search"
            value={search}
            onChange={(e) => set_search(e.target.value)}
            placeholder="Search options…"
            aria-label={`Search ${aria_label} options`}
          />
          {visible_options.length === 0 && (
            <div className="msf-no-options">No options</div>
          )}
          {visible_options.map((opt) => (
            <label key={opt} className="msf-option">
              <input
                type="checkbox"
                checked={value.includes(opt)}
                onChange={() => toggleOption(opt)}
                aria-label={opt}
              />
              {opt}
            </label>
          ))}
          <div className="msf-actions">
            <button type="button" onClick={handleAccept} aria-label="Accept filter">
              ✔︎
            </button>
            <button type="button" onClick={handleRevert} aria-label="Revert filter">
              ✗
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
