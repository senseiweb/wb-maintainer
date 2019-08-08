import { Injectable } from '@angular/core';
import { SpConfig, SpAccessGroups } from './app-config';
import { CoreModule } from '@angular/flex-layout';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { FuseNavigation } from '@fuse/types';
import { basicNavStructure, aagtNavStructure } from './nav-configuration';

@Injectable({ providedIn: CoreModule })
export class AppInitializerService {
  private currentNavStructure: FuseNavigation[] = [];

  addNav(newNavMenu: FuseNavigation): void {
    this.currentNavStructure = [...this.currentNavStructure, newNavMenu];
  }

  initNav(navService: FuseNavigationService) {
    this.addNav(basicNavStructure);
    const groups = SpConfig.cfgMy.value.spGroups;

    if (groups.some(grp => grp.title === SpAccessGroups.aagtViewer)) {
      const isPlanner = groups.some(
        grp => grp.title === SpAccessGroups.aagtPlannner
      );
      const aagtGroup = aagtNavStructure;
      if (!isPlanner) {
        aagtGroup.children.splice(1, 1);
      }
      this.addNav(aagtGroup);
    }

    navService.register('default', this.currentNavStructure);
    navService.setCurrentNavigation('default');
  }

  constructor() {}

  initSpContext(
    navService: FuseNavigationService
  ): Promise<() => Promise<void>> {
    return new Promise((resolve, reject) => {
      if (!SP) {
        reject('Sharepoint Context Not Found');
        throw new Error('Unable to locate Sharepoint Context');
      }
      const spoContext = SP.ClientContext.get_current();
      const spoWeb = spoContext.get_web();
      spoContext.load(spoWeb);
      spoContext.executeQueryAsync(
        async (sender, args) => {
          await this.cfgFetchUserData(navService);
          SpConfig.cfgSharepointMainAppSite = spoWeb.get_url();
          SpConfig.spClientCtx = spoContext;
          SpConfig.spWeb = spoWeb;
          resolve();
          // cfgFetchUserData().then(() => {
          //   cfgSetNavStructure();
          //   resolve(true);
          // });
        },
        () => reject(false)
      );
    });
  }

  async cfgFetchUserData(navService: FuseNavigationService): Promise<void> {
    const spoContext = SP.ClientContext.get_current();
    const peopleManager = new SP.UserProfiles.PeopleManager(spoContext);
    const oUser = spoContext.get_web().get_currentUser();
    oUser.retrieve();
    const groups = oUser.get_groups();
    const props = peopleManager.getMyProperties();
    spoContext.load(oUser);
    spoContext.load(groups);
    spoContext.load(props);
    const myGroups = [{ id: 0, title: 'Genie' }];

    await new Promise((resolve, reject) => {
      spoContext.executeQueryAsync(
        () => {
          const i = groups.getEnumerator();
          while (i.moveNext()) {
            const currGrp = i.get_current();
            myGroups.push({
              title: currGrp.get_title(),
              id: currGrp.get_id()
            });
          }
          console.table(myGroups);
          console.log(props.get_userProfileProperties());

          SpConfig.cfgMy.next({
            profileProps: props.get_userProfileProperties(),
            spGroups: myGroups
          });
          this.initNav(navService);
          resolve();
        },
        () => reject()
      );
    });
  }
}
