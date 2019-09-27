import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {
  MatDialog,
  MatDialogConfig,
  MatPaginator,
  MatSort,
  MatTableDataSource
} from '@angular/material';
import { fuseAnimations } from '@fuse/animations';
import { fromEvent, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ActionItem, AagtUowService } from '../aagt-core';
import { ActivatedRoute } from '@angular/router';
import { ActionItemDetailDialogComponent } from './action-item-detail/action-item-detail.dialog';
import { ActionItemManagerResolvedData } from './action-item-manager-resolver.service';
import { routedComponents } from '../aagt-routing.module';
import { BreezeEntity, SpChoiceResult } from 'app/core';

@Component({
  selector: 'app-action-items',
  templateUrl: './action-item-manager.component.html',
  styleUrls: ['./action-item-manager.component.scss'],
  animations: fuseAnimations,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionItemManagerComponent implements OnInit, OnDestroy {
  dataSource: MatTableDataSource<ActionItem>;
  displayedColumns = [
    'id',
    'shortCode',
    'action',
    'resourceCategory',
    'duration',
    'availability'
  ];

  @ViewChild(MatPaginator, { static: true })
  paginator: MatPaginator;

  @ViewChild(MatSort, { static: true })
  sort: MatSort;

  @ViewChild('filter', { static: true })
  filter: ElementRef;
  private actionItemResourceCategories: SpChoiceResult;

  isSaving: Observable<boolean>;

  private unsubscribeAll: Subject<any>;

  constructor(
    private route: ActivatedRoute,
    private uow: AagtUowService,
    private actionItemDialog: MatDialog,
    private acdRef: ChangeDetectorRef
  ) {
    this.unsubscribeAll = new Subject();
  }

  ngOnInit() {
    const routeData = this.route.snapshot.data
      .resolvedData as ActionItemManagerResolvedData;
    const allActionItems = routeData[0];
    this.actionItemResourceCategories = routeData[1];

    this.dataSource = new MatTableDataSource(allActionItems);

    fromEvent(this.filter.nativeElement, 'keyup')
      .pipe(
        debounceTime(1500),
        distinctUntilChanged(),
        takeUntil(this.unsubscribeAll)
      )
      .subscribe(() => {
        if (!this.dataSource) {
          return;
        }
        this.dataSource.filter = this.filter.nativeElement.value;
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  addNewActionItem(): void {
    const newAction = this.uow.createNewEntity('actionItem', {
      assignable: false,
      resourceCategory: this.actionItemResourceCategories[0]
    });
    this.editActionItem(newAction);
  }

  editActionItem(selectedItem: ActionItem) {
    const dialogCfg = new MatDialogConfig();
    dialogCfg.panelClass = 'action-item-detail-dialog';
    dialogCfg.data = [selectedItem];
    dialogCfg.disableClose = true;
    this.actionItemDialog
      .open(ActionItemDetailDialogComponent, dialogCfg)
      .afterClosed()
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(notUsed => {
        this.dataSource.data = (this.uow.entityManager.getEntities(
          'ActionItem'
        ) as any) as ActionItem[];
        this.acdRef.markForCheck();
      });
  }
}
