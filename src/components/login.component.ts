import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentStore } from '../services/tournament.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div class="w-full max-w-md p-8 space-y-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative">
        
        <!-- Back Button -->
        <button (click)="goHome()" class="absolute top-4 left-4 text-slate-500 hover:text-white transition-colors">
            <i class="fas fa-arrow-left"></i>
        </button>

        <div class="text-center mt-4">
          <div class="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-[#ccff00]/10 mb-6 border border-[#ccff00]/20 shadow-[0_0_20px_rgba(204,255,0,0.1)]">
            <i class="fas fa-tennis-ball text-4xl text-[#ccff00]"></i>
          </div>
          <h2 class="text-3xl font-bold text-white tracking-tight font-['Chakra_Petch']">ADMIN <span class="text-[#ccff00]">PORTAL</span></h2>
          <p class="mt-2 text-sm text-slate-400">Secure access for tournament organizers</p>
        </div>
        
        <form class="mt-8 space-y-6" (ngSubmit)="onLogin()">
          <div class="space-y-4">
            <div>
              <label for="email" class="sr-only">Email address</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="fas fa-envelope text-slate-500"></i>
                </div>
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  [(ngModel)]="email" 
                  required 
                  class="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-lg leading-5 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#ccff00] focus:border-transparent sm:text-sm transition-all" 
                  placeholder="Email address"
                >
              </div>
            </div>
            <div>
              <label for="password" class="sr-only">Password</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="fas fa-lock text-slate-500"></i>
                </div>
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  [(ngModel)]="password" 
                  required 
                  class="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-lg leading-5 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#ccff00] focus:border-transparent sm:text-sm transition-all" 
                  placeholder="Password"
                >
              </div>
            </div>
          </div>

          @if (error()) {
            <div class="text-red-400 text-sm text-center bg-red-900/20 border border-red-900/50 p-3 rounded-lg animate-pulse">
              <i class="fas fa-exclamation-circle mr-1"></i> {{ error() }}
            </div>
          }

          <div>
            <button 
              type="submit" 
              class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-black bg-[#ccff00] hover:bg-[#b3e600] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ccff00] focus:ring-offset-slate-900 transition-all uppercase tracking-wide shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:shadow-[0_0_25px_rgba(204,255,0,0.5)]"
            >
              Enter Dashboard
            </button>
          </div>
        </form>
        
        <div class="relative">
            <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-slate-700"></div>
            </div>
            <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-slate-900 text-slate-500">or</span>
            </div>
        </div>

        <div class="text-center">
             <button (click)="goHome()" class="text-slate-400 hover:text-white text-sm font-medium transition-colors">
                Back to Public Tournaments
             </button>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  store = inject(TournamentStore);
  email = '';
  password = '';
  error = signal('');

  async onLogin() {
    if (this.email && this.password) {
      const success = await this.store.login(this.email, this.password);
      if (success) {
          this.error.set('');
      } else {
          this.error.set('Invalid credentials. Please check your email and password.');
      }
    } else {
      this.error.set('Please enter email and password.');
    }
  }

  goHome() {
      this.store.goHome();
  }
}