import {
  SharepointEntity,
  BzEntity,
  BzEntityProp,
  BreezeEntity,
  BzEntityInitializer
} from 'app/core';
import { ActionItem } from './action-item';
import { AssetTriggerAction } from './asset-trigger-action';
import { Trigger } from './trigger';
import { Generation } from './generation';
import * as _m from 'moment';
import * as _l from 'moment';
import 'moment-duration-format';
import { DataType } from 'breeze-client';

export interface ITriggerActionItemShell {
  id?: number;
  sequence?: number;
  shortCode?: string;
  action?: string;
  duration?: number;
  formattedDuration: string;
  teamCategory?: string;
}

export interface ITrigActDependents {
  dependType: string;
  offset: number;
  offsetUnit: string;
  trigAct: TriggerAction;
}

@BzEntity()
export class TriggerAction extends SharepointEntity {
  readonly shortname = 'triggerAction';

  // private _dependsOn: string;

  @BzEntityProp('data')
  title?: string;

  @BzEntityProp('data')
  totalExecutedTime?: number;

  @BzEntityProp('data')
  averageExecutedTime?: number;

  @BzEntityProp('data')
  sequence: number;

  // @BzEntityProp('data', {
  //   dataCfg: {
  //     dataType: DataType.String
  //   }
  // })
  // get dependsOn() {
  //   return this.taskDependsOn ? JSON.stringify(this.taskDependsOn) : '';
  // }

  @BzEntityProp('data')
  actionItemId: number;

  @BzEntityProp('data')
  triggerId: number;

  /**
   * Typically not recommded to put multiple ancestiral refernces
   * on the same entity, i.e. parent, grandparent, or great
   * grand parent, however,  querying deep entity graphs sucks in
   * sharepoint, so put a reference here to the top level
   * generations to simplify querying
   */
  @BzEntityProp('data')
  generationId: number;

  @BzEntityProp('nav', {
    navCfg: {
      isScalar: true
    },
    relativeEntity: 'actionItem'
  })
  actionItem: ActionItem;

  @BzEntityProp('nav', {
    relativeEntity: 'trigger',
    navCfg: {
      isScalar: true
    }
  })
  trigger: Trigger;

  @BzEntityProp('nav', {
    relativeEntity: 'assetTriggerAction'
  })
  assetTriggerActions: AssetTriggerAction[];

  @BzEntityProp('nav', {
    relativeEntity: 'generation',
    navCfg: {
      isScalar: true
    }
  })
  generation: Generation;

  /**
   * The following properties are used
   * to support transforming and optimizing the
   * entity for displaying in Gantt Chart format.
   */
  // private _taskEnd: Date;


  // get taskId(): string {
  //   /**
  //    * The Syncfusion Gantt chart does not
  //    * handle the negative component of a
  //    * number...and all breezejs temp id are
  //    * negative numbers. this will help compensate
  //    * for the differences.
  //    */
  //   // The Syncfusion gantt chart does not
  //   const id = Math.abs(this.triggerId) + '' + this.sequence;
  //   return id;
  // }

  // set taskId(id: string) {}

  // get taskStart(): Date {
  //   return this.sequence === 1
  //     ? this.trigger && this.trigger.triggerStart
  //     : this.previousTask.taskEnd;
  // }

  // set taskStart(date: Date) {}

  // get taskEnd(): Date {
  //   return this._taskEnd
  //     ? this._taskEnd
  //     : _m(this.taskStart)
  //         .add(this.actionItem && this.actionItem.duration, 'm')
  //         .toDate();
  // }

  // set taskEnd(date: Date) {}

  // get taskName(): string {
  //   return this.actionItem ? this.actionItem.action : undefined;
  // }

  // set taskName(name: string) {}

  // get taskDuration(): number {
  //   return this.actionItem ? this.actionItem.duration : 0;
  // }

  // set taskDuration(duration: number) {}

  // get taskMilestone(): string {
  //   return this.trigger ? this.trigger.milestone : undefined;
  // }

  // set taskMilestone(milestone: string) {}

  // get taskDependents() {
  //   if (this.taskDependsOn.length) {
  //     return this.taskDependsOn as any;
  //   }
  //   return this.sequence === 1 ? undefined : this.previousTask.taskId;
  // }

  // set taskDependents(td: string) {}

  // taskDependsOn: ITrigActDependents[];

  // get taskFormattedDuration(): string {
  //   if (!this.actionItem) {
  //     return;
  //   }
  //   return (_m.duration(this.actionItem.duration, 'minutes') as any).format(
  //     'd [days], h [hours], m [minutes]'
  //   );
  // }

  // set taskFormattedDuration(val: string) {}

  // get previousTask(): TriggerAction {
  //   return this.trigger
  //     ? this.trigger.triggerActions.find(
  //         ta => ta.sequence === this.sequence - 1
  //       ) || ({} as any)
  //     : ({} as any);
  // }

  @BzEntityInitializer
  protected initializer(entity: this) {
    entity.title = entity.title || `Gen Trigger: ${entity.generation.title}`;
    // if (entity.dependsOn) {
    //   try {
    //     entity.taskDependsOn = JSON.parse(entity.dependsOn);
    //   } catch (e) {
    //     console.log(e);
    //     entity.taskDependsOn = [] as any;
    //   }
    // } else {
    //   entity.taskDependsOn = [] as any;
    // }
  }
}
