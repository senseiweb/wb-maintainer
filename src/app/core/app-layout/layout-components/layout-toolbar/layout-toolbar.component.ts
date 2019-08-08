import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';

import { FuseConfigService } from '@fuse/services/config.service';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { SpConfig } from 'app/core/config/app-config';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';

@Component({
  selector: 'app-layout-toolbar',
  templateUrl: './layout-toolbar.component.html',
  styleUrls: ['./layout-toolbar.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LayoutToolbarComponent implements OnInit, OnDestroy {
  horizontalNavbar: boolean;
  rightNavbar: boolean;
  hiddenNavbar: boolean;
  languages: any;
  navigation: any;
  selectedLanguage: any;
  userName: string;
  userStatusOptions: any[];

  private unsubscribeAll: Subject<any>;

  constructor(
    private fuseConfigService: FuseConfigService,
    private fuseSidebarService: FuseSidebarService,
    private translateService: TranslateService,
    private navService: FuseNavigationService
  ) {
    // Set the defaults
    this.userStatusOptions = [
      {
        title: 'Online',
        icon: 'icon-checkbox-marked-circle',
        color: '#4CAF50'
      },
      {
        title: 'Away',
        icon: 'icon-clock',
        color: '#FFC107'
      },
      {
        title: 'Do not Disturb',
        icon: 'icon-minus-circle',
        color: '#F44336'
      },
      {
        title: 'Invisible',
        icon: 'icon-checkbox-blank-circle-outline',
        color: '#BDBDBD'
      },
      {
        title: 'Offline',
        icon: 'icon-checkbox-blank-circle-outline',
        color: '#616161'
      }
    ];

    this.languages = [
      {
        id: 'en',
        title: 'English',
        flag: 'us'
      },
      {
        id: 'tr',
        title: 'Turkish',
        flag: 'tr'
      }
    ];

    this.navigation = this.navService.getCurrentNavigation();

    // Set the private defaults
    this.unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    // Subscribe to the config changes
    this.fuseConfigService.config
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(settings => {
        this.horizontalNavbar = settings.layout.navbar.position === 'top';
        this.rightNavbar = settings.layout.navbar.position === 'right';
        this.hiddenNavbar = settings.layout.navbar.hidden === true;
      });

    SpConfig.cfgMy.subscribe(cfg => {
      this.userName = `${cfg.profileProps.LastName}, ${
        cfg.profileProps.FirstName
      }`;
    });
    // Set the selected language from default languages
    this.selectedLanguage = _.find(this.languages, {
      id: this.translateService.currentLang
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  toggleSidebarOpen(key): void {
    this.fuseSidebarService.getSidebar(key).toggleOpen();
  }

  search(value): void {
    // Do your search here...
    console.log(value);
  }

  setLanguage(lang): void {
    // Set the selected language for the toolbar
    this.selectedLanguage = lang;

    // Use the selected language for translations
    this.translateService.use(lang.id);
  }
}
