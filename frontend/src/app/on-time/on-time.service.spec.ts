import { createServiceFactory, SpectatorService } from "@ngneat/spectator";
import { ApolloTestingModule } from "apollo-angular/testing";
import { ControlsComponent } from "./controls/controls.component";
import { OnTimeService, TimeOfDayData } from "./on-time.service";
import { OtpThresholdModalComponent } from "./otp-threshold-modal/otp-threshold-modal.component";
import objectContaining = jasmine.objectContaining;

const performance = (
  scheduledDepartures: number,
  actualDepartures: number,
  averageDelay: number,
  early?: number,
  late?: number,
  onTime?: number,
) => ({
  early,
  late,
  onTime,
  total: early ?? 0 + (late ?? 0) + (onTime ?? 0),
  scheduledDepartures,
  actualDepartures,
  averageDelay,
  earlyRatio: 0,
  lateRatio: 0,
  onTimeRatio: 0,
  completedRatio: 0,
});

fdescribe("OnTimeService", () => {
  let spectator: SpectatorService<OnTimeService>;
  const createService = createServiceFactory({
    service: OnTimeService,
    declarations: [ControlsComponent, OtpThresholdModalComponent],
    imports: [ApolloTestingModule],
  });

  beforeEach(() => (spectator = createService()));

  it("should leave empty on-time performance histogram data empty", async () => {
    const actual = spectator.service.fillDelayFrequencyGaps([]);

    await expect(actual.length).toEqual(0);
  });

  it("should fill gaps in on-time performance histogram", async () => {
    await expect(spectator.service).toBeTruthy();
    const incompleteData = [
      { bucket: -5, frequency: 100 },
      { bucket: -3, frequency: 500 },
      { bucket: -2, frequency: 2000 },
      { bucket: -1, frequency: 7000 },
      { bucket: 0, frequency: 15000 },
      { bucket: 1, frequency: 19000 },
      { bucket: 2, frequency: 12000 },
      { bucket: 3, frequency: 9000 },
      { bucket: 4, frequency: 3000 },
      { bucket: 5, frequency: 900 },
      { bucket: 6, frequency: 50 },
      { bucket: 8, frequency: 30 },
      { bucket: 11, frequency: 10 },
      { bucket: 15, frequency: 1 },
    ];

    const actual = spectator.service.fillDelayFrequencyGaps(incompleteData);

    await expect(actual.length).toEqual(21);
    await expect(actual).toContain({ bucket: -4, frequency: 0 });
    await expect(actual).toContain({ bucket: 7, frequency: 0 });
    await expect(actual).toContain({ bucket: 9, frequency: 0 });
    await expect(actual).toContain({ bucket: 10, frequency: 0 });
    await expect(actual).toContain({ bucket: 12, frequency: 0 });
    await expect(actual).toContain({ bucket: 13, frequency: 0 });
    await expect(actual).toContain({ bucket: 14, frequency: 0 });
  });

  it("should not fill gaps in complete on-time performance histogram data", async () => {
    const completeData = [
      { bucket: -5, frequency: 100 },
      { bucket: -4, frequency: 200 },
      { bucket: -3, frequency: 500 },
      { bucket: -2, frequency: 2000 },
      { bucket: -1, frequency: 7000 },
      { bucket: 0, frequency: 15000 },
      { bucket: 1, frequency: 19000 },
      { bucket: 2, frequency: 12000 },
      { bucket: 3, frequency: 9000 },
      { bucket: 4, frequency: 3000 },
      { bucket: 5, frequency: 900 },
    ];

    const actual = spectator.service.fillDelayFrequencyGaps(completeData);

    await expect(actual.length).toEqual(11);
    await expect(actual).toEqual(completeData);
  });

  it("should leave empty time-of-day-data empty", async () => {
    const actual = spectator.service.fillTimeOfDayGaps([]);

    await expect(actual.length).toEqual(0);
  });

  it("should fill gaps in time-of-day punctuality data", async () => {
    const etc = {
      early: 100,
      onTime: 100,
      late: 100,
      total: 300,
      earlyRatio: 1,
      onTimeRatio: 1,
      lateRatio: 1,
      completedRatio: 1,
    };
    const incompleteData: TimeOfDayData[] = [
      { timeOfDay: "06:00", ...etc },
      { timeOfDay: "07:00", ...etc },
      { timeOfDay: "08:00", ...etc },
      { timeOfDay: "09:00", ...etc },
      { timeOfDay: "10:00", ...etc },
      { timeOfDay: "11:00", ...etc },
      { timeOfDay: "12:00", ...etc },
      { timeOfDay: "13:00", ...etc },
      { timeOfDay: "14:00", ...etc },
      { timeOfDay: "15:00", ...etc },
      { timeOfDay: "16:00", ...etc },
      { timeOfDay: "17:00", ...etc },
      { timeOfDay: "18:00", ...etc },
      { timeOfDay: "19:00", ...etc },
      { timeOfDay: "21:00", ...etc },
    ];

    const actual = spectator.service.fillTimeOfDayGaps(incompleteData);

    await expect(actual.length).toEqual(24);
    expect(actual).toContain(
      objectContaining({ timeOfDay: "01:00", noData: 1 }),
    );
    expect(actual).toContain(
      objectContaining({ timeOfDay: "02:00", noData: 1 }),
    );
    expect(actual).toContain(
      objectContaining({ timeOfDay: "03:00", noData: 1 }),
    );
    expect(actual).toContain(
      objectContaining({ timeOfDay: "04:00", noData: 1 }),
    );
    expect(actual).toContain(
      objectContaining({ timeOfDay: "05:00", noData: 1 }),
    );
    expect(actual).toContain(
      objectContaining({ timeOfDay: "20:00", noData: 1 }),
    );
    expect(actual).toContain(
      objectContaining({ timeOfDay: "22:00", noData: 1 }),
    );
    expect(actual).toContain(
      objectContaining({ timeOfDay: "23:00", noData: 1 }),
    );
    expect(actual).toContain(
      objectContaining({ timeOfDay: "00:00", noData: 1 }),
    );
  });

  it("should calculate sum and average total values", async () => {
    const perf = performance(222, 200, 40, 10, 30, 60);
    const actual = OnTimeService.calculateOnTimePcts(perf);

    await expect(actual.early).toBe(10);
    await expect(actual.late).toBe(30);
    await expect(actual.onTime).toBe(60);
    await expect(actual.scheduledDepartures).toBe(222);
    await expect(actual.actualDepartures).toBe(200);
    await expect(actual.averageDelay).toBe(40);
  });

  it("should cope with zeroes when calculating sum and average total values", async () => {
    const perf = performance(0, 0, 0, 0, 0, 0);
    const actual = OnTimeService.calculateOnTimePcts(perf);

    await expect(actual.early).toBe(0);
    await expect(actual.late).toBe(0);
    await expect(actual.onTime).toBe(0);
    await expect(actual.scheduledDepartures).toBe(0);
    await expect(actual.actualDepartures).toBe(0);
    await expect(actual.averageDelay).toBe(0);
  });
});
