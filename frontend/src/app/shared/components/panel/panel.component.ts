import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { PanelService } from './panel.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DynamicPanelComponentLoaderService } from './dynamic-panel-component-loader.service';
import { DynamicPanelComponentHostDirective } from './dynamic-panel-component-host.directive';

@Component({
  selector: 'app-panel',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.scss'],
  providers: [DynamicPanelComponentLoaderService],
})
export class PanelComponent implements AfterViewInit, OnDestroy {
  @ViewChild('closeButton') closeButton?: ElementRef;
  @ViewChild(DynamicPanelComponentHostDirective, { static: true })
  dynamicComponentHost!: DynamicPanelComponentHostDirective;
  isOpen: Observable<boolean> = this.panelService.isOpen$;

  private destroy$ = new Subject<void>();

  constructor(
    private panelService: PanelService,
    private cd: ChangeDetectorRef,
    private dynamicComponentLoaderService: DynamicPanelComponentLoaderService
  ) {}

  ngAfterViewInit(): void {
    this.panelService.component$.pipe(takeUntil(this.destroy$)).subscribe((component) => {
      if (component) {
        this.dynamicComponentLoaderService.loadComponent(
          component,
          this.dynamicComponentHost.viewContainerRef,
          this.destroy$
        );
        this.cd.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.dynamicComponentLoaderService.destroyComponent();
    this.destroy$.next();
    this.destroy$.complete();
  }

  close() {
    this.panelService.close();
  }
}
