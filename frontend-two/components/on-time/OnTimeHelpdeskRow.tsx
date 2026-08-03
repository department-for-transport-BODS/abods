import { OnTimeHelpdeskButton } from "@/components/on-time/OnTimeHelpdesk/OnTimeHelpdeskButton";
import { OtpThresholdModalLink } from "@/components/on-time/OtpThreshold/OtpThresholdModalLink";
import type {
  PerformanceParams,
  PunctualityOverview,
} from "@/services/on-time/on-time.service";

interface OnTimeHelpdeskRowProps {
  params: PerformanceParams | null;
  overview?: PunctualityOverview | null;
}

export const OnTimeHelpdeskRow = ({
  params,
  overview,
}: OnTimeHelpdeskRowProps) => (
  <div className="helpdesk-container">
    <OnTimeHelpdeskButton />
    <OtpThresholdModalLink params={params} overview={overview} />
  </div>
);
