import { sessionStore, userStore } from "@/utils/storage";
import { resetOtpThresholdDefaults } from "@/components/on-time/OtpThreshold/otpThresholdDefaults";
import { clearCorridorHideOutliersStorage } from "@/hooks/useCorridorHideOutliers";

export const clearUserScopedStorage = (): void => {
  sessionStore.clear();
  userStore.clear();
  resetOtpThresholdDefaults();
  clearCorridorHideOutliersStorage();
};
