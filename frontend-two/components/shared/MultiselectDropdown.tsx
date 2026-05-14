import { useEffect, useRef, useState } from "react";
import { MultiselectDropdownProps } from "@/types";

export const MultiselectDropdown = ({
    label,
    options,
    selected,
    onChange,
    placeholder,
}: MultiselectDropdownProps) => {
    const [open, setOpen] = useState(false);
    
    const hasSelected = selected.length > 0;

    const ref = useRef<HTMLDivElement>(null);

    const [search, setSearch] = useState("");
    const filteredOptions = options.filter((option) =>
        option.toLowerCase().includes(search.toLowerCase())
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

    const toggleOption = (option: string) => {
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

    const displayText = 
        selected.length === 0 
        ? placeholder 
        : selected.length === 1
            ? selected[0]
            : `${selected.length} selected`;

    return (
        <div className="govuk-form-group multiselect-dropdown" ref={ref}>
            <label className="govuk-label">{label}</label>
            {open ? (
                <input
                    type="text"
                    className="multiselect-dropdown__button multiselect-dropdown__search-text"
                    placeholder="Search here"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                />
            ) : (
                <button
                    type="button"
                    className="multiselect-dropdown__button"
                    onClick={() => setOpen(true)}
                >
                    <span className="multiselect-dropdown__button-text">{displayText}</span>
                    <span>▼</span>
                </button>
            )}
            {open && (
                <div className="multiselect-dropdown__panel">
                    <div className="multiselect-dropdown__header"> 
                        <div className="govuk-body multiselect-dropdown__header-label font-bold">{label}</div>
                        <button
                            type="button"
                            className="govuk-link"
                            onClick={toggleAllOptions}
                        >
                            {hasSelected ? "Clear all" : "Show all"}
                        </button>
                    </div>
                    <div className="govuk-checkboxes">
                        {filteredOptions.map((option, idx) => (
                            <div className="govuk-checkboxes__item" key={`${option}-${idx}`}>
                            <input
                                className="govuk-checkboxes__input"
                                type="checkbox"
                                checked={selected.includes(option)}
                                onChange={() => toggleOption(option)}
                                id={`checkbox-${option}`}
                            />
                            <label className="govuk-label govuk-checkboxes__label" htmlFor={`checkbox-${option}`}>
                                {option}
                            </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};