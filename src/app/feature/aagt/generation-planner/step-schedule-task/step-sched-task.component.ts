import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  AfterViewInit,
  Input
} from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { ActivatedRoute } from '@angular/router';
import { PlanGenResolvedData } from '../gen-planner-resolver.service';
import {
  Generation,
  GenerationAsset,
  Asset,
  GenStatusEnum,
  AssetTriggerAction,
  Trigger,
  AagtUowService,
  IAtaData
} from '../../aagt-core';
import {
  RawEntity,
  AppFormGroup,
  IAppFormGroup,
  GenGraphData,
  AssetTrigActGraph,
  IAtasGantt
} from '@app_types';
import * as _m from 'moment';
import * as _l from 'lodash';
import Swal, { SweetAlertOptions } from 'sweetalert2';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FuseThemeOptionsModule } from '@fuse/components';
import { debounceTime } from 'rxjs/operators';
import {
  Gantt,
  ITaskbarEditedEventArgs,
  EditDialogFieldSettingsModel
} from '@syncfusion/ej2-gantt';
import {
  ContextMenuClickEventArgs,
  ContextMenuItemModel,
  ColumnModel
} from '@syncfusion/ej2-grids';
import {
  EditSettingsModel,
  SelectionSettingsModel
} from '@syncfusion/ej2-treegrid';
import { ToolbarModel } from '@syncfusion/ej2-navigations';
import { ActionBeginEventArgs } from '@syncfusion/ej2-dropdowns';

