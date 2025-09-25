import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LayoutModule } from "../layout/layout.module";

import { NO_ERRORS_SCHEMA } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ApolloTestingModule } from "apollo-angular/testing";
import { CorridorsComponent } from "./corridors.component";
import { CorridorsGridComponent } from "./grid/corridors-grid.component";

fdescribe("CorridorsComponent", () => {
  let component: CorridorsComponent;
  let fixture: ComponentFixture<CorridorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CorridorsGridComponent],
      imports: [LayoutModule, RouterModule.forRoot([]), ApolloTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CorridorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });
});
