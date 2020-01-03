import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  GenerationListDetailComponent,
  GenListDetailResolverService
} from './generation-list-detail';
import {
  GenListResolverService,
  GenerationListComponent
} from './generation-list';
import {
  PlanGenResolverService,
  PlanGenAssetComponent,
  GenPlannerComponent
} from './generation-planner';
import { PlanTrigActionComponent } from './generation-planner/step-trig-action/step-trig-action.component';
import { PlanSchedTaskComponent } from './generation-planner/step-schedule-task/step-sched-task.component';
import { ActionItemManagerComponent } from './action-item-manager/action-item-manager.component';
import { ActionItemResolverService } from './action-item-manager/action-item-manager-resolver.service';
import { ActionItemDetailDialogComponent } from './action-item-manager';
import { PlanTaskLineUpComponent } from './generation-planner/step-task-lineup/step-task-lineup.component';

const routes: Routes = [
  {
    path: 'aagt',
    redirectTo: '/aagt/generations',
    pathMatch: 'full'
  },
  {
    path: 'generations',
    component: GenerationListComponent,
    resolve: { generationList: GenListResolverService }
  },
  {
    path: 'generations/:id',
    component: GenerationListDetailComponent,
    resolve: { generation: GenListDetailResolverService }
  },
  {
    path: 'plan-generation',
    pathMatch: 'full',
    redirectTo: 'plan-generation/new'
  },
  {
    path: 'plan-generation/:id',
    component: GenPlannerComponent,
    resolve: { generation: PlanGenResolverService }
  },
  {
    path: 'action-items',
    component: ActionItemManagerComponent,
    resolve: { resolvedData: ActionItemResolverService }
  }
];
export const routedComponents = [
  ActionItemManagerComponent,
  ActionItemDetailDialogComponent,
  GenerationListComponent,
  GenerationListDetailComponent,
  GenPlannerComponent,
  PlanGenAssetComponent,
  PlanTrigActionComponent,
  PlanSchedTaskComponent,
  PlanTaskLineUpComponent
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AagtRoutingModule {}
