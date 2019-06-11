import { Injectable } from '@angular/core';
import { CoreModule } from '@angular/flex-layout';
import { BehaviorSubject } from 'rxjs';
import { FuseNavigation } from '@fuse/types';

@Injectable({ providedIn: CoreModule })
export class AppNavigationService {
  currentNavMenu = new BehaviorSubject<FuseNavigation[]>([] as any);

  private aagtNavStructure: FuseNavigation = {
    id: 'aagt',
    title: 'Aircraft/Armanent Generation',
    type: 'group',
    children: [
      {
        id: 'aagtGenList',
        title: 'Geneartion List',
        type: 'item',
        icon: 'reciept',
        url: 'aagt/generation-list'
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
            url: 'aagt/generation/planner'
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

  constructor() {}

  initNav(): void {
    this.currentNavMenu.next([]);
  }

  addAagt(isPlanner: boolean): void {
    if (!isPlanner) {
      this.aagtNavStructure.children.splice(1, 1);
    }
    const existingNav = this.currentNavMenu.value;
    this.currentNavMenu.next([...existingNav, this.aagtNavStructure]);
  }
}
