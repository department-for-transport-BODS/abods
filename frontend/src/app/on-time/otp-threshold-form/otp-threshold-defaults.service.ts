import { Injectable } from '@angular/core';
import { ConfigService } from '../../config/config.service';

enum OtpThresholdKey {
  Early = 'otpCompareThresholdEarly',
  Late = 'otpCompareThresholdLate',
}

@Injectable({
  providedIn: 'root',
})
export class OtpThresholdDefaultsService {
  get early(): number {
    return this.getFromLocalStorage(OtpThresholdKey.Early);
  }
  set early(value: number) {
    this.setLocalStorage(OtpThresholdKey.Early, value);
  }

  get late(): number {
    return this.getFromLocalStorage(OtpThresholdKey.Late);
  }
  set late(value: number) {
    this.setLocalStorage(OtpThresholdKey.Late, value);
  }

  constructor(private configService: ConfigService) {}

  /**
   * Sets all corridor boxplot chart hide outlier checkboxes to false
   */
  resetAll() {
    this.clearLocalStorage();
  }

  private getFromLocalStorage(key: OtpThresholdKey): number {
    const item = localStorage.getItem(key);
    if (item !== null) {
      try {
        const value = JSON.parse(item) as number;
        return value;
      } catch {
        return this.returnDefaults(key);
      }
    }
    return this.returnDefaults(key);
  }

  private returnDefaults(key: OtpThresholdKey) {
    if (key === OtpThresholdKey.Early) {
      return this.configService.otp.early;
    } else {
      return this.configService.otp.late;
    }
  }

  private setLocalStorage(key: string, value: number) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  private clearLocalStorage() {
    localStorage.removeItem(OtpThresholdKey.Early);
    localStorage.removeItem(OtpThresholdKey.Late);
  }
}
