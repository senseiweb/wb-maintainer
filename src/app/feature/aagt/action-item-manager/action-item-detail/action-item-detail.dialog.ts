import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Subject, BehaviorSubject } from 'rxjs';
import Swal, { SweetAlertOptions } from 'sweetalert2';

import { filter, takeUntil, debounceTime } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { ActionItem, AagtUowService } from '../../aagt-core';
import { IAppFormGroup } from '@app_types';
import {
  ToolbarService,
  LinkService,
  ImageService,
  HtmlEditorService,
  RichTextEditorComponent
} from '@syncfusion/ej2-angular-richtexteditor';
import { EntityManager } from 'breeze-client';
import { SpChoiceResult } from 'app/core';

type CategoryFormMode = 'edit' | 'select' | 'add';
type ActionItemModelProps =
  | keyof Pick<
      ActionItem,
      | 'action'
      | 'shortCode'
      | 'duration'
      | 'resourceCategory'
      | 'assignable'
      | 'notes'
    >
  | 'addEditCategory';

type ActionItemFormModel = { [key in ActionItemModelProps]: FormControl };

@Component({
  selector: 'app-asset-detail-dialog',
  templateUrl: './action-item-detail.dialog.html',
  styleUrls: ['./action-item-detail.dialog.scss'],
  providers: [ToolbarService, LinkService, HtmlEditorService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations
})
export class ActionItemDetailDialogComponent implements OnInit, OnDestroy {
  @ViewChild('aiRteObj', { static: false })
  notesRte: RichTextEditorComponent;
  actionItem: ActionItem;
  actionItemFormGroup: IAppFormGroup<ActionItemFormModel>;
  categories: string[];
  categoryFormMode: CategoryFormMode;
  isExistingCategory = false;
  dialogTitle: string;
  duration: number;
  private em: EntityManager;
  formMode: 'edit' | 'add';
  makeAvail: string;
  newCategoryHint: string;
  formattedDuration: string;
  isDeleting = false;
  isEditing = false;
  isSaving: BehaviorSubject<boolean>;

  constructor(
    private dialogRef: MatDialogRef<ActionItemDetailDialogComponent>,
    private formBuilder: FormBuilder,
    private cdRef: ChangeDetectorRef,
    private uow: AagtUowService,
    @Inject(MAT_DIALOG_DATA)
    private dialogData: [ActionItem]
  ) {
    this.unsubscribeAll = new Subject();
  }

  private formModelProps: Array<ActionItemModelProps> = [
    'action',
    'resourceCategory',
    'assignable',
    'duration',
    'shortCode',
    'notes',
    'addEditCategory'
  ];
  private unsubscribeAll: Subject<any>;

  ngOnInit() {
    this.actionItem = this.dialogData[0];
    this.categories = [...this.uow.getAllActionItemCategories()].sort();

    this.isSaving = this.actionItem.entityAspect.entityManager.isSaving;

    if (this.actionItem.entityAspect.entityState.isAdded()) {
      this.formMode = 'add';
      this.dialogTitle = 'Add New Action Item';
    } else {
      this.formMode = 'edit';
      this.dialogTitle = `Edit Action Item ${this.actionItem.shortCode}`;
    }

    this.categoryFormMode = 'select';
    this.createFormGroupAndValidators();
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  addCategory(): void {
    const fgControls = this.actionItemFormGroup.controls;
    this.categoryFormMode = 'add';
    fgControls.addEditCategory.reset('',  {emitEvent: false});
  }

  async cancelChanges(): Promise<void> {
    const cancelChanges = await this.actionItem.cancelChanges();
    if (cancelChanges) {
      this.dialogRef.close();
    }
  }

  cancelCategoryChanges(): void {
    const fgControls = this.actionItemFormGroup.controls;
    this.categoryFormMode = 'select';
  }

  async confirmDelete(): Promise<void> {
    await Swal.fire('Deleted!', 'Item has been deleted', 'success');
  }

  createFormGroupAndValidators(): void {
    const actionItem = this.dialogData[0];

    const formModel: Partial<ActionItemFormModel> = {};

    this.formModelProps.forEach(prop => {
      const defaultProp = actionItem ? actionItem[prop] : '';
      formModel[prop] = new FormControl(defaultProp, { updateOn: 'blur' });
    });

    this.actionItemFormGroup = this.formBuilder.group(formModel) as any;

    actionItem.entityType.custom.setFormValidators(
      this.actionItemFormGroup,
      actionItem
    );

    const fgControls = this.actionItemFormGroup.controls;

    fgControls.addEditCategory.valueChanges
      .pipe(
        debounceTime(150),
        takeUntil(this.unsubscribeAll)
      )
      .subscribe(value => {
        const frmControl = fgControls.addEditCategory;
        this.isExistingCategory = this.categories.some(
          cat => cat.toLocaleLowerCase() === value.toLowerCase()
        );

        if (this.isExistingCategory) {
          frmControl.setValidators([
            Validators.required,
            () => ({ dupResCatName: true })
          ]);
        } else {
          frmControl.setValidators([Validators.required]);
        }
        frmControl.updateValueAndValidity();
      });

    fgControls.duration.valueChanges
      .pipe(
        debounceTime(150),
        takeUntil(this.unsubscribeAll)
      )
      .subscribe(value => {
        this.duration = value;
      });
  }

  async deleteResourceCategory(): Promise<void> {
    const alertCfg: SweetAlertOptions = {
      type: 'question',
      title: 'Delete Category?',
      text:
        'This will only affect future selections, previous uses of the category will be unaffected',
      showCancelButton: true,
      cancelButtonText: 'No, keep it',
      showConfirmButton: true,
      confirmButtonText: 'Yes, delete it'
    };

    const confirmationResult = await Swal.fire(alertCfg);

    if (!confirmationResult.value) {
      return;
    }

    this.isDeleting = true;
    this.cdRef.markForCheck();

    await this.saveCategoryChanges();
  }

  async deleteItem(): Promise<void> {
    const confirmedDelete = await this.actionItem.delete(
      true,
      undefined,
      false
    );
    if (confirmedDelete) {
      const config: SweetAlertOptions = {
        type: 'success',
        title: 'Deleted!',
        timer: 2500
      };
      await Swal.fire(config);
      this.dialogRef.close();
    }
  }

  async editResourceCategory(): Promise<void> {
    this.categoryFormMode = 'edit';
    this.isExistingCategory = true;
    const fgControls = this.actionItemFormGroup.controls;
    fgControls.addEditCategory.reset(fgControls.resourceCategory.value, {emitEvent: false});
  }

  async saveCategoryEdits(): Promise<void> {
    const fgControls = this.actionItemFormGroup.controls;

    const oldResourceCategoryName = fgControls.resourceCategory.value;

    let alertCfg: SweetAlertOptions = {
      type: 'question',
      title: `Edit Category:
      ${oldResourceCategoryName}?`,
      text: `This will globally update ALL Action Items that have the same resource category name.
       This may take awhile, are you sure?`,
      showCancelButton: true,
      cancelButtonText: 'No, cancel changes',
      showConfirmButton: true,
      confirmButtonText: 'Yes, change ALL'
    };

    const confirmationResult = await Swal.fire(alertCfg);

    if (!confirmationResult.value) {
      return;
    }

    const newCategoryName = fgControls.addEditCategory.value;
    const allEntities = await this.uow.getallActionItemByCategory(
      oldResourceCategoryName
    );

    allEntities.forEach(entity => (entity.resourceCategory = newCategoryName));

    const saveResult = await this.uow.saveUnitOfWork(allEntities);

    this.categoryFormMode = 'select';

    alertCfg = {
      type: 'info',
      title: 'Update Complete',
      text: `Outcome of changes:\n
      ${saveResult.entities.length} Items Suceeded \n
      ${saveResult.entitiesWithErrors.length} Items Failed:`
    };

    if (saveResult.entitiesWithErrors.length) {
      await Swal.fire(alertCfg);
      return;
    }

    alertCfg.text = `All ${saveResult.entities.length} items were updated successfully!`;
    this.isEditing = true;
    this.cdRef.markForCheck();
    await this.saveCategoryChanges().finally(() => {
      this.isEditing = false;
    });
  }

  async saveCategoryChanges(): Promise<void> {
    if (this.categoryFormMode === 'edit') {
      return this.saveCategoryEdits();
    }

    // need to preserve whether we are deleting or not after the finally statement.
    const isDeletionMode = this.isDeleting;
    const fgControls = this.actionItemFormGroup.controls;
    let categoryBeingChanged: string;
    let pendingNewCategores = [...this.categories];

    // In case deleteCategories calls the save category changes method
    if (isDeletionMode) {
      categoryBeingChanged = fgControls.resourceCategory.value;
      pendingNewCategores = this.categories.filter(
        cat => cat !== categoryBeingChanged
      );
    } else if (this.isEditing) {
      const oldCategory = fgControls.resourceCategory.value;
      const renamedCategory = fgControls.addEditCategory.value;
      const itemIdx = this.categories.findIndex(cat => cat === oldCategory);
      this.categories.splice(itemIdx, 1, renamedCategory);
      pendingNewCategores = this.categories;
      categoryBeingChanged = renamedCategory;
    } else {
      categoryBeingChanged = fgControls.addEditCategory.value;
      pendingNewCategores.push(categoryBeingChanged);
    }

    try {
      pendingNewCategores = await this.uow.updateResourceCategories(
        pendingNewCategores
      );
    } catch (e) {
      Swal.fire(
        'Unsucessful',
        'An error occurred trying to save your changes...please try again or contact support for assistance',
        'error'
      );
      console.error(e);
    } finally {
      this.isDeleting = false;
    }

    this.categories = [...pendingNewCategores];

    this.actionItemFormGroup.patchValue({
      resourceCategory: isDeletionMode ? '' : categoryBeingChanged,
      addEditCategory: ''
    });

    this.categoryFormMode = 'select';
  }

  async saveChanges(del: string): Promise<void> {
    if (this.categoryFormMode !== 'select') {
      await Swal.fire(
        'Unsaved Category',
        'Please save or cancel changes to the resource category before continuing',
        'info'
      );
      return;
    }

    this.actionItem.applyFormChanges(this.actionItemFormGroup);

    try {
      await this.actionItem.save();
      const config: SweetAlertOptions = {
        type: 'success',
        title: 'Update Success',
        timer: 2500
      };
      await Swal.fire(config);
      this.dialogRef.close();
    } catch (e) {
      console.log(e);
    }
  }
}
