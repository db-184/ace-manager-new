import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentStore, Match } from '../services/tournament.store';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto">
        <div class="flex justify-between items-center mb-8">
            <h2 class="text-3xl font-bold text-white flex items-center font-['Chakra_Petch']">
                <span class="bg-[#ccff00] text-black w-8 h-8 rounded flex items-center justify-center text-lg mr-4 font-bold shadow-[0_0_10px_#ccff00]">3</span>
                Schedule Generation
            </h2>
            <div class="flex gap-2">
                 <button (click)="openSwapModal()" class="bg-slate-800 text-[#ccff00] border border-slate-700 px-4 py-2 rounded-lg hover:bg-slate-700 hover:border-[#ccff00] transition-colors text-sm font-medium">
                    <i class="fas fa-exchange-alt mr-2"></i> Manage Players
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            @for (group of store.groups(); track group.id) {
                <div class="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
                    <div class="bg-slate-950/50 px-4 py-3 border-b border-slate-800 font-bold text-[#ccff00] uppercase tracking-wider">
                        {{ group.name }} Matches
                    </div>
                    <div class="divide-y divide-slate-800 max-h-96 overflow-y-auto">
                        @for (match of getMatchesForGroup(group.id); track match.id) {
                            <div class="p-4 hover:bg-slate-800 transition-colors flex justify-between items-center group">
                                <div class="flex-1 text-right pr-4 font-medium text-slate-300 group-hover:text-white truncate transition-colors" [title]="match.p1">{{ match.p1 }}</div>
                                <div class="text-xs text-slate-500 font-mono bg-slate-950 border border-slate-800 px-2 py-1 rounded">VS</div>
                                <div class="flex-1 text-left pl-4 font-medium text-slate-300 group-hover:text-white truncate transition-colors" [title]="match.p2">{{ match.p2 }}</div>
                            </div>
                        } @empty {
                            <div class="p-4 text-center text-slate-600 text-sm">No matches in this group.</div>
                        }
                    </div>
                </div>
            }
        </div>

        <div class="flex justify-between border-t border-slate-800 pt-6">
           <button (click)="store.setStep(2)" class="text-slate-400 hover:text-white font-medium px-4 py-2 flex items-center">
               <i class="fas fa-arrow-left mr-2"></i> Back to Groups
           </button>
           <button 
             (click)="store.setStep(4)" 
             class="bg-[#ccff00] text-black font-bold px-8 py-3 rounded-lg hover:bg-[#b3e600] shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-all uppercase tracking-wide"
            >
               Start Scoring <i class="fas fa-play ml-2"></i>
           </button>
       </div>
    </div>

    <!-- Swap/Delete Modal -->
    @if (showSwapModal()) {
        <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                <div class="bg-slate-950 px-6 py-4 flex justify-between items-center border-b border-slate-800">
                    <h3 class="text-white font-bold text-lg">Manage Players</h3>
                    <button (click)="closeSwapModal()" class="text-slate-500 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="p-6 space-y-5">
                    <p class="text-sm text-slate-400 mb-4">Select a player to rename or remove from the tournament.</p>
                    
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Select Player</label>
                        <select [(ngModel)]="selectedPlayerId" class="block w-full rounded-lg border-slate-700 bg-slate-800 text-white shadow-sm focus:border-[#ccff00] focus:ring-[#ccff00] p-3 border">
                            <option value="" disabled selected>-- Choose Player --</option>
                            @for (player of store.players(); track player.id) {
                                <option [value]="player.id">{{ player.name }} ({{ getGroupName(player.groupId) }})</option>
                            }
                        </select>
                    </div>

                    @if (selectedPlayerId) {
                        <div class="animate-fade-in space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-slate-400 mb-1">New Name</label>
                                <input [(ngModel)]="newPlayerName" class="block w-full rounded-lg border-slate-700 bg-slate-800 text-white shadow-sm focus:border-[#ccff00] focus:ring-[#ccff00] p-3 border" placeholder="Enter new name">
                            </div>
                            
                            <div class="border-t border-slate-800 pt-4 mt-2">
                                <label class="block text-sm font-medium text-red-400 mb-2">Danger Zone</label>
                                <button (click)="performDelete()" class="w-full border border-red-900/50 bg-red-900/20 text-red-400 hover:bg-red-900/40 hover:text-red-300 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                                    <i class="fas fa-trash-alt mr-2"></i> Delete Player & Matches
                                </button>
                            </div>
                        </div>
                    }

                </div>
                <div class="bg-slate-950 px-6 py-4 flex justify-end gap-3 border-t border-slate-800">
                    <button (click)="closeSwapModal()" class="px-4 py-2 border border-slate-700 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">Cancel</button>
                    <button 
                        (click)="performSwap()" 
                        [disabled]="!selectedPlayerId || !newPlayerName"
                        class="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-bold text-black bg-[#ccff00] hover:bg-[#b3e600] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save Rename
                    </button>
                </div>
            </div>
        </div>
    }
  `
})
export class ScheduleComponent {
  store = inject(TournamentStore);
  
  showSwapModal = signal(false);
  selectedPlayerId = '';
  newPlayerName = '';

  getMatchesForGroup(groupId: string) {
      return this.store.matches().filter(m => m.groupId === groupId);
  }

  getGroupName(groupId: string) {
      return this.store.groups().find(g => g.id === groupId)?.name || 'Unknown';
  }

  openSwapModal() {
      this.selectedPlayerId = '';
      this.newPlayerName = '';
      this.showSwapModal.set(true);
  }

  closeSwapModal() {
      this.showSwapModal.set(false);
  }

  performSwap() {
      if (this.selectedPlayerId && this.newPlayerName) {
          this.store.updatePlayerName(this.selectedPlayerId, this.newPlayerName);
          this.closeSwapModal();
      }
  }

  performDelete() {
      if (this.selectedPlayerId) {
          if (confirm('Are you sure? This will remove the player and all their matches.')) {
              this.store.deletePlayer(this.selectedPlayerId);
              this.closeSwapModal();
          }
      }
  }
}