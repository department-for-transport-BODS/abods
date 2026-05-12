// TODO:NOW Look to get rid of this and just use the FeedTable component
import { FeedTable } from "./FeedTable";
import { FeedMonitoringOperatorData } from "@/types/feed-monitoring";

export const FeedSummaryGrid = ({title, active, data}: {title: string, active: boolean, data: FeedMonitoringOperatorData[]}) => {
    return(
        <div>
            <h2 className="govuk-heading-m">{title}</h2>
            <FeedTable active={active} data={data} />
        </div>
    );
};