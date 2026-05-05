import { useState } from "react";
import { PagingPanel } from "../shared/PagingPanel";

const PAGE_SIZE = 25;

export const FeedTable = ({ active }: { active: boolean }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const totalPages = 10; // TODO: calculate based on data

     return (
        <>
            <table className="govuk-table">
                <thead className="govuk-table__head">
                    <tr className="govuk-table__row">
                        <th scope="col" className="govuk-table__header"></th>
                        <th scope="col" className="govuk-table__header">NOC</th>
                        <th scope="col" className="govuk-table__header">Operator</th>
                        <th scope="col" className="govuk-table__header">Feed availability</th>
                        <th scope="col" className="govuk-table__header">Update frequency</th>
                        <th scope="col" className="govuk-table__header"> {active ? "Last outage" : "Unavailable since"}</th>
                        <th scope="col" className="govuk-table__header"></th>
                    </tr>
                </thead>
                <tbody className="govuk-table__body">
                    <tr className="govuk-table__row">
                        {/* TODO: Add colour to icons */}
                        {/* TODO: Figure out how to populate tables with data */}
                        {/* TODO: Figure out how to add graph in table and what the graph is */}
                        {/* TODO: Add sorting to the column headings */}
                        {/* TODO: Add pages that link to the Operator names in the columns */}
                        <td className="govuk-table__cell">{active ? <img src="/assets/icons/check-in-circle-solid.svg" /> : <img src="/assets/icons/cross-in-circle-solid.svg" />}</td>
                        <td className="govuk-table__cell">XXXX</td>
                        <td className="govuk-table__cell">XXXX</td>
                        <td className="govuk-table__cell">XXXX</td>
                        <td className="govuk-table__cell">XXXX</td>
                        <td className="govuk-table__cell">XXXX</td>
                    </tr>
                </tbody>
            </table>
            <div className="flex justify-end">
                <div className="w-1/3">
                    <PagingPanel
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={PAGE_SIZE}
                        rowCount={totalPages * PAGE_SIZE} // TODO: calculate based on data
                        noun="feed"
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
        </>
    );
}