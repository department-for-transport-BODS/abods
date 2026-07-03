import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Modal } from "@/components/shared/Modal";

interface DisplayOptionsModalProps {
  open: boolean;
  columnKeys: string[];
  visibleColumns: string[];
  alwaysVisibleKeys?: string[];
  columnLabels?: Record<string, ReactNode>;
  onClose: () => void;
  onApply: (visibleColumns: string[]) => void;
}

export const DisplayOptionsModal = ({
  open,
  columnKeys,
  visibleColumns,
  alwaysVisibleKeys = [],
  columnLabels = {},
  onClose,
  onApply,
}: DisplayOptionsModalProps) => {
  const [draftVisibleColumns, setDraftVisibleColumns] =
    useState<string[]>(visibleColumns);

  useEffect(() => {
    setDraftVisibleColumns(visibleColumns);
  }, [open, visibleColumns]);

  const toggleDraftColumnVisibility = (key: string, visible: boolean) => {
    const isAlwaysVisible = alwaysVisibleKeys.includes(key);
    if (isAlwaysVisible) {
      return;
    }

    setDraftVisibleColumns((current) => {
      if (visible) {
        return current.includes(key) ? current : [...current, key];
      }

      const next = current.filter((columnKey) => columnKey !== key);
      // Ensure at least one always-visible column remains
      const alwaysVisiblePresent = alwaysVisibleKeys.some((k) =>
        next.includes(k),
      );
      return next.length > 0 && alwaysVisiblePresent
        ? next
        : [...alwaysVisibleKeys.filter((k) => columnKeys.includes(k)), ...next];
    });
  };

  const showAllColumns = () => {
    setDraftVisibleColumns(columnKeys);
  };

  const handleApply = () => {
    onApply(draftVisibleColumns);
    onClose();
  };

  const midpoint = Math.ceil(columnKeys.length / 2);

  return (
    <Modal
      open={open}
      title="Display options"
      closeLabel="Close display options"
      showCloseButton={false}
      onClose={onClose}
    >
      <div className="display-options-modal">
        <div
          className="display-options-modal__columns"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
          }}
        >
          <div className="display-options-modal__column govuk-checkboxes govuk-checkboxes--small">
            {columnKeys.slice(0, midpoint).map((key) => {
              const checked = draftVisibleColumns.includes(key);
              const label = columnLabels[key] ?? key;
              const isAlwaysVisible = alwaysVisibleKeys.includes(key);

              return (
                <div
                  key={key}
                  className="govuk-checkboxes__item"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <input
                    className="govuk-checkboxes__input"
                    id={`display-options-column-${key}`}
                    type="checkbox"
                    checked={checked}
                    disabled={isAlwaysVisible}
                    onChange={(event) =>
                      toggleDraftColumnVisibility(key, event.target.checked)
                    }
                  />
                  <label
                    className="govuk-label govuk-checkboxes__label"
                    htmlFor={`display-options-column-${key}`}
                  >
                    {label}
                  </label>
                </div>
              );
            })}
          </div>

          {columnKeys.length > midpoint && (
            <div className="display-options-modal__column govuk-checkboxes govuk-checkboxes--small">
              {columnKeys.slice(midpoint).map((key) => {
                const checked = draftVisibleColumns.includes(key);
                const label = columnLabels[key] ?? key;
                const isAlwaysVisible = alwaysVisibleKeys.includes(key);

                return (
                  <div
                    key={key}
                    className="govuk-checkboxes__item"
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    <input
                      className="govuk-checkboxes__input"
                      id={`display-options-column-${key}`}
                      type="checkbox"
                      checked={checked}
                      disabled={isAlwaysVisible}
                      onChange={(event) =>
                        toggleDraftColumnVisibility(key, event.target.checked)
                      }
                    />
                    <label
                      className="govuk-label govuk-checkboxes__label"
                      htmlFor={`display-options-column-${key}`}
                    >
                      {label}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          className="govuk-link govuk-body govuk-body display-options-modal__show-all-link govuk-!-margin-top-4"
          onClick={showAllColumns}
        >
          Show all
        </button>

        <div className="display-options-modal__footer">
          <button
            type="button"
            className="govuk-button govuk-button--secondary govuk-!-margin-bottom-0"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="govuk-button govuk-!-margin-bottom-0"
            onClick={handleApply}
          >
            Update
          </button>
        </div>
      </div>
    </Modal>
  );
};
