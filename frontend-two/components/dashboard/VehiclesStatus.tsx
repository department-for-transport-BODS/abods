import { Box } from "@/components/shared/Box";
import { Stat } from "@/components/shared/Stat";
import { LinkWithArrow } from "@/components/shared/LinkWithArrow";

interface VehiclesStatusProps {
  actual: number;
  expected: number;
  nocCode: string | null;
}

export const VehiclesStatus = ({
  actual,
  expected,
  nocCode,
}: VehiclesStatusProps) => {
  const liveStatusHref = nocCode
    ? `/feed-monitoring/${nocCode}`
    : "/feed-monitoring";

  return (
    <Box className="app-vehicles-status">
      <h2 className="govuk-heading-m">Vehicle count</h2>
      <div className="vehicles-status__stats">
        <Stat
          label="Current"
          value={actual}
          id="vehicle-status-current"
          className="vehicles-status__current-stat"
          tooltip="Current number of vehicles running that we can match to the schedules that have been provided"
        />
        <Stat
          label="Expected"
          value={expected}
          id="vehicle-status-expected"
          className="vehicles-status__expected-stat"
          tooltip="The number of vehicles that should be running now according to the timetables provided"
        />
      </div>
      <div className="vehicles-status__footer">
        <LinkWithArrow href={liveStatusHref}>Live status</LinkWithArrow>
      </div>
    </Box>
  );
};
