import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { FuseConfigService } from '@fuse/services/config.service';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';

@Component({
  selector: 'app-navbar-horizontal-style-1',
  templateUrl: './horizontal-style-1.component.html',
  styleUrls: ['./horizontal-style-1.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LayoutNavbarHorizontalStyle1Component
  implements OnInit, OnDestroy {
  fuseConfig: any;
  navigation: any;

  private unsubscribeAll: Subject<any>;

  constructor(
    private fuseConfigService: FuseConfigService,
    private fuseNavigationService: FuseNavigationService,
    private fuseSidebarService: FuseSidebarService
  ) {
    // Set the private defaults
    this.unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    // Get current navigation
    this.fuseNavigationService.onNavigationChanged
      .pipe(
        filter(value => value !== null),
        takeUntil(this.unsubscribeAll)
      )
      .subscribe(() => {
        this.navigation = this.fuseNavigationService.getCurrentNavigation();
      });

    // Subscribe to the config changes
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
