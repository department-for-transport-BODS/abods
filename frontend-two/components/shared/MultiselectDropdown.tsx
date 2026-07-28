import { useEffect, useRef, useState } from "react";

interface MultiselectDropdownProps {
  multiSelect?: boolean;
  hideLabel?: boolean;
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholderText?: string;
  disabled?: boolean;
  clearable?: boolean;
}

export const MultiselectDropdown = ({
  multiSelect = true,
  hideLabel = false,
  label,
  options,
  selected,
  onChange,
  placeholderText,
  disabled = false,
  clearable = false,
}: MultiselectDropdownProps) => {
  const [open, setOpen] = useState(false);

  const hasSelected = selected.length > 0;

  const ref = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const toggleSelectedOption = (option: string) => {
    if (disabled) return;

    if (!multiSelect) {
      onChange(selected.includes(option) ? [] : [option]);
      setOpen(false);
      setSearch("");
      return;
    }
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const toggleAllOptions = () => {
    if (hasSelected) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  const clearSelection = () => {
    onChange([]);
    setOpen(false);
    setSearch("");
  };

  const displayText =
    selected.length === 0
      ? placeholderText ?? ""
      : selected.length === 1
        ? selected[0]
        : `${selected.length} selected`;
  const showClearButton = clearable && hasSelected && !disabled;

  return (
    <div className="govuk-form-group multiselect-dropdown" ref={ref}>
      <label className="govuk-label">{hideLabel ? "" : label}</label>
      {open ? (
        <input
          type="text"
          className="multiselect-dropdown__button multiselect-dropdown__search-text"
          value={search}
          disabled={disabled}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      ) : (
        <div className="multiselect-dropdown__control">
          <button
            type="button"
            className={`multiselect-dropdown__button${open ? " multiselect-dropdown__button--open" : ""}${showClearButton ? " multiselect-dropdown__button--clearable" : ""}`}
            disabled={disabled}
            onClick={() => setOpen(true)}
          >
            <span
              className={`multiselect-dropdown__button-text${hasSelected ? " multiselect-dropdown__button-text--selected" : ""}`}
            >
              {displayText}
            </span>
            <span className="multiselect-dropdown__arrow"></span>
          </button>
          {showClearButton ? (
            <button
              type="button"
              className="multiselect-dropdown__clear"
              aria-label={`Clear ${label}`}
              onClick={clearSelection}
            >
              ×
            </button>
          ) : null}
        </div>
      )}
      {open && (
        <div className="multiselect-dropdown__panel">
          {multiSelect ? (
            <div className="multiselect-dropdown__header">
              <div className="govuk-body multiselect-dropdown__header-label font-bold">
                {label}
              </div>
              <button
                type="button"
                className="govuk-link"
                onClick={toggleAllOptions}
              >
                {hasSelected ? "Clear all" : "Show all"}
              </button>
            </div>
          ) : null}
          {multiSelect ? (
            filteredOptions.length === 0 ? (
              <p className="govuk-body govuk-!-margin-bottom-0">No items found</p>
            ) : (
              <div className="govuk-checkboxes">
                {filteredOptions.map((option, idx) => (
                  <div
                    className="govuk-checkboxes__item"
                    key={`${option}-${idx}`}
                  >
                    <input
                      className="govuk-checkboxes__input"
                      type="checkbox"
                      checked={selected.includes(option)}
                      onChange={() => toggleSelectedOption(option)}
                      id={`checkbox-${option}`}
                    />
                    <label
                      className="govuk-label govuk-checkboxes__label"
                      htmlFor={`checkbox-${option}`}
                    >
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            )
          ) : filteredOptions.length === 0 ? (
            <p className="govuk-body govuk-!-margin-bottom-0">No items found</p>
          ) : (
            <ul className="multiselect-dropdown__single-list">
              {filteredOptions.map((option, idx) => (
                <li
                  key={`${option}-${idx}`}
                  className={`multiselect-dropdown__single-item${
                    selected.includes(option)
                      ? " multiselect-dropdown__single-item--selected"
                      : ""
                  }`}
                  onClick={() => toggleSelectedOption(option)}
                >
                  {option}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
