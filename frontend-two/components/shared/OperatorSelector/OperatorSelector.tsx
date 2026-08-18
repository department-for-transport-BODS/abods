import {
  ChangeEvent,
  FocusEvent,
  FormEvent,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./operator-selector.module.scss";
import { clsx } from "clsx";

const ALL_OPERATORS_OPTION = {
  value: "all",
  label: "All operators",
  aliases: ["all"],
};

interface OperatorSelectorProps {
  operators: Array<{
    nocCode?: string | null;
    operatorId?: string | null;
    name?: string | null;
  }>;
  selectedOperatorId: string | null;
  onChange: (operatorId: string | null) => void;
  allowAll?: boolean;
}

export const OperatorSelector = ({
  operators,
  selectedOperatorId,
  onChange,
  allowAll = true,
}: OperatorSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const reactId = useId();
  const panelId = `operator_selector_panel_${reactId.replace(/[:]/g, "")}`;

  const options = useMemo(() => {
    const operatorOptions = operators
      .map((operator) => {
        const value = operator.nocCode ?? operator.operatorId;
        if (!value) return null;
        const label = `${operator.name ?? ""}${operator.nocCode ? ` (${operator.nocCode})` : ""}`;
        const aliases = [operator.nocCode, operator.operatorId].filter(
          (item): item is string => Boolean(item),
        );
        return { value, label, aliases };
      })
      .filter(
        (
          option,
        ): option is { value: string; label: string; aliases: string[] } =>
          Boolean(option),
      );

    return allowAll
      ? [ALL_OPERATORS_OPTION, ...operatorOptions]
      : operatorOptions;
  }, [allowAll, operators]);

  const selectedValueFromQuery = selectedOperatorId ?? (allowAll ? "all" : "");
  const selectedOption =
    options.find((option) => option.value === selectedValueFromQuery) ??
    options.find((option) => option.aliases.includes(selectedValueFromQuery)) ??
    options[0] ??
    (allowAll ? ALL_OPERATORS_OPTION : { value: "", label: "", aliases: [] });
  const selectedValue = selectedOption.value;
  const hasSearchTerm = searchTerm.trim().length > 0;

  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(term),
    );
  }, [options, searchTerm]);

  const selectedIndexInFiltered = Math.max(
    0,
    filteredOptions.findIndex((option) => option.value === selectedValue),
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveIndex(selectedIndexInFiltered);
  }, [isOpen, selectedIndexInFiltered]);

  useEffect(() => {
    if (!isOpen) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, isOpen]);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onChange(value === "all" ? null : value);
  };

  const openDropdown = () => {
    if (!isOpen) {
      setIsOpen(true);
      setActiveIndex(selectedIndexInFiltered);
    }
  };

  const openDropdownFromContainer = () => {
    setIsFocused(true);
    openDropdown();
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const closeDropdown = () => {
    inputRef.current?.blur();
    setIsOpen(false);
    setIsFocused(false);
    setSearchTerm("");
  };

  const handleSelect = (value: string) => {
    onChange(value === "all" ? null : value);
    closeDropdown();
  };

  const moveActiveIndex = (delta: number) => {
    if (filteredOptions.length === 0) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex((current) => {
      const next = current + delta;
      if (next < 0) return 0;
      if (next >= filteredOptions.length) return filteredOptions.length - 1;
      return next;
    });
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        openDropdown();
        return;
      }
      moveActiveIndex(1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        openDropdown();
        return;
      }
      moveActiveIndex(-1);
      return;
    }
    if (event.key === "PageDown" && isOpen) {
      event.preventDefault();
      moveActiveIndex(5);
      return;
    }
    if (event.key === "PageUp" && isOpen) {
      event.preventDefault();
      moveActiveIndex(-5);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (!isOpen) {
        openDropdown();
        return;
      }
      const option = filteredOptions[activeIndex];
      if (option) handleSelect(option.value);
      return;
    }
    if (event.key === "Home" && isOpen) {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === "End" && isOpen) {
      event.preventDefault();
      setActiveIndex(Math.max(filteredOptions.length - 1, 0));
      return;
    }
    if (event.key === "Escape" || event.key === "Tab") {
      closeDropdown();
    }
  };

  const handleInput = (event: FormEvent<HTMLInputElement>) => {
    const value = (event.target as HTMLInputElement).value;
    setSearchTerm(value);
    openDropdown();
    setActiveIndex(0);
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && containerRef.current?.contains(nextTarget)) return;
    closeDropdown();
  };

  const handleContainerMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest(`.${styles.arrowWrapper}`)) return;
    event.preventDefault();
    openDropdownFromContainer();
  };

  if (operators.length === 1) {
    const only = operators[0];
    const noc = only.nocCode ?? only.operatorId ?? "";
    return (
      <div className={clsx(styles.operatorSelector, "govuk-!-margin-bottom-6")}>
        <span className="govuk-caption-l">
          {only.name}
          {noc ? ` (${noc})` : ""}
        </span>
      </div>
    );
  }

  return (
    <div className={clsx(styles.operatorSelector, "govuk-!-margin-bottom-4")}>
      <div className={styles.label}>
        <label
          className="govuk-caption-l govuk-!-margin-bottom-0"
          htmlFor="operator_selector"
        >
          Operator
        </label>
      </div>
      <div ref={containerRef} className={styles.selector} onBlur={handleBlur}>
        <div
          data-labelforid="operator_selector"
          className={clsx(
            styles.gdsSelect,
            isOpen && styles.gdsSelectOpen,
            isFocused && styles.gdsSelectFocused,
            hasSearchTerm && styles.gdsSelectFiltering,
          )}
        >
          <div
            className={styles.container}
            onMouseDown={handleContainerMouseDown}
          >
            <div className={styles.valueContainer}>
              <div
                className={styles.value}
                aria-hidden={hasSearchTerm && isOpen}
              >
                <span>{selectedOption.label}</span>
              </div>
              <div className={styles.input}>
                <input
                  ref={inputRef}
                  id="operator_selector"
                  role="combobox"
                  type="text"
                  value={searchTerm}
                  onInput={handleInput}
                  onFocus={() => {
                    setIsFocused(true);
                    openDropdown();
                  }}
                  onClick={() => openDropdown()}
                  onKeyDown={handleInputKeyDown}
                  autoCorrect="off"
                  autoCapitalize="off"
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  aria-label="Operator"
                  aria-activedescendant={
                    isOpen && filteredOptions[activeIndex]
                      ? `${panelId}-${activeIndex}`
                      : undefined
                  }
                />
              </div>
            </div>
            <span
              className={styles.arrowWrapper}
              onMouseDown={(event) => {
                event.preventDefault();
                if (isOpen) {
                  closeDropdown();
                } else {
                  openDropdownFromContainer();
                }
              }}
            >
              <span className={styles.arrow} />
            </span>
          </div>
          {isOpen ? (
            <div
              id={panelId}
              className={styles.dropdown}
              aria-label="Options List"
              style={{ opacity: 1 }}
            >
              <div role="listbox" className={styles.dropdownItems}>
                {filteredOptions.map((option, index) => (
                  <div
                    key={option.value}
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    id={`${panelId}-${index}`}
                    role="option"
                    aria-selected={option.value === selectedValue}
                    className={clsx(
                      styles.option,
                      option.value === selectedValue && styles.optionSelected,
                      index === activeIndex && styles.optionActive,
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => {
                      // Keep focus on the combobox input until selection is applied.
                      event.preventDefault();
                    }}
                    onClick={() => handleSelect(option.value)}
                  >
                    <span className={styles.optionLabel}>{option.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <select
          id="operator_selector_legacy"
          className="govuk-visually-hidden"
          value={selectedValue}
          onChange={handleChange}
          tabIndex={-1}
          aria-hidden="true"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
