import { Component, OnInit, ViewChild } from '@angular/core';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { PlanGenAssetComponent } from './step-gen-asset';

@Component({
  templateUrl: './gen-planner.component.html',
  styleUrls: ['./gen-planner.component.scss']
})
export class GenPlannerComponent implements OnInit {
  @ViewChild(PlanGenAssetComponent, { static: false })
  private genAssetComponent: PlanGenAssetComponent;

  constructor() {}

  ngOnInit(): void {}

  onStepChange($event: StepperSelectionEvent): void {
    console.log($event);
    if ($event.previouslySelectedIndex === 0) {
      this.genAssetComponent.changeStep();
    }
  }
}
