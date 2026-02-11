import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentStore } from '../services/tournament.store';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-950 p-8">
        <div class="max-w-7xl mx-auto">
            <div class="flex justify-between items-center mb-12">
                <h1 class="text-3xl font-bold text-white tracking-tight font-['Chakra_Petch']">
                    ADMIN <span class="text-[#ccff00]">HUB</span>
                </h1>
                <div class="flex items-center gap-4">
                     <span class="text-slate-400 text-sm">Welcome, {{ store.currentUser() }}</span>
                     <button (click)="store.createNewTournament()" class="bg-[#ccff00] hover:bg-[#b3e600] text-black font-bold px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-[#ccff00]/20 flex items-center">
                        <i class="fas fa-plus mr-2"></i> New Tournament
                     </button>
                     <button (click)="store.logout()" class="text-slate-500 hover:text-white transition-colors">
                        <i class="fas fa-sign-out-alt text-xl"></i>
                     </button>
                </div>
            </div>

            <!-- Error Banner for Admin -->
            @if (store.globalError()) {
                <div class="mb-10 bg-red-900/20 border-l-4 border-red-500 p-6 rounded-r shadow-lg">
                    <div class="flex items-start">
                       <i class="fas fa-exclamation-triangle text-red-500 text-xl mt-1"></i>
                       <div class="ml-4 w-full">
                         <h3 class="text-lg font-bold text-red-400">Database Connection Failed</h3>
                         <p class="text-slate-300 mt-2 mb-4">{{ store.globalError() }}</p>
                         
                         <div class="bg-black/30 p-4 rounded-lg border border-red-500/20 text-sm text-slate-400">
                            <strong class="text-red-400 block mb-1">Developer Action Required:</strong>
                            <ul class="list-disc pl-4 space-y-1">
                              <li>Go to Firebase Console > Build > Firestore Database.</li>
                              <li>Go to the <strong>Rules</strong> tab.</li>
                              <li>Set rules to: <code>allow read, write: if true;</code></li>
                              <li>Click "Publish" to fix this error.</li>
                            </ul>
                         </div>
                       </div>
                    </div>
                </div>
            }

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                @for (tournament of store.tournamentsList(); track tournament.id) {
                    <div 
                        (click)="store.loadAdminTournament(tournament.id)"
                        class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-[#ccff00] transition-all cursor-pointer group shadow-lg relative"
                    >
                         <!-- Badge and Delete Container - Added z-20 to ensure it's above everything -->
                         <div class="absolute top-4 right-4 flex items-center gap-2 z-20">
                            <span [class]="tournament.status === 'Live' ? 'text-red-500 animate-pulse' : 'text-slate-500'" class="text-xs font-bold uppercase tracking-wider border border-current px-2 py-0.5 rounded backdrop-blur-sm bg-slate-950/40">
                                {{ tournament.status }}
                            </span>
                            <button 
                                (click)="promptDelete($event, tournament.id)"
                                class="text-slate-500 hover:text-red-500 transition-colors p-2 rounded-md hover:bg-slate-800 border border-transparent hover:border-slate-700 bg-slate-950/40 backdrop-blur-sm"
                                title="Delete Tournament"
                            >
                                <i class="fas fa-trash"></i>
                            </button>
                         </div>

                        <div class="p-6 relative z-10">
                             <div class="w-12 h-12 bg-[#ccff00]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#ccff00] transition-colors">
                                 <i class="fas fa-trophy text-[#ccff00] text-xl group-hover:text-black"></i>
                             </div>
                             
                             <!-- Added padding right to prevent text from going under the badge -->
                             <h2 class="text-xl font-bold text-white mb-2 pr-20">{{ tournament.name }}</h2>
                             <p class="text-sm text-slate-500 mb-6 flex items-center">
                                <i class="fas fa-map-pin mr-2 text-slate-600"></i> {{ tournament.location }}
                             </p>

                             <div class="flex justify-between items-center pt-4 border-t border-slate-800">
                                 <div class="text-xs text-slate-400">
                                     <span class="block text-slate-600 uppercase tracking-wider text-[10px] font-bold">Format</span>
                                     {{ tournament.format }}
                                 </div>
                                 <div class="text-xs text-slate-400 text-right">
                                     <span class="block text-slate-600 uppercase tracking-wider text-[10px] font-bold">Players</span>
                                     {{ tournament.playersCount }}
                                 </div>
                             </div>
                        </div>
                        <div class="bg-slate-950 px-6 py-3 border-t border-slate-800 flex justify-between items-center relative z-10">
                             <span class="text-xs font-bold text-[#ccff00] uppercase tracking-widest">Manage Event</span>
                             <i class="fas fa-chevron-right text-slate-600 group-hover:text-[#ccff00] transition-colors"></i>
                        </div>
                    </div>
                }
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    @if (deletingId()) {
        <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="cancelDelete()">
            <div class="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden" (click)="$event.stopPropagation()">
                <div class="p-6 text-center">
                    <div class="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                        <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2">Delete Tournament?</h3>
                    <p class="text-slate-400 text-sm mb-6">Are you sure you want to delete this tournament? This action cannot be undone.</p>
                    
                    <div class="flex gap-3">
                        <button (click)="cancelDelete()" class="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white font-medium transition-colors border border-slate-700">No, Cancel</button>
                        <button (click)="confirmDelete()" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition-colors shadow-lg shadow-red-900/20">Yes, Delete</button>
                    </div>
                </div>
            </div>
        </div>
    }
  `
})
export class AdminDashboardComponent {
  store = inject(TournamentStore);
  deletingId = signal<string | null>(null);

  promptDelete(event: Event, id: string) {
      // Critical: Stop propagation to prevent entering the tournament when clicking delete
      event.stopPropagation();
      event.preventDefault();
      this.deletingId.set(id);
  }

  confirmDelete() {
      const id = this.deletingId();
      if (id) {
          this.store.deleteTournament(id);
      }
      this.deletingId.set(null);
  }

  cancelDelete() {
      this.deletingId.set(null);
  }
}