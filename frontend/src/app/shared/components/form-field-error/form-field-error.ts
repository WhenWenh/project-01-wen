import { Component, input } from '@angular/core';

@Component({
  selector: 'app-form-field-error',
  standalone: true,
  templateUrl: './form-field-error.html',
  styleUrl: './form-field-error.css'
})
export class FormFieldErrorComponent {
  readonly message = input('');
}
