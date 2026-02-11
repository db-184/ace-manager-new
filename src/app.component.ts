import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentStore } from './services/tournament.store';
import { LoginComponent } from './components/login.component';
import { SetupComponent } from './components/setup.component';
import { GroupsComponent } from './components/groups.component';
import { ScheduleComponent } from './components/schedule.component';
import { ScoresComponent } from './components/scores.component';
import { KnockoutComponent } from './components/knockout.component';
import { PublicViewComponent } from './components/public-view.component';
import { LandingComponent } from './components/landing.component';
import { AdminDashboardComponent } from './components/admin-dashboard.component';
import { TournamentSummaryComponent } from './components/tournament-summary.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    LoginComponent, 
    SetupComponent, 
    GroupsComponent, 
    ScheduleComponent, 
    ScoresComponent,
    KnockoutComponent,
    PublicViewComponent,
    LandingComponent,
    AdminDashboardComponent,
    TournamentSummaryComponent
  ],
  template: `
    @switch (store.currentView()) {
        @case ('landing') {
            <app-landing />
        }
        @case ('public') {
            <app-public-view />
        }
        @case ('login') {
            <app-login />
        }
        @case ('admin') {
            @if(store.adminState() === 'hub') {
                <app-admin-dashboard />
            } @else {
                <div class="min-h-screen flex flex-col bg-slate-950 text-slate-200 selection:bg-[#ccff00] selection:text-black">
                    <!-- Header -->
                    <header class="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-lg shadow-black/20">
                       <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                         <div class="flex justify-between items-center h-16">
                           <div class="flex items-center">
                             <button (click)="store.backToHub()" class="mr-4 text-slate-400 hover:text-white transition-colors flex items-center text-sm font-medium">
                                <i class="fas fa-chevron-left mr-1"></i> Hub
                             </button>
                             <div class="w-10 h-10 bg-[#ccff00] rounded-lg flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(204,255,0,0.3)]">
                                <i class="fas fa-tennis-ball text-slate-900 text-2xl"></i>
                             </div>
                             <span class="font-bold text-2xl tracking-tight text-white font-['Chakra_Petch']">ACE<span class="text-[#ccff00]">MANAGER</span></span>
                             @if (store.settings().name) {
                                <span class="hidden md:inline text-slate-600 mx-3">|</span>
                                <span class="hidden md:inline text-sm font-medium text-[#ccff00] tracking-wider uppercase">{{ store.settings().name }}</span>
                             }
                           </div>
                           <div class="flex items-center space-x-6">
                             <span class="text-sm text-slate-400 hidden sm:block font-mono bg-slate-800 px-3 py-1 rounded">{{ store.currentUser() }}</span>
                             <button (click)="store.logout()" class="text-sm text-slate-400 hover:text-white transition-colors font-medium">
                                <i class="fas fa-power-off mr-2"></i> Sign Out
                             </button>
                           </div>
                         </div>
                       </div>
                    </header>

                    <!-- Main Content Wizard -->
                    <main class="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-slate-950 relative">
                        <!-- CSS Grid Pattern Background -->
                        <div class="absolute inset-0 z-0 opacity-20 pointer-events-none" 
                             style="background-image: radial-gradient(#334155 1px, transparent 1px); background-size: 24px 24px;">
                        </div>
                        
                        <div class="relative z-10">
                            @switch (store.currentStep()) {
                                @case (0) { <app-tournament-summary /> }
                                @case (1) { <app-setup /> }
                                @case (2) { <app-groups /> }
                                @case (3) { <app-schedule /> }
                                @case (4) { <app-scores /> }
                                @case (5) { <app-knockout /> }
                            }
                        </div>
                    </main>
                    
                    <!-- Footer -->
                    <footer class="bg-slate-900 border-t border-slate-800 py-6 relative z-10">
                       <div class="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 font-mono">
                          &copy; 2024 AceManager Tournament System. Powered by GenAI.
                       </div>
                    </footer>
                </div>
            }
        }
    }
  `
})
export class AppComponent {
  store = inject(TournamentStore);
}