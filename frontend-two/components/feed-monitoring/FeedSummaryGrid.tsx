import { FeedTable } from "./FeedTable";
import { FeedMonitoringOperator } from "@/types/feed-monitoring";

export const FeedSummaryGrid = ({title, active, operators}: {title: string, active: boolean, operators: FeedMonitoringOperator[]}) => {
    return(
        <div>
            <h2 className="govuk-heading-m">{title}</h2>
            <FeedTable active={active} operators={operators} />
        </div>
    );
};