import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface PageHeaderBanner {
  title: string;
  id: string;
  message: string;
  dismissable?: boolean;
  success?: boolean;
  onDismiss: () => void;
}

@Injectable({
  providedIn: 'root',
})
export class PageHeaderBannerService {
  private _banner$ = new Subject<PageHeaderBanner | null>();

  get banner$(): Observable<PageHeaderBanner | null> {
    return this._banner$.asObservable();
  }

  setBanner(banner: PageHeaderBanner) {
    this._banner$.next(banner);
  }

  clearBanner() {
    this._banner$.next(null);
  }
}
