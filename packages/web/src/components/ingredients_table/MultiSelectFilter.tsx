import { useState, useRef, useEffect } from "react";
import type { Column } from "@tanstack/react-table";
import type { IngredientRow } from "./build_ingredient_tree.js";
import "./MultiSelectFilter.css";

export function to_string_array(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((item): item is string => typeof item === "string");
}

export interface MultiSelectFilterProps {
  readonly column: Column<IngredientRow, unknown>;
  readonly all_options: readonly string[];
  readonly aria_label: string;
}

export function MultiSelectFilter({ column, all_options, aria_label }: MultiSelectFilterProps) {
  const [open, set_open] = useState(false);
  const [snapshot, set_snapshot] = useState<string[]>([]);
  const [search, set_search] = useState("");
  const container_ref = useRef<HTMLDivElement>(null);
  const search_ref = useRef<HTMLInputElement>(null);

  const active = to_string_array(column.getFilterValue());

  function open_dropdown() {
    if (open) return;
    set_snapshot(active.slice());
    set_open(true);
    // Focus search on next tick
    setTimeout(() => search_ref.current?.focus(), 0);
  }

  function toggle_option(opt: string) {
    const next = active.includes(opt)
      ? active.filter((v) => v !== opt)
      : [...active, opt];
    column.setFilterValue(next.length > 0 ? next : undefined);
  }

  function handle_accept() {
    set_open(false);
    set_search("");
  }

  function handle_revert() {
    column.setFilterValue(snapshot.length > 0 ? snapshot : undefined);
    set_open(false);
    set_search("");
  }

  // Close on outside click (auto-accept)
  useEffect(() => {
    if (!open) return;
    function on_mousedown(e: MouseEvent) {
      if (
        container_ref.current instanceof Node &&
        !container_ref.current.contains(e.target instanceof Node ? e.target : null)
      ) {
        set_open(false);
        set_search("");
      }
    }
    document.addEventListener("mousedown", on_mousedown);
    return () => document.removeEventListener("mousedown", on_mousedown);
  }, [open]);

  const visible_options =
    search === ""
      ? all_options
      : all_options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  const summary =
    active.length === 0 ? "" : active.length === 1 ? active[0]! : `${active.length} selected`;

  return (
    <div ref={container_ref} className="msf-wrapper">
      <div className="msf-input-row">
        <input
          type="text"
          className="msf-input"
          value={summary}
          readOnly
          onClick={open_dropdown}
          onFocus={open_dropdown}
          placeholder="Filter…"
          aria-label={aria_label}
          aria-haspopup="listbox"
          aria-expanded={open}
        />
        {active.length > 0 && (
          <button
            type="button"
            className="msf-clear-btn"
            onClick={(e) => {
              e.stopPropagation();
              column.setFilterValue(undefined);
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
                checked={active.includes(opt)}
                onChange={() => toggle_option(opt)}
                aria-label={opt}
              />
              {opt}
            </label>
          ))}
          <div className="msf-actions">
            <button type="button" onClick={handle_accept} aria-label="Accept filter">
              ✔︎
            </button>
            <button type="button" onClick={handle_revert} aria-label="Revert filter">
              ✗
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
