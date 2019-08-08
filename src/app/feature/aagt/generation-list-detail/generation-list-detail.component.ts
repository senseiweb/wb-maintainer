import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Generation, AssetTriggerAction } from '../aagt-core';
import { ActivatedRoute } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import * as _m from 'moment';

export interface IAtasGantt {
  id: number;
  name: string;
  startDate: Date;
  endDate?: Date;
  duration?: number;
  progress: number;
  parentId?: number;
}

@Component({
  templateUrl: './generation-list-detail.component.html',
  styleUrls: ['./generation-list-detail.component.scss'],
  animations: fuseAnimations,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenerationListDetailComponent implements OnInit {
  projectStartDate = new Date('04/02/2019');
  projectEndDate = new Date('04/21/2019');
  data = [
    {
      TaskID: 1,
      TaskName: 'Project Initiation',
      StartDate: new Date('04/02/2019'),
      EndDate: new Date('04/21/2019'),
      subtasks: [
        {
          TaskID: 2,
          TaskName: 'Identify Site location',
          StartDate: new Date('04/02/2019'),
          Duration: 4,
          Progress: 50
        },
        {
          TaskID: 3,
          TaskName: 'Perform Soil test',
          StartDate: new Date('04/02/2019'),
          Duration: 4,
          Progress: 50
        },
        {
          TaskID: 4,
          TaskName: 'Soil test approval',
          StartDate: new Date('04/02/2019'),
          Duration: 4,
          Progress: 50
        }
      ]
    },
    {
      TaskID: 5,
      TaskName: 'Project Estimation',
      StartDate: new Date('04/02/2019'),
      EndDate: new Date('04/21/2019'),
      subtasks: [
        {
          TaskID: 6,
          TaskName: 'Develop floor plan for estimation',
          StartDate: new Date('04/04/2019'),
          Duration: 3,
          Progress: 50
        },
        {
          TaskID: 7,
          TaskName: 'List materials',
          StartDate: new Date('04/04/2019'),
          Duration: 3,
          Progress: 50
        },
        {
          TaskID: 8,
          TaskName: 'Estimation approval',
          StartDate: new Date('04/04/2019'),
          Duration: 3,
          Progress: 50
        }
      ]
    }
  ];
  toolbarSettings = ['ZoomIn', 'ZoomOut', 'ZoomToFit'];
  taskSettings = {
    id: 'id',
    name: 'name',
    startDate: 'startDate',
    endDate: 'endData',
    duration: 'duration',
    progress: 'progress',
    dependency: 'Predecessor',
    child: 'subtasks'
  };

  generation: Generation;
  genTasks: IAtasGantt[] = [];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.generation = this.route.snapshot.data.generation;
    const genGraph = this.generation.makeGenerationGraphData();

    genGraph.forEach(graph => {
      const trig = graph[0];

      const trigGraphDataPoint: IAtasGantt = {
        id: trig.id,
        name: trig.milestone,
        startDate: trig.triggerStart,
        progress: 0
      };

      this.genTasks.push(trigGraphDataPoint);

      const trigAssets = graph[1];
      const trigAssetsLength = trigAssets.length;

      /**
       * Using for loops to better track the index so we can get
       * the last index and update end times.
       */
      for (let trigIdx = 0; trigIdx < trigAssetsLength; trigIdx++) {
        const genAsset = trigAssets[trigIdx][0];
        const genAssetId = trigGraphDataPoint.id + '' + genAsset.id;
        const assetTasks = trigAssets[trigIdx][1];

        const genTaskDataPoint: IAtasGantt = {
          id: +genAssetId,
          name: genAsset.asset.alias,
          startDate: assetTasks[0].plannedStart,
          progress: 0,
          parentId: trig.id
        };

        this.genTasks.push(genTaskDataPoint);

        const isLastAssetForTrigger = trigIdx === trigAssetsLength - 1;

        const assetTasksLength = assetTasks.length;

        for (
          let assetTaskIdx = 0;
          assetTaskIdx < assetTasksLength;
          assetTaskIdx++
        ) {
          const assetTask = assetTasks[assetTaskIdx];
          const assetTaskId = genTaskDataPoint.id + '' + assetTask.id;

          const assetTaskDataPoint: IAtasGantt = {
            id: +assetTaskId,
            name: assetTask.triggerAction.actionItem.action,
            startDate: assetTask.plannedStart,
            endDate: assetTask.plannedStop,
            progress: 0,
            parentId: genTaskDataPoint.id,
            duration: _m
              .duration(_m(assetTask.plannedStop).diff(assetTask.plannedStart))
              .asMinutes()
          };
          
          this.genTasks.push(assetTaskDataPoint);

          const isLastTaskForAsset = assetTaskIdx === assetTasksLength - 1;

          if (!isLastTaskForAsset) {
            continue;
          }

          genTaskDataPoint.endDate = assetTask.plannedStop;
          genTaskDataPoint.duration = _m
            .duration(
              _m(genTaskDataPoint.endDate).diff(genTaskDataPoint.startDate)
            )
            .asMinutes();

          if (!isLastAssetForTrigger) {
            continue;
          }

          trigGraphDataPoint.endDate = assetTask.plannedStop;
          trigGraphDataPoint.duration = _m
            .duration(
              _m(trigGraphDataPoint.endDate).diff(trigGraphDataPoint.startDate)
            )
            .asMinutes();

        }
      }
    });

    this.data = this.genTasks as any;
  }
}
