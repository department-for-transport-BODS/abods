import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActionListComponent } from './actionlist.component';
import { ActionListSectionComponent } from './components/actionlist-section/actionlist-section.component';
import { ActionListActionComponent } from './components/actionlist-action/actionlist-action.component';

@NgModule({
  imports: [CommonModule, RouterModule],
  declarations: [ActionListComponent, ActionListSectionComponent, ActionListActionComponent],
  exports: [ActionListComponent, ActionListSectionComponent, ActionListActionComponent],
})
export class ActionListModule {}
