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
import { OperatorDashboard } from "@/types/dashboard";

const ALL_OPERATORS_OPTION = { value: "all", label: "All operators", aliases: ["all"] };

interface OperatorSelectorProps {
  operators: OperatorDashboard[];
  selectedOperatorId: string | null;
  onChange: (operatorId: string | null) => void;
}

export const OperatorSelector = ({
  operators,
  selectedOperatorId,
  onChange,
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

  const options = useMemo(
    () => [
      ALL_OPERATORS_OPTION,
      ...operators.map((operator) => {
        const value = operator.nocCode ?? operator.operatorId;
        const label = `${operator.name}${operator.nocCode ? ` (${operator.nocCode})` : ""}`;
        const aliases = [operator.nocCode, operator.operatorId].filter(
          (item): item is string => Boolean(item),
        );
        return { value, label, aliases };
      }),
    ],
    [operators],
  );

  const selectedValueFromQuery = selectedOperatorId ?? "all";
  const selectedOption =
    options.find((option) => option.value === selectedValueFromQuery) ??
    options.find((option) => option.aliases.includes(selectedValueFromQuery)) ??
    ALL_OPERATORS_OPTION;
  const selectedValue = selectedOption.value;
  const hasSearchTerm = searchTerm.trim().length > 0;

  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => option.label.toLowerCase().includes(term));
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
        setIsOpen(false);
        setIsFocused(false);
        setSearchTerm("");
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
    if (target.closest(".ng-arrow-wrapper")) return;
    event.preventDefault();
    openDropdownFromContainer();
  };

  if (operators.length === 1) {
    const only = operators[0];
    const noc = only.nocCode ?? only.operatorId ?? "";
    return (
      <div className="operator-selector app-operator-selector govuk-!-margin-bottom-6">
        <span className="govuk-caption-l">
          {only.name}
          {noc ? ` (${noc})` : ""}
        </span>
      </div>
    );
  }

  return (
    <div className="operator-selector app-operator-selector govuk-!-margin-bottom-6">
      <div className="operator-selector__label">
        <label
          className="govuk-caption-l govuk-!-margin-bottom-0"
          htmlFor="operator_selector"
        >
          Operator
        </label>
      </div>
      <div
        ref={containerRef}
        className="operator-selector__selector"
        onBlur={handleBlur}
      >
        <div
          data-labelforid="operator_selector"
          className={`gds-select operator-select ng-select ng-select-single ng-select-searchable ng-untouched ng-pristine ng-valid ${
            isOpen ? "ng-select-opened ng-select-bottom" : ""
          } ${isFocused ? "ng-select-focused" : ""} ${
            hasSearchTerm ? "ng-select-filtering" : ""
          }`}
        >
          <div
            className={`ng-select-container ${selectedValue ? "ng-has-value" : ""}`}
            onMouseDown={handleContainerMouseDown}
          >
            <div className="ng-value-container">
              <div className="ng-value" aria-hidden={hasSearchTerm && isOpen}>
                <span className="ng-value-label">{selectedOption.label}</span>
              </div>
              <div className="ng-input">
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
                  aria-activedescendant={
                    isOpen && filteredOptions[activeIndex]
                      ? `${panelId}-${activeIndex}`
                      : undefined
                  }
                />
              </div>
            </div>
            <span
              className="ng-arrow-wrapper"
              onMouseDown={(event) => {
                event.preventDefault();
                if (isOpen) {
                  closeDropdown();
                } else {
                  openDropdownFromContainer();
                }
              }}
            >
              <span className="ng-arrow" />
            </span>
          </div>
          {isOpen ? (
            <div
              id={panelId}
              className="ng-dropdown-panel ng-select-bottom"
              aria-label="Options List"
              style={{ opacity: 1 }}
            >
              <div role="listbox" className="ng-dropdown-panel-items scroll-host">
                {filteredOptions.map((option, index) => (
                  <div
                    key={option.value}
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    id={`${panelId}-${index}`}
                    role="option"
                    aria-selected={option.value === selectedValue}
                    className={`ng-option ${
                      option.value === selectedValue ? "ng-option-selected" : ""
                    } ${index === activeIndex ? "ng-option-marked" : ""}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => {
                      // Keep focus on the combobox input until selection is applied.
                      event.preventDefault();
                    }}
                    onClick={() => handleSelect(option.value)}
                  >
                    <span className="ng-option-label">{option.label}</span>
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
