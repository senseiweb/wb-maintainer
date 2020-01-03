import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild
} from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { ActivatedRoute } from '@angular/router';
import { PlanGenResolvedData } from '../gen-planner-resolver.service';
import { Generation, Asset, AagtUowService } from '../../aagt-core';
import { IAtasGantt, DoNotCare, FixLater } from '@app_types';
import * as _m from 'moment';
import * as _l from 'lodash';
import Swal, { SweetAlertOptions } from 'sweetalert2';
import {
  AggregateService,
  GroupService,
  EditService,
  ToolbarService,
  GridComponent
} from '@syncfusion/ej2-angular-grids';
import { Item } from '@syncfusion/ej2-navigations';

@Component({
  selector: 'app-plan-sched-task',
  templateUrl: './step-sched-task.component.html',
  styleUrls: ['./step-sched-task.component.scss'],
  providers: [AggregateService, GroupService, EditService, ToolbarService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: fuseAnimations
})
export class PlanSchedTaskComponent implements OnInit {
  @ViewChild('ataGrid', { static: false })
  ataGridChart: GridComponent;
  refresh: boolean;
  currentGen: Generation;
  pageOption: any;
  editSettings: any;
  toolbar: any;
  data: any[];
  selectionOptions = { type: 'Multiple' };
  groupSettings: { [x: string]: any } = {
    showDropArea: false,
    columns: ['taskAsset']
  };

  constructor(
    private route: ActivatedRoute,
    private uow: AagtUowService,
    public schedTaskCompCdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const genRouteData = this.route.snapshot.data
      .generation as PlanGenResolvedData;

    this.currentGen = genRouteData[0];
    this.pageOption = { pageCount: 5 };

    this.toolbar = [
      {
        text: 'Expand All',
        tooltipText: 'Expand All Items',
        prefixIcon: 'e-expand',
        id: 'expandall'
      },
      {
        text: 'Collapse All',
        tooltipText: 'Collapse All Items',
        prefixIcon: 'e-collapse',
        id: 'collapseall'
      },
      {
        text: 'Save Gen',
        tooltipText: 'Save All Pending Changes',
        prefixIcon: 'e-save',
        id: 'saveall'
      }
    ];
    // this.setTriggerMarkers();
  }

  actionHandler($event: any): void {
    console.log($event);
  }

  changeStep(): void {
    console.log('gen Asset step changed');
  }

  dataBound($event: DoNotCare): void {
    console.log($event);
    if (this.refresh) {
      this.ataGridChart.groupColumn('taskAsset');
      this.refresh = false;
    }
  }

  load() {
    this.refresh = (this.ataGridChart as any).refreshing;
  }

  // async contextMenuClick($event: ContextMenuClickEventArgs): Promise<void> {
  //   console.log($event);
  //   if ($event.item.id === 'task-delete') {
  //     console.log('deleted item');
  //     const config: SweetAlertOptions = {
  //       title: 'Remove Task?',
  //       text: `Are you sure?
  //       This will permantely delete the selected tasks. `,
  //       type: 'warning',
  //       showCancelButton: true,
  //       confirmButtonColor: '#3085d6',
  //       cancelButtonColor: '#d33',
  //       confirmButtonText: 'Yes, remove asset!'
  //     };

  //     const result = await Swal.fire(config);

  //     if (result.value) {
  //       this.schedTakGanttChart.editModule.deleteRecord(
  //         ($event as any).rowData
  //       );
  //       Swal.fire(
  //         'Asset Removed',
  //         'Asset and all tasks were removed',
  //         'success'
  //       );
  //     }
  //   }
  // }

  // setTriggerMarkers(): void {
  //   this.triggerMarkers = this.currentGen.triggers.map(trigger => {
  //     return { day: trigger.triggerStart, label: trigger.milestone };
  //   });
  // }

  taskEditSave($event: any): void {
    if ($event.requestType === 'beforeSave') {
      console.log('before save');
      console.log($event);
    } else {
      console.log('all others');
      console.log($event);
    }
  }

  toolbarClickHandler($event: FixLater): void {
    console.log($event);
    console.log(this.ataGridChart.getSelectedRecords());
  }

  updateGanttData(): void {
    this.ataGridChart.dataSource = this.currentGen.prioritizedATAs;
    this.schedTaskCompCdRef.markForCheck();
  }
}
