interface SearchInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  testId?: string;
  widthClassName?: string;
  containerClassName?: string;
}

export const SearchInput = ({
  id,
  label,
  value,
  onChange,
  testId,
  widthClassName = "govuk-input--width-20",
  containerClassName = "govuk-form-group",
}: SearchInputProps) => {
  return (
    <div className={containerClassName}>
      <label className="govuk-label" htmlFor={id}>
        {label}
      </label>
      <input
        className={`govuk-input ${widthClassName}`}
        id={id}
        data-testid={testId}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
};