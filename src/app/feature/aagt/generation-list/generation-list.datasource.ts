import { DataSource } from '@angular/cdk/table';
import { MatPaginator, MatSort } from '@angular/material';
import { FuseUtils } from '@fuse/utils';
import * as _l from 'lodash';
import { merge, BehaviorSubject, Observable, Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilKeyChanged,
  filter,
  map,
  takeUntil,
  tap
} from 'rxjs/operators';
import { Generation, AagtUowService } from '../aagt-core';

export class GenerationListDatasource extends DataSource<Generation> {
  onGenerationsChange: BehaviorSubject<Generation[]>;
  filteredGenerations: Generation[] = [];
  private unsubscribeAll: Subject<any>;

  constructor(
    private paginator: MatPaginator,
    private sort: MatSort,
    private generationFilterChange: BehaviorSubject<string>
  ) {
    super();
    this.unsubscribeAll = new Subject();
    this.onGenerationsChange = new BehaviorSubject([]);
    // this.genMgrUow.aagtEmService
    //     .onModelChanges('Generation')
    //     .pipe(
    //         distinctUntilKeyChanged(
    //             'entity',
    //             (entity1, entity2) => entity1.id === entity2.id
    //         ),
    //         debounceTime(1500),
    //         takeUntil(this.unsubscribeAll)
    //     )
    //     .subscribe(_ => {
    //         this.onGenerationsChange.next(this.genMgrUow.allGenerations);
    //     });
  }

  connect(): Observable<Generation[]> {
    const displayDataChanges = [
      this.onGenerationsChange,
      this.paginator.page,
      this.sort.sortChange
    ];

    return merge(...displayDataChanges).pipe(
      map(noChoice => {
        let genData = [...this.onGenerationsChange.value];
        genData = this.filterData(genData);

        this.filteredGenerations = [...genData];

        genData = this.sortData(genData);

        // Grab the page's slice of data.
        const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
        return genData.splice(startIndex, this.paginator.pageSize);
      })
    );
  }

  filterData(genArray: Generation[]): Generation[] {
    const genFilter = this.generationFilterChange.value;
    if (!genFilter) {
      return genArray;
    }
    return FuseUtils.filterArrayByString(genArray, genFilter);
  }

  disconnect() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  sortData(genData: Generation[]): Generation[] {
    if (!this.sort.active || this.sort.direction === '') {
      return genData;
    }

    return genData.sort((a: Generation, b: Generation) => {
      let propertyA: number | string = '';
      let propertyB: number | string = '';

      switch (this.sort.active) {
        case 'id':
          [propertyA, propertyB] = [a.id, b.id];
          break;
        case 'title':
          [propertyA, propertyB] = [a.title, b.title];
          break;
        case 'iso':
          [propertyA, propertyB] = [a.iso, b.iso];
          break;
        case 'status':
          [propertyA, propertyB] = [a.genStatus, b.genStatus];
          break;
        case 'genStart':
          [propertyA, propertyB] = [
            a.genStartDate.getTime(),
            b.genStartDate.getTime()
          ];
          break;
        case 'assignedAssetCount':
          [propertyA, propertyB] = [a.assignedAssetCount, b.assignedAssetCount];
          break;
      }

      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (
        (valueA < valueB ? -1 : 1) * (this.sort.direction === 'asc' ? 1 : -1)
      );
    });
  }
}
