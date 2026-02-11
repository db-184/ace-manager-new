import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentStore } from '../services/tournament.store';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-950 flex flex-col text-slate-200 font-sans selection:bg-[#ccff00] selection:text-black">
      <!-- Navbar -->
      <nav class="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <!-- Logo -->
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-[#ccff00] rounded flex items-center justify-center shadow-[0_0_10px_#ccff00]">
                        <i class="fas fa-tennis-ball text-black text-lg"></i>
                    </div>
                    <span class="text-xl font-bold text-white tracking-tight font-['Chakra_Petch']">ACE<span class="text-[#ccff00]">MANAGER</span></span>
                </div>

                <!-- Admin Action -->
                <div>
                    <button 
                        (click)="store.goToLogin()" 
                        class="text-sm font-medium text-slate-300 hover:text-white flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-all border border-slate-700"
                    >
                        <i class="fas fa-lock"></i>
                        <span>Admin Access</span>
                    </button>
                </div>
            </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <div class="relative bg-slate-900 border-b border-slate-800 overflow-hidden">
          <!-- Geometric Pattern -->
          <div class="absolute inset-0 opacity-10" 
               style="background-image: linear-gradient(30deg, #334155 12%, transparent 12.5%, transparent 87%, #334155 87.5%, #334155), linear-gradient(150deg, #334155 12%, transparent 12.5%, transparent 87%, #334155 87.5%, #334155), linear-gradient(30deg, #334155 12%, transparent 12.5%, transparent 87%, #334155 87.5%, #334155), linear-gradient(150deg, #334155 12%, transparent 12.5%, transparent 87%, #334155 87.5%, #334155), linear-gradient(60deg, #33415577 25%, transparent 25.5%, transparent 75%, #33415577 75%, #33415577), linear-gradient(60deg, #33415577 25%, transparent 25.5%, transparent 75%, #33415577 75%, #33415577); background-size: 80px 140px; background-position: 0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px;">
          </div>
          
          <div class="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-transparent"></div>
          
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
              <div class="max-w-2xl">
                  <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ccff00]/10 border border-[#ccff00]/20 text-[#ccff00] text-xs font-bold uppercase tracking-wider mb-6">
                      <span class="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse"></span>
                      Live Updates
                  </div>
                  <h1 class="text-5xl md:text-6xl font-black text-white mb-6 leading-tight font-['Chakra_Petch']">
                      TOURNAMENT <br>
                      <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#ccff00] to-green-500">CENTRAL</span>
                  </h1>
                  <p class="text-lg text-slate-400 mb-8 leading-relaxed">
                      Follow real-time scores, brackets, and standings from professional and amateur tournaments happening right now.
                  </p>
                  <div class="flex flex-wrap gap-4">
                      <button class="bg-[#ccff00] text-black font-bold px-8 py-3.5 rounded-lg hover:bg-[#b3e600] transition-all shadow-[0_0_20px_rgba(204,255,0,0.3)] uppercase tracking-wide">
                          Browse Events
                      </button>
                  </div>
              </div>
          </div>
          
          <!-- Decorative Graphic -->
          <div class="absolute -right-20 -bottom-40 w-96 h-96 bg-[#ccff00] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>
      </div>

      <!-- Tournaments Grid -->
      <main class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full relative z-10">
          <div class="flex items-center justify-between mb-10">
              <h2 class="text-2xl font-bold text-white flex items-center gap-3">
                  <i class="fas fa-broadcast-tower text-[#ccff00]"></i>
                  Active Tournaments
              </h2>
              <div class="flex gap-2">
                  <span class="text-xs font-mono text-slate-500 bg-slate-900 border border-slate-800 px-3 py-1 rounded">Last updated: Just now</span>
              </div>
          </div>
          
          <!-- ERROR BANNER -->
          @if (store.globalError()) {
            <div class="mb-10 bg-red-900/20 border-l-4 border-red-500 p-6 rounded-r shadow-lg relative overflow-hidden">
                <div class="flex items-start">
                   <div class="flex-shrink-0">
                       <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
                   </div>
                   <div class="ml-4 w-full">
                     <h3 class="text-lg font-bold text-red-400 mb-2">Connection Issue Detected</h3>
                     <p class="text-slate-300 mb-4">{{ store.globalError() }}</p>
                     
                     <div class="bg-black/30 p-4 rounded-lg border border-red-500/20 text-sm text-slate-400">
                        <strong class="text-red-400 block mb-1">Developer Action Required:</strong>
                        <ul class="list-disc pl-4 space-y-1">
                          <li>Go to Firebase Console > Build > Firestore Database.</li>
                          <li>If it says "Create Database", click it.</li>
                          <li>If Database exists, go to the <strong>Rules</strong> tab.</li>
                          <li>Change rules to: <code>allow read, write: if true;</code></li>
                          <li>Click "Publish".</li>
                        </ul>
                     </div>
                   </div>
                </div>
            </div>
          }

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (tournament of store.tournamentsList(); track tournament.id) {
                  <div 
                    (click)="store.enterPublicTournament(tournament.id)"
                    class="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-[#ccff00] transition-all duration-300 cursor-pointer hover:shadow-[0_0_20px_rgba(204,255,0,0.1)] hover:-translate-y-1"
                  >
                      <!-- Status Badge -->
                      <div class="absolute top-4 right-4 z-10">
                          <span 
                            [class]="tournament.status === 'Live' ? 'bg-red-500 text-white animate-pulse' : (tournament.status === 'Upcoming' ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-300')"
                            class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm"
                          >
                              {{ tournament.status }}
                          </span>
                      </div>

                      <div class="p-6">
                          <div class="flex items-start justify-between mb-4">
                              <div class="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center group-hover:bg-[#ccff00] transition-colors">
                                  <i class="fas fa-trophy text-slate-500 text-xl group-hover:text-black"></i>
                              </div>
                          </div>
                          
                          <h3 class="text-xl font-bold text-white mb-2 group-hover:text-[#ccff00] transition-colors">{{ tournament.name }}</h3>
                          
                          <div class="flex items-center text-slate-400 text-sm mb-6">
                              <i class="fas fa-map-marker-alt mr-2 text-slate-600"></i>
                              {{ tournament.location }}
                          </div>

                          <div class="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                              <div>
                                  <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">Format</p>
                                  <p class="text-sm font-medium text-slate-300">{{ tournament.format }}</p>
                              </div>
                              <div>
                                  <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">Players</p>
                                  <p class="text-sm font-medium text-slate-300">{{ tournament.playersCount }}</p>
                              </div>
                          </div>
                      </div>
                      
                      <!-- Footer Action -->
                      <div class="bg-slate-950 px-6 py-3 border-t border-slate-800 flex justify-between items-center group-hover:bg-[#ccff00] group-hover:border-[#ccff00] transition-colors">
                          <span class="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-black">View Results</span>
                          <i class="fas fa-arrow-right text-slate-500 group-hover:text-black transform group-hover:translate-x-1 transition-all"></i>
                      </div>
                  </div>
              }
          </div>
      </main>

      <footer class="bg-slate-900 border-t border-slate-800 py-8 mt-auto relative z-10">
          <div class="max-w-7xl mx-auto px-4 text-center">
              <p class="text-slate-500 text-sm">&copy; 2024 AceManager. Real-time tournament infrastructure.</p>
          </div>
      </footer>
    </div>
  `
})
export class LandingComponent {
  store = inject(TournamentStore);
}