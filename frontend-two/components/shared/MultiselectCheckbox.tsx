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
  onShowAll?: () => void;
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
  onShowAll,
  showAll = true,
  showAllLabel = "All",
  placeholder,
  disabled = false,
}: MultiselectCheckboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      onChange(newValues);
    },
    [selectedValues, onChange],
  );

  const handleSelectAll = useCallback(() => {
    if (onShowAll) {
      onShowAll();
      return;
    }
    onChange([]);
  }, [onChange, onShowAll]);

  const displayText = allSelected
    ? placeholder ?? label
    : selectedValues.length === 1
      ? options.find((o) => o.value === selectedValues[0])?.label ??
        `${selectedValues.length} selected`
      : `${selectedValues.length} selected`;

  const selectionSummary =
    selectedValues.length === 1
      ? options.find((o) => o.value === selectedValues[0])?.label ??
        `${selectedValues.length} selected`
      : `${selectedValues.length} selected`;
  const showSelectionSummary = isOpen && hasSelection;

  const inputValue = isOpen ? searchText : displayText;

  return (
    <div
      ref={containerRef}
      className="multiselect-checkbox"
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget)) {
          setIsOpen(false);
          setSearchText("");
        }
      }}
    >
      <label className="govuk-label" htmlFor={id}>
        {label}
      </label>
      <div className="multiselect-checkbox__trigger-wrap">
        {hasSelection ? (
          <span
            ref={summaryRef}
            className="multiselect-checkbox__selection-summary"
            style={{ visibility: showSelectionSummary ? "visible" : "hidden" }}
          >
            {selectionSummary}
          </span>
        ) : null}
        <input
          ref={inputRef}
          id={id}
          type="text"
          className="multiselect-checkbox__trigger govuk-input"
          style={
            showSelectionSummary && summaryRef.current
              ? { paddingLeft: summaryRef.current.offsetWidth + 16 }
              : undefined
          }
          value={inputValue}
          onMouseDown={(event) => {
            if (disabled || isOpen) {
              return;
            }
            event.preventDefault();
            setIsOpen(true);
            requestAnimationFrame(() => {
              inputRef.current?.focus();
            });
          }}
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

            setSearchText(event.target.value);
          }}
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
        <div
          className="multiselect-checkbox__dropdown"
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
        >
          {showAll ? (
            <div className="multiselect-checkbox__header">
              <strong className="multiselect-checkbox__header-label">
                {showAllLabel}
              </strong>
              <button
                type="button"
                className={`button-link govuk-link multiselect-checkbox__header-action${
                  hasSelection || onShowAll ? "" : " button-link--disabled"
                }`}
                onClick={handleSelectAll}
                disabled={!hasSelection && !onShowAll}
              >
                Show all
              </button>
            </div>
          ) : null}
          <div className="govuk-checkboxes govuk-checkboxes--small multiselect-checkbox__options">
            {filteredOptions.map((option) => (
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
