import { FeedTable } from "./FeedTable";

export const FeedSummaryGrid = ({title, active}: {title: string, active: boolean}) => {
    return(
        <div>
            <h2 className="govuk-heading-m">{title}</h2>
            <FeedTable active={active}/>
        </div>
    );
};