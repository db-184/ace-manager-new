import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentStore, Match, PlayerStats } from '../services/tournament.store';

@Component({
  selector: 'app-scores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto pb-20">
        <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div class="flex items-center">
                 @if(store.activeGroupFilter()) {
                     <button (click)="store.setStep(0)" class="mr-4 text-slate-400 hover:text-white transition-colors">
                        <i class="fas fa-arrow-left text-xl"></i>
                     </button>
                 }
                 <h2 class="text-3xl font-bold text-white flex items-center font-['Chakra_Petch']">
                    <span class="bg-[#ccff00] text-black w-8 h-8 rounded flex items-center justify-center text-lg mr-4 font-bold shadow-[0_0_10px_#ccff00]">4</span>
                    @if(store.activeGroupFilter()) {
                        {{ getGroupName(store.activeGroupFilter()!) }} Scores
                    } @else {
                        Score Management
                    }
                 </h2>
            </div>
            
            <div class="flex gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                 <button 
                  (click)="view.set('matches')" 
                  [class]="view() === 'matches' ? 'bg-[#ccff00] text-black shadow-md font-bold' : 'text-slate-400 hover:text-white'"
                  class="px-6 py-2 rounded-md text-sm transition-all"
                 >
                    Matches
                 </button>
                 <button 
                  (click)="view.set('standings')" 
                  [class]="view() === 'standings' ? 'bg-[#ccff00] text-black shadow-md font-bold' : 'text-slate-400 hover:text-white'"
                  class="px-6 py-2 rounded-md text-sm transition-all"
                 >
                    Standings
                 </button>
            </div>
        </div>

        @if (view() === 'matches') {
            <!-- Filter tabs -->
            <div class="flex space-x-1 mb-8 bg-slate-900 p-1 rounded-lg w-fit border border-slate-800">
                <button 
                    (click)="filter.set('all')" 
                    [class]="filter() === 'all' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'"
                    class="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                >All</button>
                <button 
                    (click)="filter.set('pending')" 
                    [class]="filter() === 'pending' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'"
                    class="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                >Pending</button>
                <button 
                    (click)="filter.set('finished')" 
                    [class]="filter() === 'finished' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'"
                    class="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                >Finished</button>
            </div>

            <div class="space-y-4">
                @for (match of filteredMatches(); track match.id) {
                    <div class="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden transition-all hover:border-slate-600">
                        <!-- Match Header -->
                        <div class="px-6 py-3 flex items-center justify-between bg-slate-950 border-b border-slate-800">
                            <span class="text-xs font-bold tracking-widest text-slate-500 uppercase">{{ getGroupName(match.groupId) }}</span>
                            @if (match.isFinished) {
                                <span class="bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Finished</span>
                            } @else {
                                <span class="bg-slate-800 text-slate-400 border border-slate-700 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Pending</span>
                            }
                        </div>

                        <!-- Match Body -->
                        <div class="p-6">
                            @if (editingMatchId() === match.id) {
                                <!-- Edit Mode -->
                                <div class="bg-slate-800/50 p-6 rounded-lg border border-slate-700 animate-fade-in">
                                    <div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
                                        <div class="font-bold text-xl text-white">{{ match.p1 }} <span class="text-slate-500 mx-2">vs</span> {{ match.p2 }}</div>
                                        
                                        <label class="flex items-center space-x-3 cursor-pointer bg-slate-900 px-4 py-2 rounded-lg border border-slate-700 shadow-sm hover:border-[#ccff00]/50 transition-colors">
                                            <input type="checkbox" [(ngModel)]="tempWalkover" class="text-[#ccff00] rounded focus:ring-[#ccff00] bg-slate-800 border-slate-600">
                                            <span class="text-sm font-medium text-slate-300">Walkover</span>
                                        </label>
                                    </div>

                                    @if (tempWalkover) {
                                        <div class="mb-6">
                                            <label class="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-wide">Select Winner (6-0)</label>
                                            <div class="flex gap-4">
                                                <button 
                                                    (click)="tempWinner = match.p1" 
                                                    [class]="tempWinner === match.p1 ? 'bg-[#ccff00] text-black border-[#ccff00]' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'"
                                                    class="flex-1 py-3 px-4 rounded-lg border font-bold transition-all"
                                                >
                                                    {{ match.p1 }}
                                                </button>
                                                <button 
                                                    (click)="tempWinner = match.p2"
                                                    [class]="tempWinner === match.p2 ? 'bg-[#ccff00] text-black border-[#ccff00]' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'"
                                                    class="flex-1 py-3 px-4 rounded-lg border font-bold transition-all"
                                                >
                                                    {{ match.p2 }}
                                                </button>
                                            </div>
                                        </div>
                                    } @else {
                                        <div class="mb-6">
                                            <label class="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-wide">Score</label>
                                            <input 
                                                [(ngModel)]="tempScore" 
                                                placeholder="e.g. 6-4 2-6 7-6(5)"
                                                class="block w-full rounded-lg border-slate-600 bg-slate-900 text-white shadow-sm focus:border-[#ccff00] focus:ring-[#ccff00] p-3 border text-lg"
                                            >
                                            <div class="flex justify-between mt-2 text-xs text-slate-500">
                                                <span>Use space to separate sets.</span>
                                                <span>{{ store.settings().setCount }} Set Match</span>
                                            </div>
                                        </div>
                                        
                                        <div class="mb-6">
                                             <label class="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-wide">Winner</label>
                                             <select [(ngModel)]="tempWinner" class="block w-full rounded-lg border-slate-600 bg-slate-900 text-white shadow-sm focus:border-[#ccff00] focus:ring-[#ccff00] p-3 border">
                                                <option [value]="null" disabled>-- Select Winner --</option>
                                                <option [value]="match.p1">{{ match.p1 }}</option>
                                                <option [value]="match.p2">{{ match.p2 }}</option>
                                             </select>
                                        </div>
                                    }

                                    <div class="flex justify-end gap-3 pt-4 border-t border-slate-700">
                                        <button (click)="cancelEdit()" class="px-5 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
                                        <button (click)="saveScore(match.id)" class="px-6 py-2 bg-[#ccff00] text-black font-bold text-sm rounded-lg hover:bg-[#b3e600] shadow-lg shadow-[#ccff00]/20 transition-all">Save Result</button>
                                    </div>
                                </div>
                            } @else {
                                <!-- View Mode -->
                                <div class="flex items-center justify-between">
                                    <div class="flex-1 flex items-center justify-end space-x-4">
                                        <span class="font-bold text-white text-lg text-right truncate">{{ match.p1 }}</span>
                                        @if(match.isFinished && match.winner === match.p1) { <i class="fas fa-trophy text-[#ccff00] drop-shadow-[0_0_5px_rgba(204,255,0,0.5)]"></i> }
                                    </div>
                                    
                                    <div class="mx-8 flex flex-col items-center min-w-[120px]">
                                        @if(match.isFinished) {
                                            <span class="text-3xl font-black text-[#ccff00] tracking-widest font-mono drop-shadow-[0_0_8px_rgba(204,255,0,0.3)]">{{ match.score || '6-0' }}</span>
                                            @if(match.isWalkover) { <span class="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Walkover</span> }
                                        } @else {
                                            <span class="text-slate-600 text-2xl font-light font-mono">VS</span>
                                        }
                                    </div>

                                    <div class="flex-1 flex items-center justify-start space-x-4">
                                        @if(match.isFinished && match.winner === match.p2) { <i class="fas fa-trophy text-[#ccff00] drop-shadow-[0_0_5px_rgba(204,255,0,0.5)]"></i> }
                                        <span class="font-bold text-white text-lg truncate">{{ match.p2 }}</span>
                                    </div>
                                </div>
                                
                                <div class="mt-6 flex justify-center">
                                    <button (click)="startEdit(match)" class="text-sm text-[#ccff00] hover:text-black font-medium flex items-center bg-[#ccff00]/10 border border-[#ccff00]/20 hover:bg-[#ccff00] px-4 py-1.5 rounded-full transition-all">
                                        <i class="fas fa-edit mr-2"></i> {{ match.isFinished ? 'Edit Score' : 'Enter Score' }}
                                    </button>
                                </div>
                            }
                        </div>
                    </div>
                } @empty {
                    <div class="text-center py-16 bg-slate-900 rounded-xl border border-dashed border-slate-800">
                        <i class="fas fa-inbox text-slate-700 text-4xl mb-4"></i>
                        <p class="text-slate-500">No matches found.</p>
                    </div>
                }
            </div>
        } @else {
            <!-- Standings View -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                @for (group of filteredGroups(); track group.id) {
                    <div class="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
                        <div class="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 text-white font-bold flex justify-between border-b border-slate-800">
                             <span class="text-[#ccff00] uppercase tracking-wider">{{ group.name }}</span>
                             <span class="text-xs font-normal text-slate-400 self-center">Top 2 Highlighted</span>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-slate-800">
                                <thead class="bg-slate-950">
                                    <tr>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">#</th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Player</th>
                                        <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Pts</th>
                                        <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">MP</th>
                                        <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider" title="Games Won">GW</th>
                                        <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider" title="Games Lost">GL</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-slate-900 divide-y divide-slate-800">
                                    @for (stat of getStandings(group.id); track stat.playerId; let i = $index) {
                                        <tr [ngClass]="i < 2 ? 'bg-[#ccff00]/5' : ''" class="hover:bg-slate-800/50 transition-colors">
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{{ i + 1 }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-white flex items-center">
                                                {{ stat.name }}
                                                @if(i < 2) { <span class="ml-2 w-2 h-2 rounded-full bg-[#ccff00]"></span> }
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-[#ccff00]">{{ stat.points }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-400">{{ stat.matchesPlayed }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-500">{{ stat.gamesWon }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-500">{{ stat.gamesLost }}</td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                }
            </div>
        }
        
        <div class="mt-8 flex justify-between items-center border-t border-slate-800 pt-6">
            @if(store.activeGroupFilter()) {
                <button (click)="store.setStep(0)" class="text-slate-400 hover:text-white text-sm font-medium flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i> Back to Summary
                </button>
            } @else {
                 <button (click)="store.setStep(3)" class="text-slate-400 hover:text-white text-sm font-medium flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i> Back to Schedule
                </button>
            }
            <button 
                (click)="proceedToKnockout()" 
                class="bg-[#ccff00] text-black font-bold px-8 py-3 rounded-lg hover:bg-[#b3e600] shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-all uppercase tracking-wide flex items-center"
            >
                Generate Knockout Stage <i class="fas fa-sitemap ml-2"></i>
            </button>
        </div>
    </div>
  `
})
export class ScoresComponent {
  store = inject(TournamentStore);
  view = signal<'matches' | 'standings'>('matches');
  filter = signal<'all' | 'pending' | 'finished'>('all');
  
  editingMatchId = signal<string | null>(null);
  
  // Temp state for form
  tempScore = '';
  tempWalkover = false;
  tempWinner: string | null = null;

  filteredMatches() {
      let matches = this.store.matches();
      
      // Group Filter (from summary access point)
      if (this.store.activeGroupFilter()) {
          matches = matches.filter(m => m.groupId === this.store.activeGroupFilter());
      }

      const f = this.filter();
      if (f === 'all') return matches;
      if (f === 'pending') return matches.filter(m => !m.isFinished);
      return matches.filter(m => m.isFinished);
  }

  filteredGroups() {
      const groups = this.store.groups();
      if (this.store.activeGroupFilter()) {
          return groups.filter(g => g.id === this.store.activeGroupFilter());
      }
      return groups;
  }

  getGroupName(groupId: string) {
      return this.store.groups().find(g => g.id === groupId)?.name || '';
  }

  getStandings(groupId: string) {
      return this.store.getGroupStandings(groupId);
  }

  startEdit(match: Match) {
      this.editingMatchId.set(match.id);
      this.tempScore = match.score;
      this.tempWalkover = match.isWalkover;
      this.tempWinner = match.winner;
  }

  cancelEdit() {
      this.editingMatchId.set(null);
  }

  saveScore(matchId: string) {
      let finalScore = this.tempScore;
      let finalWinner = this.tempWinner;

      if (this.tempWalkover) {
          finalScore = '6-0'; 
          if (!finalWinner) {
              alert("Please select a winner for the walkover.");
              return;
          }
      }

      this.store.updateMatchScore(matchId, {
          score: finalScore,
          isWalkover: this.tempWalkover,
          winner: finalWinner,
          isFinished: true
      });
      this.editingMatchId.set(null);
  }

  proceedToKnockout() {
      if (confirm('Are you sure you want to generate the Knockout Bracket? Ensure all Round-Robin scores are entered correctly.')) {
          this.store.generateKnockoutBracket();
          this.store.setStep(5);
      }
  }
}