@Component({
  selector: 'app-plan-sched-task',
  templateUrl: './step-sched-task.component.html',
  styleUrls: ['./step-sched-task.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: fuseAnimations
})
export class PlanSchedTaskComponent implements OnInit {
  @ViewChild('taskSched', { static: false })
  ganttChart: Gantt;

  @Input() taskData: IAtaData;
  allIsos: string[];
  assignedAssets: GenerationAsset[];
  currentGen: Generation;

  contextMenuItems = [
    'TaskInformation',
    {
      text: 'Delete Task',
      target: '.e-content',
      id: 'task-delete'
    } as ContextMenuItemModel
  ];

  generationTasks: IAtasGantt[] = [];
  minDate = new Date();
  statusEnum = Object.keys(GenStatusEnum);
  dayWorkTime = [{ from: 0, to: 24 }];
  editSettings: EditSettingsModel = {
    allowEditing: true,
    allowDeleting: true
  };
  editDialogFields: EditDialogFieldSettingsModel[] = [
    {
      type: 'General',
      headerText: 'Primary Data',
      fields: ['name']
    }
  ];
  ganttColumns: ColumnModel[] = [
    {
      field: 'id',
      headerText: 'ID',
      width: '150',
      visible: false,
      isPrimaryKey: true
    },
    {
      field: 'name',
      headerText: 'Task Name',
      width: '150',
      clipMode: 'EllipsisWithTooltip'
    },
    {
      field: 'triggerMilestone',
      headerText: 'Assigned Trigger',
      width: '150',
      allowFiltering: true
    },
    { field: 'startDate' },
    { field: 'duration' }
  ];

  selectionSettings: SelectionSettingsModel = {
    mode: 'Row'
  };
  taskSettings = {
    id: 'id',
    name: 'name',
    startDate: 'startDate',
    endDate: 'endDate',
    duration: 'duration',
    progress: 'progress',
    dependency: 'predecessor',
    child: 'subtasks'
  };

  timeLineSettings = {
    timelineUnitSize: 33,
    topTier: {
      unit: 'Day',
      format: 'dd-MMM-yyyy'
    },
    bottomTier: {
      unit: 'Hour',
      count: 1
    }
  };

  triggerMarkers: Array<{ day: Date; label: string }> = [];
  toolbarSettings: ['Edit', 'ZoomIn', 'ZoomOut', 'ZoomToFit'];

  unassignedAssets: Asset[];

  constructor(
    private route: ActivatedRoute,
    private uow: AagtUowService,
    public schedTaskCompCdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const genRouteData = this.route.snapshot.data
      .generation as PlanGenResolvedData;

    this.currentGen = genRouteData[0];

    this.setTriggerMarkers();
    this.watchForModelChanges();
    // this.createFormGroupAndValidators();
  }

  changeStep(): void {
    console.log('gen Asset step changed');
    // this.formModelProps.forEach(genProp => {
    //   const formValue = this.genFormGroup.get(genProp).value;
    //   const currProp = this.currentGen[genProp];

    //   if (currProp !== formValue) {
    //     this.currentGen[genProp as any] = formValue;
    //   }
    // });
  }

  createTriggerAction(): void {}
  async contextMenuClick($event: ContextMenuClickEventArgs): Promise<void> {
    console.log($event);
    if ($event.item.id === 'task-delete') {
      console.log('deleted item');
      const config: SweetAlertOptions = {
        title: 'Remove Task?',
        text: `Are you sure?
        This will permantely delete the selected tasks. `,
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, remove asset!'
      };

      const result = await Swal.fire(config);

      if (result.value) {
        this.ganttChart.editModule.deleteRecord(($event as any).rowData);
        Swal.fire(
          'Asset Removed',
          'Asset and all tasks were removed',
          'success'
        );
      }
    }
  }

  dropOnGenAsset($event: CdkDragDrop<Asset, GenerationAsset>): void {
    const asset = $event.item.data as Asset | GenerationAsset;

    // Are we resorting the assigned assets?
    if ($event.container.id === $event.previousContainer.id) {
      // Did we drop the item on the same spot?
      if ($event.currentIndex === $event.previousIndex) {
        return;
      }

      moveItemInArray(
        this.assignedAssets,
        $event.previousIndex,
        $event.currentIndex
      );

      this.sortGenAsset();
      return;
    }

    const addedGenAsset = this.currentGen.createChild('generationAsset', {
      assetId: asset.id
    });

    this.assignedAssets.splice($event.currentIndex, 0, addedGenAsset);
    this.sortGenAsset();

    this.unassignedAssets = this.unassignedAssets.filter(
      ast => ast.id !== asset.id
    );
  }

  sortGenAsset(): void {
    const numOfGenAssets = this.assignedAssets.length;

    for (let idx = 0; idx < numOfGenAssets; idx++) {
      const genAsset = this.assignedAssets[idx];
      const shouldBeInPosition = idx + 1;
      if (genAsset.mxPosition !== shouldBeInPosition) {
        genAsset.mxPosition = shouldBeInPosition;
      }
    }

    // this.genFormGroup.controls.assignedAssetCount.setValue(
    //   this.assignedAssets.length,
    //   { onlySelf: true, emitEvent: false }
    // );

    this.schedTaskCompCdRef.markForCheck();
  }

  async droppedOnAsset($event: CdkDragDrop<Asset>): Promise<void> {
    if ($event.container.id === $event.previousContainer.id) {
      return;
    }

    const genAsset = $event.item.data as GenerationAsset;

    const config: SweetAlertOptions = {
      title: 'Remove Asset?',
      text: `Are you sure?
      This will delete all tasks assigned to this asset for this generation. `,
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove asset!'
    };

    const result = await Swal.fire(config);

    if (result.value) {
      this.unassignedAssets.push(genAsset.asset);
      this.assignedAssets = this.assignedAssets.filter(
        genAst => genAst.assetId !== genAsset.assetId
      );

      this.sortGenAsset();

      genAsset.assetTriggerActions
        .filter(ata => ata.generationAssetId === ata.id)
        .forEach(ata => ata.entityAspect.setDeleted());

      genAsset.entityAspect.setDeleted();

      Swal.fire('Asset Removed', 'Asset and all tasks were removed', 'success');
    }

    console.log(result);

    return result.value;
  }

  setTriggerMarkers(): void {
    this.triggerMarkers = this.currentGen.triggers.map(trigger => {
      return { day: trigger.triggerStart, label: trigger.milestone };
    });
  }

  sortAssignedAsset(): void {}

  taskEditSave($event: any): void {
    if ($event.requestType === 'beforeSave') {
      console.log('before save');
      console.log($event);
    } else {
      console.log('all others');
      console.log($event);
    }
  }

  watchForModelChanges(): void {
    this.uow.entityManager
      .onModelChanges('trigger')
      .pipe(debounceTime(1000))
      .subscribe(_ => {
        this.setTriggerMarkers();
        this.schedTaskCompCdRef.markForCheck();
      });
  }
}
