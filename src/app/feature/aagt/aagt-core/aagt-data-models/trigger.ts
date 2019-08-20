import {
  SharepointEntity,
  BzEntity,
  BzEntityProp,
  BzCustomValidator
} from 'app/core';

import { Validator } from 'breeze-client';
import * as _m from 'moment';
import { Generation } from './generation';
import { TriggerAction } from './trigger-action';

@BzEntity()
export class Trigger extends SharepointEntity {
  readonly shortname = 'trigger';

  @BzEntityProp('data', {
    spInternalName: 'Title',
    dataCfg: {
      isNullable: false
    }
  })
  milestone?: string;

  get completionTime(): number {
    if (!this.triggerActions) {
      return;
    }
    return this.triggerActions
      .map(tra => tra.actionItem.duration)
      .reduce((duration1, duration2) => duration1 + duration2, 0);
  }

  @BzEntityProp('data')
  triggerStart?: Date;

  @BzEntityProp('data')
  triggerStop?: Date;

  @BzEntityProp('data', {
    dataCfg: { isNullable: false }
  })
  generationId: number;

  @BzEntityProp('nav', {
    relativeEntity: 'generation',
    navCfg: {
      isScalar: true
    }
  })
  generation?: Generation;

  @BzEntityProp('nav', {
    relativeEntity: 'triggerAction'
  })
  triggerActions?: TriggerAction[];

  // @BzCustomValidator<Trigger>({
  //   validatorScope: 'entity',
  //   targetedProperty: 'milestone',
  //   reqProps: ['milestone']
  // })
  // protected duplicateTriggerMiles?(): Validator {
  //   const validatorName = 'duplicateTriggerMiles';
  //   const validatorFn = (entity: this, ctx: any): boolean => {
  //     let isValid = true;
  //     if (!ctx || !ctx.milestone) {
  //       return isValid;
  //     }
  //     isValid = !entity.generation.triggers.some(
  //       trig =>
  //         trig.milestone &&
  //         trig.milestone.toLowerCase() === ctx.milestone.toLowerCase()
  //     );
  //     return isValid;
  //   };
  //   const additionalCtx = {
  //     message: context =>
  //       `The milesont "${
  //         context.milestone
  //       }" matches an already existing milestone for this generation!`
  //   };

  //   return new Validator(validatorName, validatorFn, additionalCtx);
  // }
}
