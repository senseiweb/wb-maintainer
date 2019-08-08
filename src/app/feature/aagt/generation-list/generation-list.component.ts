import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { MatPaginator, MatSort } from '@angular/material';
import { fuseAnimations } from '@fuse/animations';
import { fromEvent, BehaviorSubject, Observable, Subject, from } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { GenerationListDatasource } from './generation-list.datasource';
import { AagtUowService } from '../aagt-core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-generation-list',
  templateUrl: './generation-list.component.html',
  styleUrls: ['./generation-list.component.scss'],
  animations: fuseAnimations,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class GenerationListComponent implements OnInit {
  dataSource: GenerationListDatasource;
  onFilterTextChange = new BehaviorSubject('');
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

  taskSettings = {
    id: 'TaskID',
    name: 'TaskName',
    startDate: 'StartDate',
    endDate: 'EndDate',
    duration: 'Duration',
    progress: 'Progress',
    dependency: 'Predecessor',
    child: 'subtasks'
  };

  displayedColumns = [
    'id',
    'title',
    'iso',
    'status',
    'genStart',
    'assignedAssetCount'
  ];

  @ViewChild(MatPaginator, { static: true })
  paginator: MatPaginator;

  @ViewChild(MatSort, { static: true })
  sort: MatSort;

  @ViewChild('filter', { static: true })
  filter: ElementRef;

  private unsubscribeAll: Subject<any>;

  constructor(private aagtUow: AagtUowService, private route: ActivatedRoute) {
    this.unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this.dataSource = new GenerationListDatasource(
      this.paginator,
      this.sort,
      this.onFilterTextChange
    );

    this.dataSource.onGenerationsChange.next(
      this.route.snapshot.data.generationList
    );

    fromEvent(this.filter.nativeElement, 'keyup')
      .pipe(
        debounceTime(150),
        distinctUntilChanged(),
        takeUntil(this.unsubscribeAll)
      )
      .subscribe(() => {
        if (!this.dataSource) {
          return;
        }
        this.onFilterTextChange.next(this.filter.nativeElement);
      });
  }
}
