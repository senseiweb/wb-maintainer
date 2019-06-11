import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { FuseNavigation } from '@fuse/types';

export class SpConfig {
  static cfgWebApplicationSite = 'http://localhost:4202';

  /** Dynamically added by App initializer to determine the URL location */
  static cfgSharepointMainAppSite = '';

  // static cfgWebApplicationSite = 'https://usaf.dps.mil/teams/5MXG-WM';
  // static cfgSharepointMainAppSite = 'https://usaf.dps.mil/teams/5MXG-WM';
  static cfgFuseNavService: FuseNavigationService;
  static spClientCtx: SP.ClientContext;
  static spWeb: SP.Web;
  static cfgMy: {
    id: string;
    lastName: string;
    firstName: string;
    spAccountName: string;
    profileProps: any;
    spGroups: Array<{ id: number; title: string }>;
  } = {
    id: 'Not Set',
    lastName: 'Not Set',
    firstName: 'Not Set',
    spAccountName: 'Not Set',
    profileProps: {},
    spGroups: []
  };

  static basicNavStructure: FuseNavigation[] = [
    {
      id: 'global',
      title: 'Global',
      type: 'item',
      icon: 'person',
      url: '/home'
    }
  ];
}
