import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DynamicComponent } from './dynamic-panel-component-loader.service';

@Injectable({
  providedIn: 'root',
})
export class PanelService {
  private componentSubject = new BehaviorSubject<DynamicComponent | null>(null);
  component$: Observable<DynamicComponent | null> = this.componentSubject.asObservable();

  private isOpenSubject = new BehaviorSubject<boolean>(false);
  isOpen$: Observable<boolean> = this.isOpenSubject.asObservable();

  setComponent(content: DynamicComponent) {
    this.componentSubject.next(content);
  }

  toggle() {
    if (this.isOpenSubject.value) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpenSubject.next(true);
  }

  close() {
    this.isOpenSubject.next(false);
  }

  destroy() {
    this.close();
    this.componentSubject.next(null);
  }
}
