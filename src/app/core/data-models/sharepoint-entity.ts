import { Entity, EntityAspect, EntityType } from 'breeze-client';
import {
  SharepointEntityList,
  SelectedEntityKind,
  EntityChildShortName
} from '@app_types/entity-extension';
import { SharepointMetadata } from './sharepoint-metadata';
import * as _l from 'lodash';
import { SpEntityProp } from '../decorators/sp-entity-annotation/sp-entity-prop.decorator';

export abstract class SharepointEntity implements Entity {
  entityAspect: EntityAspect;
  entityType: EntityType;

  abstract readonly shortname: SharepointEntityList['shortname'];

  @SpEntityProp('data', {
    dataCfg: { isPartOfKey: true }
  })
  id?: number;

  @SpEntityProp('data', {})
  modified?: Date;

  @SpEntityProp('data', {})
  created?: Date;

  @SpEntityProp('data', {})
  authorId?: number;

  @SpEntityProp('data', {})
  editorId?: number;

  @SpEntityProp('data', {
    dataCfg: {
      isNullable: false,
      complexTypeName: '__metadata:#SP.Data'
    }
  })
  // tslint:disable-next-line: variable-name
  __metadata?: SharepointMetadata;

  /**
   * Convientant method for creating child entities for a
   * given parenet.
   */
  createChild = <TChild extends EntityChildShortName<this>>(
    childType: TChild,
    defaultProps?: Partial<SelectedEntityKind<TChild>>
  ): SelectedEntityKind<TChild> => {
    const em = this.entityAspect.entityManager;
    // creates and attaches itself to the current em;
    const props = {};
    props[_l.camelCase(this.shortname)] = this;
    Object.assign(props, defaultProps || {});
    const newEntity = em.createEntity(childType, props);
    return newEntity as SelectedEntityKind<TChild>;
  }
}
