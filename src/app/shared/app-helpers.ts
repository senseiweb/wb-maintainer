import { FormControl, FormBuilder, FormGroupDirective } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material';

export class FormLvlErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && form.invalid && (control.dirty || control.touched || isSubmitted));
  }
}
