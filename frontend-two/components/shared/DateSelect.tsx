// TODO:NOW: Placeholder
export const DateSelect = () => {
    return (
        <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="date-input">
                Date
            </label>
            <input
                className="govuk-input govuk-!-width-full"
                id="date-input"
                name="date-input"   
                type="date"
            />
        </div>
    );
};
