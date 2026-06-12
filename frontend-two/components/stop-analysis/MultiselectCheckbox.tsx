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

  const getOptionId = (value: string) =>
    `${id}-${value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-")}`;

  const filteredOptions = useMemo(
    () =>
      options.filter((opt) =>
        opt.label.toLowerCase().includes(searchText.toLowerCase()),
      ),
    [options, searchText],
  );

  const allSelected = selectedValues.length === 0;
  const hasSelection = selectedValues.length > 0;

  const handleToggle = useCallback(
    (value: string) => {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      setSearchText("");
      onChange(newValues);
    },
    [selectedValues, onChange],
  );

  const handleSelectAll = useCallback(() => {
    setSearchText("");
    onChange([]);
  }, [onChange]);

  const displayText = allSelected
    ? placeholder ?? label
    : selectedValues.length === 1
      ? options.find((o) => o.value === selectedValues[0])?.label ??
        `${selectedValues.length} selected`
      : `${selectedValues.length} selected`;

  const inputPlaceholder = placeholder ?? label;
  const inputPrefix = isOpen && hasSelection ? `${displayText}` : "";
  const inputValue = isOpen
    ? `${inputPrefix}${inputPrefix && searchText ? "  " : ""}${searchText}`
    : searchText || displayText;

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
      <div className="multiselect-checkbox__trigger-wrap">
        <input
          id={id}
          type="text"
          className="multiselect-checkbox__trigger govuk-input"
          value={inputValue}
          placeholder={inputPlaceholder}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
            }
          }}
          onChange={(event) => {
            if (disabled) {
              return;
            }

            if (!isOpen) {
              setIsOpen(true);
            }

            const rawValue = event.target.value;

            if (inputPrefix && rawValue.startsWith(inputPrefix)) {
              setSearchText(rawValue.slice(inputPrefix.length).trimStart());
              return;
            }

            setSearchText(rawValue);
          }}
          onClick={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-label={label}
        />
        <span
          className={`multiselect-checkbox__chevron${isOpen ? " multiselect-checkbox__chevron--open" : ""}`}
          aria-hidden="true"
        />
      </div>
      {isOpen && (
        <div className="multiselect-checkbox__dropdown" role="listbox">
          {showAll ? (
            <div className="multiselect-checkbox__header">
              <strong className="multiselect-checkbox__header-label">
                {showAllLabel}
              </strong>
              <button
                type="button"
                className="button-link govuk-link multiselect-checkbox__header-action"
                onClick={handleSelectAll}
              >
                Show all
              </button>
            </div>
          ) : null}
          <div className="govuk-checkboxes govuk-checkboxes--small multiselect-checkbox__options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div key={option.value} className="govuk-checkboxes__item">
                  <input
                    id={getOptionId(option.value)}
                    className="govuk-checkboxes__input"
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => handleToggle(option.value)}
                  />
                  <label
                    className="govuk-label govuk-checkboxes__label"
                    htmlFor={getOptionId(option.value)}
                  >
                    {option.label}
                  </label>
                </div>
              ))
            ) : (
              <p className="govuk-body-s multiselect-checkbox__empty-state">
                No items found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
