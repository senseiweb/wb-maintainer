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

export interface ITriggerActionItemShell {
  id?: number;
  sequence?: number;
  shortCode?: string;
  action?: string;
  duration?: number;
  formattedDuration: string;
  teamCategory?: string;
}

@BzEntity()
export class TriggerAction extends SharepointEntity {
  readonly shortname = 'triggerAction';

  /**
   * When used, indicates that child entity will be deleted
   * during the next save operation. Prefer to use this method
   * when entities may be deleted and restored several times
   * before actual saving is done to store.
   *
   * Used instead of Breeze internal setDeleted() method becuase
   * setDeleted() assume the entity will not longer be reference, '
   * which cases all child and parent references to this entity
   * be dropped and a pain in the butt to be recovered later.
   */
  isSoftDeleted?: boolean;

  private _sequence: number;

  @BzEntityProp('data')
  title?: string;

  @BzEntityProp('data')
  totalExecutedTime?: number;

  @BzEntityProp('data')
  averageExecutedTime?: number;

  @BzEntityProp('data')
  get sequence(): number {
    return this._sequence;
  }
  set sequence(newSequence: number) {
    this.assetTriggerActions.forEach(ata => {
      if (!ata.sequence || ata.sequence === this._sequence) {
        ata.sequence = newSequence;
      }
    });

    this._sequence = newSequence;
  }

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

  @BzEntityInitializer
  protected initializer(entity: this) {
    entity.title = entity.title || `Gen Trigger: ${entity.generation.title}`;
  }
}
