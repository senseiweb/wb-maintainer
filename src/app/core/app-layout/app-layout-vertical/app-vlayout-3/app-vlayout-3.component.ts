import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FuseConfigService } from '@fuse/services/config.service';

@Component({
  selector: 'app-vertical-layout-3',
  templateUrl: './app-vlayout-3.component.html',
  styleUrls: ['./app-vlayout-3.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class VerticalLayout3Component implements OnInit, OnDestroy {
  fuseConfig: any;
  navigation: any;

  private unsubscribeAll: Subject<any>;

  constructor(
    private fuseConfigService: FuseConfigService,
  ) {
    // Set the private defaults
    this.unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    // Subscribe to config changes
    this.fuseConfigService.config
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(config => {
        this.fuseConfig = config;
      });
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
