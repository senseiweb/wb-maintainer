import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  Input,
  Output,
  EventEmitter
} from "@angular/core";
import { fuseAnimations } from "@fuse/animations";
import { ActivatedRoute } from "@angular/router";
import { PlanGenResolvedData } from "../gen-planner-resolver.service";
import {
  Generation,
  GenerationAsset,
  Asset,
  GenStatusEnum,
  AagtUowService,
  TriggerAction
} from "../../aagt-core";
import { IAtasGantt } from "@app_types";
import * as _m from "moment";
import * as _l from "lodash";
import Swal, { SweetAlertOptions } from "sweetalert2";
import {
  Gantt,
  EditDialogFieldSettingsModel,
  LabelSettingsModel
} from "@syncfusion/ej2-gantt";
import {
  ContextMenuClickEventArgs,
  ContextMenuItemModel,
  ColumnModel,
  DialogEditEventArgs
} from "@syncfusion/ej2-grids";
import {
  EditSettingsModel,
  SelectionSettingsModel
} from "@syncfusion/ej2-treegrid";
import { EJ2Instance } from "@syncfusion/ej2-navigations";

@Component({
  selector: "app-plan-task-lineup",
  templateUrl: "./step-task-lineup.component.html",
  styleUrls: ["./step-task-lineup.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: fuseAnimations
})
export class PlanTaskLineUpComponent implements OnInit {
  @ViewChild("taskLineUp", { static: false })
  taskLineupGanttChart: Gantt;

  @Output() cascadeGanttUpdate = new EventEmitter<any>();

  triggerActions: TriggerAction[];

  currentGen: Generation;

  taskLineupGanttTasks: IAtasGantt[] = [];

  minDate = new Date();

  statusEnum = Object.keys(GenStatusEnum);

  dayWorkTime = [{ from: 0, to: 24 }];

  editSettings: EditSettingsModel = {
    allowEditing: true,
    allowDeleting: true
  };

  editDialogFields: EditDialogFieldSettingsModel[] = [
    {
      type: "General",
      headerText: "Primary Data"
    },
    {
      type: "Dependency"
    }
  ];

  ganttColumns: ColumnModel[] = [
    {
      field: "sequence",
      headerText: "Sequence",
      width: "75"
    },
    {
      field: "taskId",
      isPrimaryKey: true,
      visible: false
    },
    {
      field: "taskDuration",
      headerText: "Duration",
      allowEditing: false,
      visible: false
    },
    {
      field: "taskName",
      headerText: "Task Name",
      width: "150",
      clipMode: "EllipsisWithTooltip",
      visible: false
    },
    {
      field: "taskMilestone",
      headerText: "Assigned Trigger",
      width: "150",
      allowFiltering: true
    },
    { field: "taskStart" },
    { field: "taskDuration" },
    { field: "taskFormattedDuration", visible: false }
  ];

  labelSettings: LabelSettingsModel = {
    leftLabel: "taskName",
    rightLabel: "taskFormattedDuration"
  };

  selectionSettings: SelectionSettingsModel = {
    mode: "Row"
  };

  taskSettings = {
    id: "taskId",
    name: "taskName",
    startDate: "taskStart",
    endDate: "taskEnd",
    duration: "taskDuration",
    dependency: "taskDependents"
  };

  timeLineSettings = {
    timelineUnitSize: 33,
    topTier: {
      unit: "Day",
      format: "dd-MMM-yyyy"
    },
    bottomTier: {
      unit: "Hour",
      count: 1
    }
  };

  triggerMarkers: Array<{ day: Date; label: string }> = [];

  toolbarSettings: ["Edit", "ZoomIn", "ZoomOut", "ZoomToFit"];

  unassignedAssets: Asset[];

  constructor(
    private route: ActivatedRoute,
    private uow: AagtUowService,
    public taskLineupCdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const genRouteData = this.route.snapshot.data
      .generation as PlanGenResolvedData;

    this.currentGen = genRouteData[0];
    this.triggerActions = _l.flatMap(
      this.currentGen.triggers,
      x => x.triggerActions
    );
    this.setTriggerMarkers();
    // this.watchForModelChanges();
    // this.createFormGroupAndValidators();
  }

  changeStep(): void {}

  createTriggerAction(): void {}

  async contextMenuClick($event: ContextMenuClickEventArgs): Promise<void> {
    console.log($event);
    if ($event.item.id === "task-delete") {
      console.log("deleted item");
      const config: SweetAlertOptions = {
        title: "Remove Task?",
        text: `Are you sure?
        This will permantely delete the selected tasks. `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, remove asset!"
      };

      const result = await Swal.fire(config);

      if (result.value) {
        this.taskLineupGanttChart.editModule.deleteRecord(
          ($event as any).rowData
        );
        Swal.fire(
          "Asset Removed",
          "Asset and all tasks were removed",
          "success"
        );
      }
    }
  }

  // dialogCloseEvent($event: any): void {
  //   debugger;
  //   const currentTaskId = $event.data.taskId;
  //   const dependOnTasks = $event.data.ganttProperties.predecessor.filter(
  //     pd => +pd.to === currentTaskId
  //   );

  //   const primeTaskAct = $event.data.taskData as TriggerAction;

  //   if (!dependOnTasks.length) {
  //     primeTaskAct.taskDependsOn.length = 0;
  //     return;
  //   }

  //   dependOnTasks.forEach(dot => {
  //     primeTaskAct.taskDependsOn.push({
  //       dependType: dot.type,
  //       offset: dot.offset,
  //       offsetUnit: dot.offsetUnit,
  //       trigAct: primeTaskAct.trigger.triggerActions.find(
  //         ta => ta.taskId === dot.from
  //       )
  //     });
  //   });
  // }

  onDataChange($event: any): void {
    this.cascadeGanttUpdate.emit();
  }

  openEditDialog($event: any): void {
    if ($event.requestType !== "openEditDialog") {
      return;
    }
    const durationField = (document.getElementById(
      "taskLineUptaskDuration"
    ) as any).ej2_instances[0];
    durationField.enabled = false;
  }

  setTriggerMarkers(): void {
    this.triggerMarkers = this.currentGen.triggers.map(trigger => {
      return { day: trigger.triggerStart, label: trigger.milestone };
    });
  }

  sortAssignedAsset(): void {}

  actionComplete($event: any): void {
    switch ($event.requestType) {
      case "openEditDialog":
        this.openEditDialog($event);
        break;
      case "save":
        // this.dialogCloseEvent($event);
        break;
      default:
        console.log($event);
    }
  }

  ganttBeginActions($event: any): void {
    console.log($event);
  }

  updateGanttData(): void {
    const triggerActions = _l.flatMap(
      this.currentGen.triggers,
      x => x.triggerActions
    );
    // const sortedTriggerActions = _l.sortBy(triggerActions, x => x.taskId);
    // sortedTriggerActions.forEach((sta: any) => {
    //   sta.isAutoSchedule = true;
    // });
    // this.taskLineupGanttChart.dataSource = sortedTriggerActions;
    this.taskLineupCdRef.markForCheck();
  }
}
