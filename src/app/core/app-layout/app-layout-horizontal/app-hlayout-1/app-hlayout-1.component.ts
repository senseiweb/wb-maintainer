import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AppNavigationService } from 'app/core/config/nav-config.service';
import { FuseConfigService } from '@fuse/services/config.service';

@Component({
  selector: 'app-horizontal-layout-1',
  templateUrl: './app-hlayout-1.component.html',
  styleUrls: ['./app-hlayout-1.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HorizontalLayout1Component implements OnInit, OnDestroy {
  fuseConfig: any;

  private unsubscribeAll: Subject<any>;

  constructor(
    private fuseConfigService: FuseConfigService,
    private navigation: AppNavigationService
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

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
