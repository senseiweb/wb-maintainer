import {
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { PlanGenAssetComponent } from './step-gen-asset';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import * as _l from 'lodash';
import * as _m from 'moment';
import {
  AagtUowService,
  Generation,
  GenerationAsset,
  TriggerAction,
  AssetTriggerAction
} from '../aagt-core';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { PlanGenResolvedData } from './gen-planner-resolver.service';
import { PlanSchedTaskComponent } from './step-schedule-task/step-sched-task.component';
import { IEntityPropertyChange, IEntityChangedEvent } from '@app_types';
import { PlanTaskLineUpComponent } from './step-task-lineup/step-task-lineup.component';

@Component({
  templateUrl: './gen-planner.component.html',
  styleUrls: ['./gen-planner.component.scss']
})
export class GenPlannerComponent implements OnInit, OnDestroy {
  private debouncedReplan = _l.debounce(this.replanTasks, 2500);

  @ViewChild(PlanGenAssetComponent, { static: false })
  private genAssetComponent: PlanGenAssetComponent;

  @ViewChild(PlanSchedTaskComponent, { static: false })
  private schedTaskComponent: PlanSchedTaskComponent;

  @ViewChild(PlanTaskLineUpComponent, { static: false })
  private taskLineupComponent: PlanTaskLineUpComponent;

  private unsubscribe: Subject<any>;
  private modelWatcherId: string;
  private generation: Generation;

  constructor(private route: ActivatedRoute, private uow: AagtUowService) {
    this.unsubscribe = new Subject();
  }

  ngOnInit(): void {
    const genRouteData = this.route.snapshot.data
      .generation as PlanGenResolvedData;
    this.generation = genRouteData[0];
    this.watchModelChanges();
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  addAtaByEntity(entity: TriggerAction | GenerationAsset): void {
    if (entity.shortname === 'triggerAction') {
      this.generation.generationAssets.forEach(genAsset => {
        genAsset.createChild('assetTriggerAction', {
          triggerAction: entity,
          sequence: entity.sequence
        });
      });
    } else {
      const trigActs = _l.flatMap(
        this.generation.triggers,
        x => x.triggerActions
      );

      trigActs.forEach(ta => {
        ta.createChild('assetTriggerAction', {
          generationAsset: entity,
          sequence: ta.sequence
        });
      });
    }
    this.debouncedReplan();
  }

  deleteAtaByEntity(entity: TriggerAction | GenerationAsset): void {
    const filter: keyof AssetTriggerAction =
      entity.shortname === 'triggerAction'
        ? 'triggerActionId'
        : 'generationAssetId';
    const ophranTasks = this.generation.prioritizedATAs.filter(
      pata => pata[filter] === entity.id
    );
    ophranTasks.forEach(ata => ata.entityAspect.setDeleted());
    this.debouncedReplan();
  }

  onStepChange($event: StepperSelectionEvent): void {
    console.log($event);
    if ($event.previouslySelectedIndex === 0) {
      this.genAssetComponent.changeStep();
    }
  }

  replanTasks(): void {
    if (!this.generation.prioritizedATAs.length) {
      return;
    }

    this.setAtaPlanDates();
    this.schedTaskComponent.updateGanttData();
  }

  setAtaPlanDates(): void {
    const triggers = _l.sortBy(this.generation.triggers, x => x.triggerStart);

    const genAssets = _l.sortBy(
      this.generation.generationAssets,
      x => x.mxPosition
    );

    for (const trig of triggers) {
      for (const genAsset of genAssets) {
        const ataTasks = this.generation.prioritizedATAs.filter(
          pata =>
            pata.triggerAction.triggerId === trig.id &&
            pata.generationAssetId === genAsset.id
        );

        let endOfLastTask: _m.Moment;

        for (const task of ataTasks) {
          task.plannedStart = endOfLastTask
            ? _m(endOfLastTask)
                .add(30, 'm')
                .toDate()
            : trig.triggerStart;
          endOfLastTask = _m(task.plannedStart).add(
            task.triggerAction.actionItem.duration,
            'm'
          );
          task.plannedStop = endOfLastTask.toDate();
          console.log(task.plannedStart, task.plannedStop);
        }
      }
    }
  }

  updateTaskSchedGantt($event: any): void {
    const schedTaskData = this.uow.flattenGenerationTask(this.generation);
    // this.schedTaskComponent.schedGanttTasks = schedTaskData.tasks;
    this.schedTaskComponent.schedTaskCompCdRef.markForCheck();
  }

  watchModelChanges(): void {
    this.uow.entityManager
      .onModelChanges('triggerAction', 'PropertyChange', 'sequence')
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(chngArgs => {
        const trigAct = chngArgs.entity;
        const args = (chngArgs as IEntityChangedEvent<
          any,
          'triggerAction',
          'PropertyChange',
          'sequence'
        >).args;

        for (const ata of trigAct.assetTriggerActions) {
          if (!ata.sequence || ata.sequence === args.oldValue) {
            ata.sequence = args.newValue;
          }
        }

        this.debouncedReplan();
      });

    this.uow.entityManager
      .onModelChanges(['generationAsset', 'triggerAction'], 'EntityState')
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(chngArgs => {
        if (
          chngArgs.entity.entityAspect.entityState.isDetached() &&
          chngArgs.entity.entityAspect.entityState.isDeleted()
        ) {
          this.deleteAtaByEntity(chngArgs.entity as
            | TriggerAction
            | GenerationAsset);
        }

        if (chngArgs.entity.entityAspect.entityState.isAdded()) {
          this.addAtaByEntity(chngArgs.entity as
            | TriggerAction
            | GenerationAsset);
        }
      });
  }
}
