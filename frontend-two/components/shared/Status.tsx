interface StatusProps {
  active?: boolean;
  size?: "small" | "medium" | "large";
  label?: boolean;
}

export const Status = ({
  active,
  size = "small",
  label = true,
}: StatusProps) => {
  const status = active ? "active" : "inactive";
  const icon = active
    ? "check-in-circle-solid.svg"
    : "cross-in-circle-solid.svg";

  return (
    <div className={`status status--${status} status--${size}`}>
      <img
        className="status__icon"
        src={`/assets/icons/${icon}`}
        alt=""
        aria-hidden="true"
      />
      {label ? (
        <span className="status__label">{status}</span>
      ) : (
        <span className="govuk-visually-hidden">{status}</span>
      )}
    </div>
  );
};
