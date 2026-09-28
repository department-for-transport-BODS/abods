interface Props {
  open: boolean;
  corridorName: string;
  isDeleting: boolean;
  onCancel: () => void;
  onDelete: () => void;
}

export const DeleteCorridorModal = ({
  open,
  corridorName,
  isDeleting,
  onCancel,
  onDelete,
}: Props) => {
  if (!open) return null;

  return (
    <div className="govuk-inset-text" role="alert" aria-live="polite">
      <h2 className="govuk-heading-m govuk-!-margin-bottom-2">
        Delete corridor?
      </h2>
      <p className="govuk-body">
        Are you sure you want to delete the corridor{" "}
        <strong>{corridorName}</strong>? This operation cannot be undone.
      </p>
      <div className="govuk-button-group">
        <button
          type="button"
          className="govuk-button govuk-button--secondary"
          data-module="govuk-button"
          onClick={onCancel}
          disabled={isDeleting}
        >
          Cancel
        </button>
        <button
          type="button"
          className="govuk-button govuk-button--warning"
          data-module="govuk-button"
          onClick={onDelete}
          disabled={isDeleting}
        >
          Delete corridor
        </button>
      </div>
    </div>
  );
};
