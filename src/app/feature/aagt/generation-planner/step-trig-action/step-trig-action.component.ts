import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy
} from "@angular/core";
import { fuseAnimations } from "@fuse/animations";
import {
  FormGroup,
  FormControl,
  FormBuilder,
  FormGroupDirective
} from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { PlanGenResolvedData } from "../gen-planner-resolver.service";
import {
  Generation,
  Asset,
  TriggerAction,
  ActionItem,
  Trigger,
  AagtUowService
} from "../../aagt-core";
import { RawEntity, IAppFormGroup } from "@app_types";
import * as _m from "moment";
import * as _l from "lodash";
import Swal, { SweetAlertOptions } from "sweetalert2";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ErrorStateMatcher } from "@angular/material";
import { BreezeEntity } from "app/core";

type TrigModelProps =
  | keyof Pick<Trigger, "milestone" | "triggerStart">
  | "triggerSelection";

type TrigFormModel = { [key in TrigModelProps]: FormControl };

@Component({
  selector: "app-plan-trig-action",
  templateUrl: "./step-trig-action.component.html",
  styleUrls: ["./step-trig-action.component.scss"],
  animations: fuseAnimations,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlanTrigActionComponent
  implements OnInit, OnDestroy, ErrorStateMatcher {
  private allActionItems: ActionItem[];
  assignedTrigActions: TriggerAction[];
  currentGen: Generation;
  currentTrigger: Trigger;
  isNewForm: boolean;
  formErrMatcher: ErrorStateMatcher;
  minDate: Date;
  trigFormGroup: IAppFormGroup<TrigFormModel>;
  triggerList: Trigger[];
  triggerShell: { milestone: string; triggerStart: Date };
  unassignedActions: ActionItem[];
  unsubscribeAll: Subject<any>;

  private formModelProps: TrigModelProps[] = [
    "milestone",
    "triggerStart",
    "triggerSelection"
  ];

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private cdRef: ChangeDetectorRef,
    private uow: AagtUowService
  ) {
    this.unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    const genRouteData = this.route.snapshot.data
      .generation as PlanGenResolvedData;

    this.currentGen = genRouteData[0];

    this.formErrMatcher = {
      isErrorState(control: FormControl, form: FormGroupDirective): boolean {
        return control && control.dirty && form && form.invalid;
      }
    };
    /**
     * Make a copy of the generation triggers so we can better
     * contol the when triggers are actual created vs using the
     * currentGen triggers collection.
     */
    this.triggerList = [...this.currentGen.triggers];
    this.unassignedActions = this.allActionItems = genRouteData[2];
    this.setMinDate();
    this.createFormGroupAndValidators();
    this.watchModelForChanges();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  addNewTrigger(): void {
    const fgControls = this.trigFormGroup.controls;

    if (this.doesMileStoneExist(fgControls.milestone.value)) {
      return;
    }

    const newTrigger = this.currentGen.createChild("trigger");

    if (fgControls.triggerSelection.disabled) {
      fgControls.triggerSelection.enable({ onlySelf: true, emitEvent: false });
    }

    newTrigger.milestone = fgControls.milestone.value;
    newTrigger.triggerStart = fgControls.triggerStart.value;
    this.triggerList = [...this.currentGen.triggers];
    fgControls.triggerSelection.setValue(newTrigger);
    this.isNewForm = false;
  }

  calculateCummRunTime(currentTrigActionIdx: number): number {
    if (currentTrigActionIdx === undefined) {
      return;
    }

    let totalRuntime = 0;
    /**
     * Using the long form loop to pre-maturely correct
     * potential proformance issue as this method may be
     * called a lot.
     */
    for (let indexer = 0; indexer <= currentTrigActionIdx; indexer++) {
      totalRuntime += this.assignedTrigActions[indexer].actionItem.duration;
    }

    return totalRuntime;
  }

  createFormGroupAndValidators(): void {
    let trigger: Trigger;

    if (this.currentGen.triggers.length) {
      this.setDefaultTrigger();
      trigger = this.currentTrigger;
    }

    const formModel: Partial<TrigFormModel> = {};

    this.formModelProps.forEach(prop => {
      const defaultProp = trigger ? trigger[prop] : "";
      formModel[prop] = new FormControl(defaultProp, { updateOn: "blur" });
    });

    this.trigFormGroup = this.formBuilder.group(formModel) as any;

    this.currentGen
      .getRelatedEntityType("trigger")
      .custom.setFormValidators(this.trigFormGroup, trigger);

    /**
     * Order matters! Need to register watchers before setting values on the
     * newly created form.
     */
    this.watchFormModel();

    if (!this.currentTrigger) {
      formModel.triggerSelection.setValue("new");
      formModel.triggerSelection.disable({ onlySelf: true, emitEvent: false });
    }
  }

  private doesMileStoneExist(milestone: string): boolean {
    const milestoneExists = this.currentGen.triggers
      .map(trig => trig.milestone)
      .includes(milestone);

    if (milestoneExists) {
      Swal.fire(
        "Duplicate Milestone",
        `${milestone} already exists for this generation`,
        "error"
      );
    }

    return milestoneExists;
  }

  async deleteTrigger(): Promise<void> {
    const config: SweetAlertOptions = {
      title: "Remove Trigger?",
      text: `Are you sure?
      This will delete all actions and tasks assigned to this trigger. `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete trigger!"
    };

    const result = await Swal.fire(config);

    if (result.value) {
      const fgControls = this.trigFormGroup.controls;

      // const genTasks = _l.flatMap(
      //   this.currentTrigger.triggerActions,
      //   x => x.assetTriggerActions
      // );

      // genTasks.forEach(gt => gt.entityAspect.setDeleted());

      this.currentTrigger.triggerActions.forEach(ta =>
        ta.entityAspect.setDeleted()
      );

      this.currentTrigger.entityAspect.setDeleted();

      this.triggerList = [...this.currentGen.triggers];

      if (!this.triggerList.length) {
        this.trigFormGroup.reset({
          triggerSelection: "new"
        });

        fgControls.triggerSelection.disable({ emitEvent: false });
      } else {
        _l.sortBy(this.triggerList, x => x.triggerStart);
        fgControls.triggerSelection.setValue(this.triggerList[0]);
      }

      Swal.fire(
        "Trigger Remove",
        "Trigger, all action items, and all tasks were removed",
        "success"
      );
    }
  }

  async droppedOnActionItem($event: CdkDragDrop<TriggerAction>): Promise<void> {
    if ($event.container.id === $event.previousContainer.id) {
      return;
    }

    const trigAction = $event.item.data as TriggerAction;

    const config: SweetAlertOptions = {
      title: "Remove Action Item?",
      text: `Are you sure?
      This will delete all tasks assigned to this action item for this trigger. `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, remove asset!"
    };

    const result = await Swal.fire(config);

    if (result.value) {
      this.unassignedActions.push(trigAction.actionItem);
      this.assignedTrigActions = this.assignedTrigActions.filter(
        trigAct => trigAct.actionItemId !== trigAction.actionItemId
      );

      this.sortTriggerAction();

      // trigAction.assetTriggerActions
      //   .filter(ata => ata.generationAssetId === ata.id)
      //   .forEach(ata => ata.entityAspect.setDeleted());

      trigAction.entityAspect.setDeleted();

      Swal.fire(
        "Action Item Removed",
        "Action Item and all tasks were removed",
        "success"
      );
    }
  }

  droppedOnTrigAction($event: CdkDragDrop<ActionItem, TriggerAction>): void {
    const actionItem = $event.item.data as ActionItem | TriggerAction;

    // Are we resorting the assigned assets?
    if ($event.container.id === $event.previousContainer.id) {
      // Did we drop the item on the same spot?
      if ($event.currentIndex === $event.previousIndex) {
        return;
      }

      moveItemInArray(
        this.assignedTrigActions,
        $event.previousIndex,
        $event.currentIndex
      );

      this.sortTriggerAction();
      return;
    }

    const addedTrigAction = this.currentTrigger.createChild("triggerAction", {
      actionItemId: actionItem.id,
      generation: this.currentGen
    });

    this.assignedTrigActions.splice($event.currentIndex, 0, addedTrigAction);
    this.sortTriggerAction();

    this.unassignedActions = this.unassignedActions.filter(
      actItm => actItm.id !== actionItem.id
    );
  }

  isErrorState(
    frmCntrl: FormControl,
    frmDirective: FormGroupDirective
  ): boolean {
    return frmCntrl.dirty && frmDirective.invalid;
  }

  resetBasedOnTrigger(): void {
    if (!this.currentTrigger) {
      this.assignedTrigActions = [];
      this.unassignedActions = [...this.allActionItems];
      return;
    }

    this.assignedTrigActions = [...this.currentTrigger.triggerActions];

    this.unassignedActions = _l.differenceWith(
      this.allActionItems,
      this.currentTrigger.triggerActions,
      (a: ActionItem, b: TriggerAction) => a.id === b.actionItemId
    );
  }

  setDefaultTrigger(): void {
    this.currentTrigger = this.currentGen.triggers[0];
    this.resetBasedOnTrigger();
    this.isNewForm = false;
  }

  setMinDate(): void {
    this.minDate = this.currentGen.genStartDate;
  }

  sortTriggerAction(): void {
    const numOfTrigActions = this.assignedTrigActions.length;

    for (let idx = 0; idx < numOfTrigActions; idx++) {
      const trigAction = this.assignedTrigActions[idx];
      const shouldBeSequence = idx + 1;
      if (trigAction.sequence !== shouldBeSequence) {
        trigAction.sequence = shouldBeSequence;
      }
    }
    this.cdRef.markForCheck();
  }

  trackById(index: number, entity: BreezeEntity): string | number {
    return entity ? entity.id : undefined;
  }

  updateTrigger(): void {
    const fgControls = this.trigFormGroup.controls;
    const currentMilestone = this.currentTrigger.milestone || "";

    if (
      fgControls.milestone.dirty &&
      fgControls.milestone.value.toLowerCase() !==
        currentMilestone.toLowerCase() &&
      this.doesMileStoneExist(fgControls.milestone.value)
    ) {
      return;
    }

    const updatedMilestone = fgControls.milestone.value;
    const updatedStart = fgControls.triggerStart.value;

    this.currentTrigger.milestone = updatedMilestone;
    this.currentTrigger.triggerStart = updatedStart;
    // this.trigFormGroup.reset(this.currentTrigger, { onlySelf: true, emitEvent: false });

    fgControls.triggerSelection.setValue(this.currentTrigger);

    // fgControls.milestone.reset(updatedMilestone, { emitEvent: false });
    // fgControls.triggerStart.reset(updatedStart, { emitEvent: false });
  }

  watchModelForChanges(): void {
    this.uow.entityManager
      .onModelChanges("generation", "PropertyChange", "genStartDate")
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(_ => this.setMinDate());
  }

  watchFormModel(): void {
    const fgControls = this.trigFormGroup.controls;

    fgControls.milestone.valueChanges.subscribe(_ => {
      console.log(this.trigFormGroup.errors);
      console.log(this.trigFormGroup.controls.milestone.errors);
    });

    fgControls.triggerSelection.valueChanges
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((trigger: Trigger | "new") => {
        /**
         * If the selection is for a 'new' trigger,
         * setup a shell object that for the form values.
         * Makes it easier to track if user decides that didn't
         * really mean to create a new trigger.
         */
        if (trigger === "new") {
          fgControls.milestone.reset();
          fgControls.triggerStart.reset();

          fgControls.milestone.setValue("", {
            emitEvent: false
          });

          fgControls.triggerStart.setValue(new Date(), {
            emitEvent: false
          });

          this.isNewForm = true;

          this.resetBasedOnTrigger();
          return;
        }

        this.currentTrigger = trigger;

        this.isNewForm = false;

        this.trigFormGroup.reset(
          {
            triggerSelection: trigger,
            milestone: trigger.milestone,
            triggerStart: trigger.triggerStart
          },
          { emitEvent: false }
        );

        this.resetBasedOnTrigger();
      });
  }
}
