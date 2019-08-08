import { EntityAspect, DataType } from 'breeze-client';
import * as _l from 'lodash';
import {
  IBzEntity,
  IBzCustomEntityType,
  RelatedEntityKind,
  RelatedEntityShortName
} from '@app_types';
import { BzEntityProp } from '../decorators';

export abstract class BreezeEntity implements IBzEntity {
  abstract readonly shortname: string;

  isSoftDeleted?: boolean;

  @BzEntityProp('data', {
    dataCfg: {
      isPartOfKey: true,
      dataType: DataType.Int16
    }
  })
  id?: number | string;
  entityAspect: EntityAspect;
  entityType: IBzCustomEntityType;

  /**
   * Shortcut method for getting an Entity Type based
   * on related existing type.
   * Keeps us from creating an entity just to get ahold
   * of its entity type i.e. for form validation thats located
   * on the entity type.
   */
  getRelatedEntityType = <TRelatedEntity extends RelatedEntityShortName<this>>(
    relatedEntity: TRelatedEntity
  ): IBzCustomEntityType => {

    relatedEntity = _l.upperFirst(relatedEntity) as any;

    return (this.entityType.metadataStore.getEntityType(
      relatedEntity
    ) as any) as IBzCustomEntityType;
  };
}
