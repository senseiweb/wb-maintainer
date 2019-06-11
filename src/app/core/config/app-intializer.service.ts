import { Injectable } from '@angular/core';
import { SpConfig } from './app-config';
import { AppNavigationService } from './nav-config.service';
import { CoreModule } from '@angular/flex-layout';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';

@Injectable({ providedIn: CoreModule })
export class AppInitializerService {
  initNav(navService: FuseNavigationService) {
    return new Promise((resolve, reject) => {
      navService.register('default', SpConfig.basicNavStructure);
      navService.setCurrentNavigation('default');
      resolve();
    });
  }

  constructor(private navService: AppNavigationService) {}

  async initSpContext(): Promise<() => Promise<void>> {
    return new Promise((resolve, reject) => {
      this.navService.initNav();
      resolve();
    });
    // return new Promise((resolve, reject) => {
    //   const spoContext = SP.ClientContext.get_current();
    //   const spoWeb = spoContext.get_web();
    //   spoContext.load(spoWeb);
    //   spoContext.executeQueryAsync(
    //     (sender, args) => {
    //       SpConfig .cfgSharepointMainAppSite = spoWeb.get_url();
    //       SpConfig.spClientCtx = spoContext;
    //       SpConfig.spWeb = spoWeb;
    //       resolve();
    //       // cfgFetchUserData().then(() => {
    //       //   cfgSetNavStructure();
    //       //   resolve(true);
    //       // });
    //     },
    //     () => reject(false)
    //   );
    // });
  }
}
