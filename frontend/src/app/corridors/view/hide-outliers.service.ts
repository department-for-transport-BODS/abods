import { Injectable } from '@angular/core';

enum HideOutlierKey {
  JourneyTime = 'hideOutliersJourneyTime',
  TimeOfDay = 'hideOutliersTimeOfDay',
  DayOfWeek = 'hideOutliersDayOfWeek',
}

@Injectable({
  providedIn: 'root',
})
export class HideOutliersService {
  get hideOutliersJourneyTime(): boolean {
    return this.getFromLocalStorage(HideOutlierKey.JourneyTime);
  }
  set hideOutliersJourneyTime(value: boolean) {
    this.setLocalStorage(HideOutlierKey.JourneyTime, value);
  }

  get hideOutliersTimeOfDay(): boolean {
    return this.getFromLocalStorage(HideOutlierKey.TimeOfDay);
  }
  set hideOutliersTimeOfDay(value: boolean) {
    this.setLocalStorage(HideOutlierKey.TimeOfDay, value);
  }

  get hideOutliersDayOfWeek(): boolean {
    return this.getFromLocalStorage(HideOutlierKey.DayOfWeek);
  }
  set hideOutliersDayOfWeek(value: boolean) {
    this.setLocalStorage(HideOutlierKey.DayOfWeek, value);
  }

  /**
   * Sets all corridor boxplot chart hide outlier checkboxes to false
   */
  resetAll() {
    this.clearLocalStorage();
  }

  private getFromLocalStorage(key: HideOutlierKey): boolean {
    const item = localStorage.getItem(key);
    if (item !== null) {
      try {
        const value = JSON.parse(item) as boolean;
        return value;
      } catch {
        return false;
      }
    }
    return false;
  }

  private setLocalStorage(key: string, value: boolean) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  private clearLocalStorage() {
    localStorage.removeItem(HideOutlierKey.JourneyTime);
    localStorage.removeItem(HideOutlierKey.DayOfWeek);
    localStorage.removeItem(HideOutlierKey.TimeOfDay);
  }
}
