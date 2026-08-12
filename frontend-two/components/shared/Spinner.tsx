interface SpinnerProps {
  size?: "default" | "small" | "x-small";
  message?: string;
}

export const Spinner = ({ size = "x-small", message }: SpinnerProps) => (
  <div
    className={`spinner spinner--${size}`}
    {...(message
      ? { role: "alert", "aria-busy": true }
      : { "aria-hidden": true })}
  >
    <svg
      className="spinner__icon"
      viewBox="0 0 50 50"
      focusable="false"
      aria-hidden="true"
    >
      <circle
        className="spinner__dot1"
        cx="15"
        cy="25"
        r="5"
        fill="currentColor"
      />
      <circle
        className="spinner__dot2"
        cx="25"
        cy="25"
        r="5"
        fill="currentColor"
      />
      <circle
        className="spinner__dot3"
        cx="35"
        cy="25"
        r="5"
        fill="currentColor"
      />
    </svg>
    {message ? <span className="spinner__message">{message}</span> : null}
  </div>
);
