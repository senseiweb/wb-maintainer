import {
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  ViewChild
} from '@angular/core';
import { Subject } from 'rxjs';
import { filter, takeUntil, delay, take } from 'rxjs/operators';

import { FuseConfigService } from '@fuse/services/config.service';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FusePerfectScrollbarDirective } from '@fuse/directives/fuse-perfect-scrollbar/fuse-perfect-scrollbar.directive';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-navbar-vertical-style-2',
  templateUrl: './vertical-style-2.component.html',
  styleUrls: ['./vertical-style-2.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LayoutNavbarVerticalStyle2Component implements OnInit, OnDestroy {
  fuseConfig: any;
  navigation: any;
  private fusePerfectScrollbar: FusePerfectScrollbarDirective;

  private unsubscribeAll: Subject<any>;

  constructor(
    private fuseConfigService: FuseConfigService,
    private fuseNavigationService: FuseNavigationService,
    private fuseSidebarService: FuseSidebarService,
    private router: Router
  ) {
    // Set the private defaults
    this.unsubscribeAll = new Subject();
  }

  @ViewChild(FusePerfectScrollbarDirective, { static: true })
  set directive(theDirective: FusePerfectScrollbarDirective) {
    if (!theDirective) {
      return;
    }

    this.fusePerfectScrollbar = theDirective;

    // Update the scrollbar on collapsable item toggle
    this.fuseNavigationService.onItemCollapseToggled
      .pipe(
        delay(500),
        takeUntil(this.unsubscribeAll)
      )
      .subscribe(() => {
        this.fusePerfectScrollbar.update();
      });

    // Scroll to the active item position
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        take(1)
      )
      .subscribe(() => {
        setTimeout(() => {
          const activeNavItem: any = document.querySelector(
            'navbar .nav-link.active'
          );

          if (activeNavItem) {
            const activeItemOffsetTop = activeNavItem.offsetTop;
            const activeItemOffsetParentTop =
              activeNavItem.offsetParent.offsetTop;
            const scrollDistance =
              activeItemOffsetTop - activeItemOffsetParentTop - 48 * 3;

            this.fusePerfectScrollbar.scrollToTop(scrollDistance);
          }
        });
      });
  }

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.unsubscribeAll)
      )
      .subscribe(() => {
        if (this.fuseSidebarService.getSidebar('navbar')) {
          this.fuseSidebarService.getSidebar('navbar').close();
        }
      });

    this.fuseNavigationService.onNavigationChanged
      .pipe(
        filter(value => value !== null),
        takeUntil(this.unsubscribeAll)
      )
      .subscribe(() => {
        this.navigation = this.fuseNavigationService.getCurrentNavigation();
      });

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

  toggleSidebarOpened(): void {
    this.fuseSidebarService.getSidebar('navbar').toggleOpen();
  }

  toggleSidebarFolded(): void {
    this.fuseSidebarService.getSidebar('navbar').toggleFold();
  }
}
