import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentStore, Match } from '../services/tournament.store';

@Component({
  selector: 'app-knockout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto overflow-x-auto pb-20">
      <div class="flex justify-between items-center mb-12 sticky left-0">
          <h2 class="text-3xl font-bold text-white flex items-center font-['Chakra_Petch']">
              <span class="bg-[#ccff00] text-black w-8 h-8 rounded flex items-center justify-center text-lg mr-4 font-bold shadow-[0_0_10px_#ccff00]">5</span>
              Knockout Stage
          </h2>
          <div class="text-sm text-slate-400 italic bg-slate-900 px-3 py-1 rounded border border-slate-800">
              <i class="fas fa-info-circle mr-1"></i> Winners automatically advance
          </div>
      </div>

      <div class="flex justify-around items-center min-w-[800px] gap-12">
          <div *ngFor="let round of rounds()" class="flex flex-col justify-around gap-20 relative py-12">
              <h3 class="absolute top-0 w-full text-center font-bold text-slate-500 uppercase tracking-[0.2em] text-xs">{{ getRoundName(round) }}</h3>
              
              <div *ngFor="let match of getMatchesForRound(round)" class="relative group w-72">
                  <div class="bg-slate-900 border rounded-lg shadow-lg overflow-hidden transition-all hover:border-slate-600 hover:shadow-[0_0_15px_rgba(0,0,0,0.5)]" 
                       [class.border-[#ccff00]]="match.isFinished" 
                       [class.border-slate-700]="!match.isFinished">
                      
                      <div class="p-4 space-y-3">
                          <div class="flex justify-between items-center p-2 rounded transition-colors" 
                               [class.bg-[#ccff00]/10]="match.winner === match.p1 && match.isFinished"
                               [class.bg-slate-800]="!(match.winner === match.p1 && match.isFinished)">
                              <span class="font-bold text-sm truncate text-white" [class.text-slate-500]="match.p1 === 'TBD'">{{ match.p1 }}</span>
                              <i *ngIf="match.isFinished && match.winner === match.p1" class="fas fa-check text-[#ccff00] text-xs"></i>
                          </div>
                          
                          <div class="border-t border-dashed border-slate-700 my-1"></div>

                          <div class="flex justify-between items-center p-2 rounded transition-colors" 
                               [class.bg-[#ccff00]/10]="match.winner === match.p2 && match.isFinished"
                               [class.bg-slate-800]="!(match.winner === match.p2 && match.isFinished)">
                              <span class="font-bold text-sm truncate text-white" [class.text-slate-500]="match.p2 === 'TBD'">{{ match.p2 }}</span>
                              <i *ngIf="match.isFinished && match.winner === match.p2" class="fas fa-check text-[#ccff00] text-xs"></i>
                          </div>
                      </div>
                      
                      <div class="bg-slate-950 px-4 py-2 flex justify-between items-center border-t border-slate-800">
                          <span class="text-xs font-mono text-[#ccff00] font-bold tracking-wider">{{ match.score || '- -' }}</span>
                          <button 
                              (click)="openScoreModal(match)" 
                              [disabled]="match.p1 === 'TBD' || match.p2 === 'TBD'"
                              class="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1 rounded hover:bg-[#ccff00] hover:text-black hover:border-[#ccff00] disabled:opacity-30 disabled:cursor-not-allowed transition-colors uppercase font-bold"
                          >
                              {{ match.isFinished ? 'Edit' : 'Score' }}
                          </button>
                      </div>
                  </div>
                  
                  <div *ngIf="round !== 'F'" class="absolute top-1/2 -right-12 w-12 h-0.5 bg-slate-700 hidden md:block"></div>
              </div>
          </div>
      </div>

       <div class="mt-12 text-center sticky left-0 border-t border-slate-800 pt-6">
            <button (click)="goBack()" class="text-slate-400 hover:text-white text-sm font-medium flex items-center justify-center mx-auto">
                <i class="fas fa-arrow-left mr-2"></i> {{ store.settings().mode === 'Knockout Only' ? 'Back to Registration' : 'Back to Group Scores' }}
            </button>
        </div>
    </div>

    <div *ngIf="editingMatch()" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
         <div class="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div class="bg-slate-950 px-6 py-4 border-b border-slate-800">
                <h3 class="text-lg font-bold text-white">Match Result</h3>
            </div>
            <div class="p-6">
                <div class="flex justify-between items-center mb-6 text-sm text-slate-300 bg-slate-800 p-4 rounded-lg border border-slate-700">
                     <span class="font-bold text-white">{{ editingMatch()?.p1 }}</span>
                     <span class="font-mono text-[#ccff00] px-2">VS</span>
                     <span class="font-bold text-white">{{ editingMatch()?.p2 }}</span>
                </div>

                <div class="mb-5">
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Score</label>
                    <input [(ngModel)]="tempScore" class="block w-full rounded-lg border-slate-600 bg-slate-950 text-white shadow-sm focus:border-[#ccff00] focus:ring-[#ccff00] p-3 border" placeholder="e.g. 6-4 6-4">
                </div>

                <div class="mb-8">
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Winner</label>
                     <select [(ngModel)]="tempWinner" class="block w-full rounded-lg border-slate-600 bg-slate-950 text-white shadow-sm focus:border-[#ccff00] focus:ring-[#ccff00] p-3 border">
                        <option [value]="null" disabled>Select Winner</option>
                        <option [value]="editingMatch()?.p1">{{ editingMatch()?.p1 }}</option>
                        <option [value]="editingMatch()?.p2">{{ editingMatch()?.p2 }}</option>
                     </select>
                </div>

                <div class="flex justify-end gap-3">
                    <button (click)="closeModal()" class="px-4 py-2 text-sm text-slate-400 hover:text-white font-medium transition-colors">Cancel</button>
                    <button (click)="saveScore()" class="px-6 py-2 bg-[#ccff00] text-black text-sm font-bold rounded-lg hover:bg-[#b3e600] shadow-lg shadow-[#ccff00]/20 transition-all">Save & Advance</button>
                </div>
            </div>
         </div>
    </div>
  `
})
export class KnockoutComponent {
  store = inject(TournamentStore);
  
  editingMatch = signal<Match | null>(null);
  tempScore = '';
  tempWinner: string | null = null;

  rounds = computed(() => {
      const matches = this.store.knockoutMatches();
      const roundNames = matches.map(m => m.round).filter((r): r is string => !!r);
      const distinctRounds = [...new Set(roundNames)];
      const order = ['Ro16', 'QF', 'SF', 'F'];
      return distinctRounds.sort((a: string, b: string) => {
          const ia = order.indexOf(a);
          const ib = order.indexOf(b);
          return ia - ib;
      });
  });

  getMatchesForRound(round: string) {
      return this.store.knockoutMatches()
          .filter(m => m.round === round)
          .sort((a, b) => {
               if (a.bracketPos === b.bracketPos) return 0;
               return a.bracketPos === 'top' ? -1 : 1;
          });
  }

  getRoundName(round: string) {
      switch(round) {
          case 'Ro16': return 'Round of 16';
          case 'QF': return 'Quarter Finals';
          case 'SF': return 'Semi Finals';
          case 'F': return 'Final';
          default: return round;
      }
  }

  openScoreModal(match: Match) {
      this.editingMatch.set(match);
      this.tempScore = match.score;
      this.tempWinner = match.winner;
  }

  closeModal() {
      this.editingMatch.set(null);
  }

  saveScore() {
      const match = this.editingMatch();
      if (match && this.tempWinner) {
          this.store.updateKnockoutMatchScore(match.id, {
              score: this.tempScore,
              winner: this.tempWinner,
              isFinished: true
          });
          this.closeModal();
      } else {
          alert('Please select a winner');
      }
  }

  goBack() {
      if (this.store.settings().mode === 'Knockout Only') {
          this.store.setStep(2);
      } else {
          this.store.setStep(4);
      }
  }
}
