import { SpConfig } from '../config/app-config';
import { IBreezeScaffoldProto } from '@app_types/entity-extension';

export const enum MxmAppName {
  Aagt
}

// tslint:disable-next-line: ban-types
export const MxmAssignedModels = new Map<
  MxmAppName | 'Global',
  IBreezeScaffoldProto[]
>();

export const cfgFeatureSpAppSite = (appName: string): string => {
  const site = `${
    SpConfig.cfgSharepointMainAppSite
  }/mx-maintainer/${appName}/_api/`;
  return site.replace('mx-maintainer//', 'mx-maintainer/');
};

export const cfgApiAddress = (appName: string): string => {
  const site = `${
    SpConfig.cfgWebApplicationSite
  }/mx-maintainer/${appName}/_api/`;
  return site.replace('mx-maintainer//', 'mx-maintainer/');
};
