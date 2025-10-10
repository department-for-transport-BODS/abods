import {
  byTextContent,
  createComponentFactory,
  Spectator,
} from "@ngneat/spectator";
import { StatComponent } from "src/app/shared/components/stat/stat.component";
import { SharedModule } from "src/app/shared/shared.module";
import { OtpStatsComponent } from "./otp-stats.component";
import { MatchType, OtpEnum } from "../../../../generated/graphql";

const mockStops = [
  // 8 on time, 1 early, 0 late, 7 no data (total 16)
  ...Array(8).fill({
    isTimingPoint: true,
    otp: OtpEnum.OnTime,
    setDown: true,
    incompleteReason: 0,
  }),
  {
    isTimingPoint: true,
    otp: OtpEnum.Early,
    setDown: true,
    incompleteReason: 0,
  },
  ...Array(7).fill({
    isTimingPoint: true,
    otp: null,
    setDown: true,
    incompleteReason: 1,
  }),
];

const mockView = {
  stops: mockStops,
  avls: [],
};

describe("OtpStatsComponent", () => {
  let spectator: Spectator<OtpStatsComponent>;
  let component: OtpStatsComponent;

  const createComponent = createComponentFactory({
    component: OtpStatsComponent,
    imports: [SharedModule],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { view: mockView, loading: false, matchType: MatchType.Evidenced },
    });
    component = spectator.component;
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should display correct metrics", () => {
    // 8/9 on time, 0/9 late, 1/9 early, 7/16 incomplete
    expect(
      spectator.query(byTextContent("88.89%", { selector: ".stat__value" })),
    ).toBeVisible();

    expect(
      spectator.query(byTextContent("0.00%", { selector: ".stat__value" })),
    ).toBeVisible();

    expect(
      spectator.query(byTextContent("11.11%", { selector: ".stat__value" })),
    ).toBeVisible();

    expect(
      spectator.query(byTextContent("43.75%", { selector: ".stat__value" })),
    ).toBeVisible();
  });

  it("should display correct tooltips", () => {
    const stats = component.calculated;
    expect(spectator.queryAll(StatComponent)[0].tooltip).toEqual(
      `${stats.onTime} of ${stats.completed} recorded stop departures were between 1 minute early and 5 minutes 59 seconds late.`,
    );

    expect(spectator.queryAll(StatComponent)[1].tooltip).toEqual(
      `${stats.late} of ${stats.completed} recorded stop departures were more than 5 minutes 59 seconds late.`,
    );

    expect(spectator.queryAll(StatComponent)[2].tooltip).toEqual(
      `${stats.early} of ${stats.completed} recorded stop departures were more than 1 minute early.`,
    );

    // The last stat uses a tooltip template, so we check the rendered text
    const incompleteText = spectator.queryAll(".vehicle-journeys__otp-stat")[3]
      .textContent;
    expect(incompleteText).toContain(
      `${stats.noData} of ${stats.total} stop departures have limited or missing real-time data so we are unable to calculate an accurate on-time performance figure.`,
    );
  });

  it("should show breakdown in incomplete tooltip if incomplete reasons exist", () => {
    // Add a second incomplete reason
    const stops = [
      ...mockStops,
      {
        isTimingPoint: true,
        otp: null,
        setDown: true,
        incompleteReason: 2,
      },
    ];
    spectator.setInput("view", { stops });
    spectator.detectChanges();

    const stats = component.calculated;
    const incompleteText = spectator.queryAll(".vehicle-journeys__otp-stat")[3]
      .textContent;
    expect(incompleteText).toContain(
      `${stats.noData} of ${stats.total} stop departures have limited or missing real-time data so we are unable to calculate an accurate on-time performance figure.`,
    );
    // Should mention the breakdown
    expect(incompleteText).toContain("Of these, there are:");
  });
});
