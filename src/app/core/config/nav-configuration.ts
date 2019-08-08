import { FuseNavigation } from '@fuse/types';

export const basicNavStructure: FuseNavigation = {
  id: 'global',
  title: 'Global Applications',
  type: 'group',
  children: [
    {
      icon: 'person',
      url: '/home',
      title: 'Home',
      type: 'item',
      id: 'globalHomeDash'
    }
  ]
};

export const aagtNavStructure: FuseNavigation = {
  id: 'aagt',
  title: 'Aircraft/Armanent Generation',
  type: 'group',
  children: [
    {
      id: 'aagtGenList',
      title: 'Geneartion List',
      type: 'item',
      icon: 'reciept',
      url: 'aagt/generations'
    },
    {
      id: 'aagtGenManager',
      icon: 'web',
      type: 'collapsable',
      title: 'Generation Manager',
      children: [
        {
          id: 'aagtGenMgrPlanner',
          title: 'Generation Planner',
          type: 'item',
          url: 'aagt/plan-generation/new'
        },
        {
          id: 'aagtGenMgrActionMgr',
          title: 'Action Item Manager',
          type: 'item',
          url: 'aagt/gen-manager/action-management',
          exactMatch: true
        },
        {
          id: 'aagtGenMgrTeamMgr',
          title: 'Team Manager',
          type: 'item',
          url: 'aagt/gen-manager/team-management'
        }
      ]
    }
  ]
};
