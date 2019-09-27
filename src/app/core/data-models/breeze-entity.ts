import {
  EntityAspect,
  DataType,
  Entity,
  EntityType,
  SaveResult,
  EntityManager
} from 'breeze-client';
import * as _l from 'lodash';
import {
  IBzEntity,
  IBzCustomEntityType,
  RelatedEntityKind,
  RelatedEntityShortName,
  IAppFormGroup
} from '@app_types';
import { BzEntityProp } from '../decorators';
import Swal, { SweetAlertOptions } from 'sweetalert2';
import { stat } from 'fs';

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

  applyFormChanges(formGroup: IAppFormGroup<Partial<this>>): void {
    const fgControls = formGroup.controls;

    const props = Object.getOwnPropertyNames(fgControls).filter(
      prop => prop in this
    );

    for (const prop of props) {
      if (this[prop] === fgControls[prop].value) {
        continue;
      }
      this[prop] = fgControls[prop].value;
    }
  }

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

  async cancelChanges(withConfirmation = true): Promise<boolean> {
    const state = this.entityAspect.entityState;
    /**
     * Check if a non-new item has even been modified. If not
     * exit the operation successfully.
     */
    if (!state.isAdded() && !state.isModified()) {
      return true;
    }

    if (withConfirmation) {
      const alertConfig: SweetAlertOptions = {
        title: 'Cancel Changes?',
        type: 'question',
        showCancelButton: true,
        showConfirmButton: true,
        cancelButtonText: 'No, continue editing',
        confirmButtonText: 'Yes, reject changes'
      };
      const result = await Swal.fire(alertConfig);
      if (result.dismiss === Swal.DismissReason.cancel) {
        return false;
      }
    }
    this.entityAspect.rejectChanges();
    return true;
  }

  async delete(
    withConfirmation = true,
    addMessage?: string,
    delaySave = false
  ): Promise<boolean> {
    /**
     * Need to get ahold of the entity manager before setting
     * a deletion action...it will be unavailable the deletion
     * command is called.
     */
    // const em = this.entityAspect.entityManager;

    if (withConfirmation) {
      const config: SweetAlertOptions = {
        title: 'Confirm Deletion?',
        text: addMessage || `Are you sure? This action is permanent.`,
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      };

      const result = await Swal.fire(config);

      if (result.dismiss === Swal.DismissReason.cancel) {
        return false;
      }
    }

    this.entityAspect.setDeleted();

    if (!delaySave) {
      await this.save();
    }

    return true;
  }

  async save(entityManager?: EntityManager): Promise<SaveResult | void> {
    /**
     * In case save is called after a deletion, pass in a reference to
     * the em before the item was deleted.
     */
    const em = entityManager || this.entityAspect.entityManager;

    if (!em) {
      throw new Error('Unable to save entity, Cannot locate related manager!');
    }
    if (this.entityAspect.entityState.isUnchanged()) {
      return;
    }
    em.isSaving.next(true);
    const saveResult = await em
      .saveChanges([(this as any) as Entity])
      .finally(() => {
        em.isSaving.next(false);
      });
    return saveResult;
  }
}
