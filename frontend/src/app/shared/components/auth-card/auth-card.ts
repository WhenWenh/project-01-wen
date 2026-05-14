import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-auth-card',
  standalone: true,
  imports: [CardModule],
  templateUrl: './auth-card.html',
  styleUrl: './auth-card.css'
})
export class AuthCardComponent {}
