import styles from "./loading-dots.module.scss";

export const LoadingDots = () => (
  <span role="status" aria-live="polite">
    <span className="govuk-visually-hidden">Loading...</span>
    <span className={styles.dots} aria-hidden="true">
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </span>
  </span>
);
