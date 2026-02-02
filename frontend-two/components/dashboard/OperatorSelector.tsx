import { ChangeEvent } from "react";
import { OperatorDashboard } from "@/types/dashboard";

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
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onChange(value === "all" ? null : value);
  };

  return (
    <div className="govuk-form-group">
      <label className="govuk-label" htmlFor="operator-selector">
        Operator
      </label>
      <select
        id="operator-selector"
        className="govuk-select"
        value={selectedOperatorId ?? "all"}
        onChange={handleChange}
      >
        <option value="all">All operators</option>
        {operators.map((operator) => (
          <option key={operator.operatorId} value={operator.operatorId}>
            {operator.name}
          </option>
        ))}
      </select>
    </div>
  );
};
