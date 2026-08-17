import styles from "./multiselect-checkbox.module.scss";

import { useCallback, useMemo, useRef, useState } from "react";

interface MultiselectOption {
  label: string;
  value: string;
}

interface MultiselectCheckboxProps {
  id: string;
  label: string;
  labelClassName?: string;
  options: MultiselectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  onShowAll?: () => void;
  showAll?: boolean;
  showAllLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  allowMultiselect?: boolean;
}

export const MultiselectCheckbox = ({
  id,
  label,
  labelClassName,
  options,
  selectedValues,
  onChange,
  onShowAll,
  showAll,
  showAllLabel,
  placeholder,
  disabled = false,
  allowMultiselect = true,
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
      options.filter((option) =>
        option.label.toLowerCase().includes(searchText.toLowerCase()),
      ),
    [options, searchText],
  );

  const normalizedSelectedValues = useMemo(
    () => (allowMultiselect ? selectedValues : selectedValues.slice(-1)),
    [allowMultiselect, selectedValues],
  );

  const allSelected = normalizedSelectedValues.length === 0;
  const hasSelection = normalizedSelectedValues.length > 0;

  const handleToggle = useCallback(
    (value: string) => {
      if (disabled) {
        return;
      }

      if (!allowMultiselect) {
        if (normalizedSelectedValues.includes(value)) {
          onChange([]);
          setIsOpen(false);
          setSearchText("");
          return;
        }

        onChange([value]);
        setIsOpen(false);
        setSearchText("");
        return;
      }

      const newValues = normalizedSelectedValues.includes(value)
        ? normalizedSelectedValues.filter(
            (selectedValue) => selectedValue !== value,
          )
        : [...normalizedSelectedValues, value];

      onChange(newValues);
    },
    [allowMultiselect, disabled, normalizedSelectedValues, onChange],
  );

  const handleSelectAll = useCallback(() => {
    if (disabled) {
      return;
    }

    if (onShowAll) {
      onShowAll();
      if (!allowMultiselect) {
        setIsOpen(false);
        setSearchText("");
      }
      return;
    }

    onChange([]);
    if (!allowMultiselect) {
      setIsOpen(false);
      setSearchText("");
    }
  }, [allowMultiselect, disabled, onChange, onShowAll]);

  const displayText = allSelected
    ? placeholder ?? label
    : normalizedSelectedValues.length === 1
      ? options.find((option) => option.value === normalizedSelectedValues[0])
          ?.label ?? `${normalizedSelectedValues.length} selected`
      : `${normalizedSelectedValues.length} selected`;

  const selectionSummary =
    normalizedSelectedValues.length === 1
      ? options.find((option) => option.value === normalizedSelectedValues[0])
          ?.label ?? `${normalizedSelectedValues.length} selected`
      : `${normalizedSelectedValues.length} selected`;

  const showSelectionSummary = isOpen && hasSelection;
  const inputValue = isOpen ? searchText : displayText;
  const showAllHeader = showAll ?? Boolean(showAllLabel);

  return (
    <div
      ref={containerRef}
      className={`${styles.container}${disabled ? ` ${styles.disabled}` : ""}`}
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget)) {
          setIsOpen(false);
          setSearchText("");
        }
      }}
    >
      <label
        className={`govuk-label${labelClassName ? ` ${labelClassName}` : ""}`}
        htmlFor={id}
      >
        {label}
      </label>

      <div className={styles.triggerWrap}>
        {hasSelection ? (
          <span
            ref={summaryRef}
            className={styles.selectionSummary}
            style={{
              visibility: showSelectionSummary ? "visible" : "hidden",
            }}
          >
            {selectionSummary}
          </span>
        ) : null}

        <input
          ref={inputRef}
          id={id}
          type="text"
          className={`govuk-input ${styles.trigger}${
            !hasSelection && !isOpen ? ` ${styles.triggerPlaceholder}` : ""
          }`}
          style={
            showSelectionSummary && summaryRef.current
              ? {
                  paddingLeft: summaryRef.current.offsetWidth + 16,
                }
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
          className={`${styles.chevron}${
            isOpen ? ` ${styles.chevronOpen}` : ""
          }`}
          aria-hidden="true"
        />

        {isOpen && (
          <div
            className={styles.dropdown}
            role="listbox"
            onMouseDown={(event) => event.preventDefault()}
          >
            {showAllHeader ? (
              <div className={styles.header}>
                {showAllLabel ? (
                  <strong className={styles.headerLabel}>{showAllLabel}</strong>
                ) : null}

                <button
                  type="button"
                  className={`button-link govuk-link ${styles.headerAction}${
                    hasSelection || onShowAll ? "" : " button-link--disabled"
                  }`}
                  onClick={handleSelectAll}
                  disabled={disabled || (!hasSelection && !onShowAll)}
                >
                  Show all
                </button>
              </div>
            ) : null}

            <div
              className={
                allowMultiselect
                  ? `govuk-checkboxes govuk-checkboxes--small ${styles.options}`
                  : styles.optionsSingle
              }
            >
              {filteredOptions.length === 0 ? (
                <p className="govuk-body govuk-!-margin-bottom-0">
                  No items found
                </p>
              ) : (
                filteredOptions.map((option) =>
                  allowMultiselect ? (
                    <div
                      key={option.value}
                      className={`govuk-checkboxes__item ${styles.option}`}
                    >
                      <input
                        id={getOptionId(option.value)}
                        className="govuk-checkboxes__input"
                        type="checkbox"
                        checked={normalizedSelectedValues.includes(
                          option.value,
                        )}
                        onChange={() => handleToggle(option.value)}
                        disabled={disabled}
                      />

                      <label
                        className="govuk-label govuk-checkboxes__label"
                        htmlFor={getOptionId(option.value)}
                      >
                        {option.label}
                      </label>
                    </div>
                  ) : (
                    <button
                      key={option.value}
                      type="button"
                      className={styles.optionButton}
                      onClick={() => handleToggle(option.value)}
                      disabled={disabled}
                      role="option"
                      aria-selected={normalizedSelectedValues.includes(
                        option.value,
                      )}
                    >
                      {option.label}
                    </button>
                  ),
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
