import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { CanDeactivate } from '@angular/router';
import { ActionItemDetailDialogComponent } from './action-item-detail.dialog';
import Swal, { SweetAlertOptions } from 'sweetalert2';

@Injectable()
export class ActionItemDeactiveGuard
  implements CanDeactivate<ActionItemDetailDialogComponent> {
  constructor(private saveDialog: MatDialog) {}

  async canDeactivate(
    component: ActionItemDetailDialogComponent
  ): Promise<boolean> {
    if (!component) {
      return true;
    }

    const dialogConfig: SweetAlertOptions = {
      title: 'Unsaved Changes',
      text: 'Changes have not been saved',
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove asset!'
    };

    const result = await Swal.fire(dialogConfig);
    if (result.value) {
    }
  }
}
