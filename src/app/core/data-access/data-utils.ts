// import { SpConfig } from '../config/app-config';
// import { IBreezeScaffoldProto } from '@app_types/entity-extension';
// import { BehaviorSubject } from 'rxjs';
// import { Injectable } from '@angular/core';
// import { DataAccessModule } from './data-access.module';

// @Injectable({ providedIn: DataAccessModule })
// export class DataUtils {
//   isSaving: BehaviorSubject<boolean> = new BehaviorSubject(false);

//   cfgFeatureSpAppSite = (appName: string): string => {
//     const site = `${
//       SpConfig.cfgSharepointMainAppSite
//     }/mx-maintainer/${appName}/_api/`;
//     return site.replace('mx-maintainer//', 'mx-maintainer/');
//   };

//   cfgApiAddress = (appName: string): string => {
//     const site = `${
//       SpConfig.cfgWebApplicationSite
//     }/mx-maintainer/${appName}/_api/`;
//     return site.replace('mx-maintainer//', 'mx-maintainer/');
//   };
// }
