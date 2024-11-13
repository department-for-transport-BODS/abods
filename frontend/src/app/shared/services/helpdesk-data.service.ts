import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, map, Observable, Subject, takeUntil } from "rxjs";
import { FreshdeskApiService, FreshdeskArticle } from "./freshdesk-api.service";
import { FreshdeskFolders } from "../../../generated/graphql";

export interface HelpdeskData {
  title: string;
  articles: FreshdeskArticle[];
}

@Injectable({
  providedIn: "root",
})
export class HelpdeskDataService implements OnDestroy {
  constructor(private freshdeskApiService: FreshdeskApiService) {}

  private currentHelpdeskData$ = new BehaviorSubject<HelpdeskData | null>(null);
  private destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getHelpdeskData(): Observable<HelpdeskData | null> {
    return this.currentHelpdeskData$.asObservable();
  }

  loadData(folder: keyof FreshdeskFolders, title: string) {
    this.freshdeskApiService
      .getFolder(folder)
      .pipe(
        map((data) => ({ title: title, articles: data })),
        takeUntil(this.destroy$),
      )
      .subscribe((data) => {
        this.currentHelpdeskData$.next(data);
      });
  }
}
