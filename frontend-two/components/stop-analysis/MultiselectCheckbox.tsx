import { useCallback, useMemo, useRef, useState } from "react";

interface MultiselectOption {
  label: string;
  value: string;
}

interface MultiselectCheckboxProps {
  id: string;
  label: string;
  options: MultiselectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  showAll?: boolean;
  showAllLabel?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const MultiselectCheckbox = ({
  id,
  label,
  options,
  selectedValues,
  onChange,
  showAll = true,
  showAllLabel = "All",
  placeholder,
  disabled = false,
}: MultiselectCheckboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(
    () =>
      options.filter((opt) =>
        opt.label.toLowerCase().includes(searchText.toLowerCase()),
      ),
    [options, searchText],
  );

  const allSelected = selectedValues.length === 0;

  const handleToggle = useCallback(
    (value: string) => {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      onChange(newValues);
    },
    [selectedValues, onChange],
  );

  const handleSelectAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const displayText = allSelected
    ? showAllLabel
    : selectedValues.length === 1
      ? options.find((o) => o.value === selectedValues[0])?.label ??
        `${selectedValues.length} selected`
      : `${selectedValues.length} selected`;

  return (
    <div
      ref={containerRef}
      className="multiselect-checkbox"
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <label className="govuk-label" htmlFor={id}>
        {label}
      </label>
      <button
        id={id}
        type="button"
        className="multiselect-checkbox__trigger govuk-input"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label}
      >
        {displayText}
      </button>
      {isOpen && (
        <div className="multiselect-checkbox__dropdown" role="listbox">
          <input
            type="text"
            className="govuk-input govuk-input--width-20 multiselect-checkbox__search"
            placeholder={placeholder ?? `Search ${label.toLowerCase()}`}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            aria-label={`Search ${label.toLowerCase()}`}
          />
          <div className="multiselect-checkbox__options">
            {showAll && (
              <label className="multiselect-checkbox__option">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                />
                <span>{showAllLabel}</span>
              </label>
            )}
            {filteredOptions.map((option) => (
              <label
                key={option.value}
                className="multiselect-checkbox__option"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => handleToggle(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
