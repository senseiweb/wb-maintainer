import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { FuseNavigation } from '@fuse/types';
import { BehaviorSubject } from 'rxjs';
import { ISPUserProfileProperties } from '@app_types/sharepoint-entities';

export class SpConfig {
  static cfgWebApplicationSite = 'http://localhost:4200';

  /** Dynamically added by App initializer to determine the URL location */
  static cfgSharepointMainAppSite = '';

  // static cfgWebApplicationSite = 'https://usaf.dps.mil/teams/5MXG-WM';
  // static cfgSharepointMainAppSite = 'https://usaf.dps.mil/teams/5MXG-WM';
  static cfgFuseNavService: FuseNavigationService;
  static spClientCtx: SP.ClientContext;
  static spWeb: SP.Web;
  static cfgMy: BehaviorSubject<{
    profileProps: ISPUserProfileProperties;
    spGroups: Array<{ id: number; title: string }>;
  }> = new BehaviorSubject({
    profileProps: {},
    spGroups: []
  });

  static inSavingState: BehaviorSubject<boolean> = new BehaviorSubject(false);
}
/**
 * Determines which applications are display in the nav
 * pane. These are directly related to the respective
 * groups in sharepoint. If the group name changes in
 * sharepoint these should be also updated.
 */
export enum SpAccessGroups {
  aagtViewer = 'wbmx_aagt_viewer',
  aagtPlannner = 'wbmx_aagt_planner'
}
