import { DayOfWeekFlagsInputType } from "../../../../generated/graphql";

export const getDefaultDayOfWeekFlags = (): DayOfWeekFlagsInputType => ({
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: true,
  sunday: true,
});
