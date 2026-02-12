import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentStore, Match } from '../services/tournament.store';

@Component({
  selector: 'app-public-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-950 flex flex-col text-slate-200">
      <!-- Header -->
      <header class="bg-slate-900 border-b border-slate-800 shadow-lg sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div class="flex items-center w-full md:w-auto">
                <button (click)="store.goHome()" class="mr-4 text-slate-400 hover:text-white transition-colors">
                    <i class="fas fa-arrow-left text-lg"></i>
                </button>
                <div class="w-10 h-10 bg-[#ccff00] rounded-lg flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(204,255,0,0.3)] shrink-0">
                    <i class="fas fa-trophy text-black text-xl"></i>
                </div>
                <div>
                    <h1 class="text-xl font-bold tracking-tight text-white font-['Chakra_Petch'] uppercase">{{ store.settings().name || 'Tournament Hub' }}</h1>
                    <p class="text-xs text-[#ccff00] tracking-wider uppercase font-bold">Live Results & Standings</p>
                </div>
            </div>
            
             <!-- Search -->
             <div class="relative w-full md:max-w-xs">
                 <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <i class="fas fa-search text-slate-500"></i>
                 </div>
                 <input 
                    type="text" 
                    [(ngModel)]="searchQuery" 
                    placeholder="Find player..." 
                    class="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-full leading-5 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-[#ccff00] focus:border-[#ccff00] sm:text-sm transition duration-150 ease-in-out"
                  >
             </div>
        </div>
        
        <!-- Tab Nav -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <nav class="flex space-x-1" aria-label="Tabs">
                <button 
                  (click)="activeTab.set('standings')"
                  [class]="activeTab() === 'standings' ? 'bg-[#ccff00] text-black' : 'text-slate-400 hover:text-white hover:bg-slate-800'"
                  class="px-6 py-2.5 rounded-t-lg font-bold text-sm transition-all uppercase tracking-wide"
                >
                   Standings
                </button>
                <button 
                  (click)="activeTab.set('matches')"
                  [class]="activeTab() === 'matches' ? 'bg-[#ccff00] text-black' : 'text-slate-400 hover:text-white hover:bg-slate-800'"
                  class="px-6 py-2.5 rounded-t-lg font-bold text-sm transition-all uppercase tracking-wide"
                >
                   Results
                </button>
                <button 
                  (click)="activeTab.set('bracket')"
                  [class]="activeTab() === 'bracket' ? 'bg-[#ccff00] text-black' : 'text-slate-400 hover:text-white hover:bg-slate-800'"
                  class="px-6 py-2.5 rounded-t-lg font-bold text-sm transition-all uppercase tracking-wide"
                >
                   Bracket
                </button>
            </nav>
        </div>
      </header>

      <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <!-- Standings Tab -->
          @if (activeTab() === 'standings') {
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                <div *ngFor="let group of filteredGroups()" class="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
                    <div class="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-3 border-b border-slate-800 flex justify-between items-center">
                         <h3 class="font-bold text-white uppercase tracking-wider">{{ group.name }}</h3>
                         <span class="text-xs text-[#ccff00] font-mono border border-[#ccff00]/30 px-2 py-0.5 rounded">RR Stage</span>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-slate-800">
                            <thead class="bg-slate-950">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Pos</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Player</th>
                                    <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Pts</th>
                                    <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">W-L (G)</th>
                                </tr>
                            </thead>
                            <tbody class="bg-slate-900 divide-y divide-slate-800">
                                <tr *ngFor="let stat of getStandings(group.id); let i = index" 
                                    [class.bg-[#ccff00]/10]="searchQuery() && stat.name.toLowerCase().includes(searchQuery().toLowerCase())" 
                                    class="hover:bg-slate-800/50 transition-colors">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{{ i + 1 }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-white flex items-center">
                                        {{ stat.name }}
                                        @if(i < 2) { <span class="ml-2 w-1.5 h-1.5 rounded-full bg-[#ccff00]"></span> }
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-[#ccff00]">{{ stat.points }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-400 font-mono">{{ stat.gamesWon }}-{{ stat.gamesLost }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
              </div>
          }

          <!-- Matches Tab -->
          @if (activeTab() === 'matches') {
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
                  <div *ngFor="let match of filteredMatches()" class="bg-slate-900 rounded-xl shadow-md border border-slate-800 p-5 flex flex-col justify-center hover:border-slate-600 transition-colors">
                      <div class="text-xs text-slate-500 uppercase tracking-widest mb-4 font-bold text-center border-b border-slate-800 pb-2">{{ getGroupName(match.groupId) }}</div>
                      <div class="flex justify-between items-center">
                          <div class="flex-1 text-right font-medium text-slate-300" [class.text-[#ccff00]]="match.winner === match.p1 && match.isFinished" [class.font-bold]="match.winner === match.p1 && match.isFinished">
                            {{ match.p1 }}
                          </div>
                          <div class="mx-4 flex flex-col items-center min-w-[70px]">
                               @if (match.isFinished) {
                                   <span class="font-black text-white text-lg tracking-wide">{{ match.score }}</span>
                               } @else {
                                   <span class="text-slate-600 text-xs font-bold bg-slate-800 px-2 py-1 rounded">VS</span>
                               }
                          </div>
                          <div class="flex-1 text-left font-medium text-slate-300" [class.text-[#ccff00]]="match.winner === match.p2 && match.isFinished" [class.font-bold]="match.winner === match.p2 && match.isFinished">
                            {{ match.p2 }}
                          </div>
                      </div>
                  </div>
                  
                  <div *ngIf="filteredMatches().length === 0" class="col-span-full text-center py-20 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                      <p class="text-slate-500 text-lg">No matches found matching your search.</p>
                  </div>
              </div>
          }

          <!-- Bracket Tab -->
          @if (activeTab() === 'bracket') {
              <div class="overflow-x-auto pb-12 animate-fade-in custom-scrollbar">
                  @if (store.knockoutMatches().length === 0) {
                      <div class="text-center py-20 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                          <i class="fas fa-sitemap text-slate-700 text-5xl mb-4"></i>
                          <p class="text-slate-500 text-lg">Knockout stage has not started yet.</p>
                      </div>
                  } @else {
                      <div class="flex justify-around items-center min-w-[800px] gap-12">
                          <div *ngFor="let round of rounds()" class="flex flex-col justify-around gap-16 relative py-12">
                              <h3 class="absolute top-0 w-full text-center font-bold text-slate-500 uppercase tracking-[0.2em] text-xs">{{ getRoundName(round) }}</h3>
                              
                              <div *ngFor="let match of getMatchesForRound(round)" class="relative w-64">
                                  <div class="bg-slate-900 border rounded-lg shadow-lg overflow-hidden transition-all" 
                                       [class.border-[#ccff00]]="isMatchHighlighted(match)" 
                                       [class.shadow-[0_0_15px_rgba(204,255,0,0.2)]]="isMatchHighlighted(match)"
                                       [class.border-slate-700]="!isMatchHighlighted(match)">
                                      
                                      <div class="p-3 space-y-2">
                                          <div class="flex justify-between items-center text-sm p-1 rounded" 
                                               [class.text-white]="match.winner === match.p1"
                                               [class.text-slate-400]="match.winner !== match.p1"
                                               [class.bg-[#ccff00]/10]="isMatchHighlighted(match) && match.p1.toLowerCase().includes(searchQuery().toLowerCase())">
                                              <span class="truncate font-medium" [class.text-slate-600]="match.p1 === 'TBD'">{{ match.p1 }}</span>
                                              @if(match.isFinished && match.winner === match.p1){ <i class="fas fa-check text-[#ccff00] text-xs"></i> }
                                          </div>
                                          <div class="border-t border-slate-800"></div>
                                          <div class="flex justify-between items-center text-sm p-1 rounded"
                                               [class.text-white]="match.winner === match.p2"
                                               [class.text-slate-400]="match.winner !== match.p2"
                                               [class.bg-[#ccff00]/10]="isMatchHighlighted(match) && match.p2.toLowerCase().includes(searchQuery().toLowerCase())">
                                              <span class="truncate font-medium" [class.text-slate-600]="match.p2 === 'TBD'">{{ match.p2 }}</span>
                                              @if(match.isFinished && match.winner === match.p2){ <i class="fas fa-check text-[#ccff00] text-xs"></i> }
                                          </div>
                                      </div>
                                      <div class="bg-slate-950 px-2 py-1 text-xs text-center text-[#ccff00] font-mono border-t border-slate-800">
                                          {{ match.score || 'Scheduled' }}
                                      </div>
                                  </div>
                                  
                                   @if (round !== 'F') {
                                     <div class="absolute top-1/2 -right-12 w-12 h-px bg-slate-700 hidden md:block"></div>
                                  }
                              </div>
                          </div>
                      </div>
                  }
              </div>
          }

      </main>
    </div>
  `,
  styles: [`
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    /* Custom Scrollbar for bracket */
    .custom-scrollbar::-webkit-scrollbar { height: 8px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #334155; border-radius: 4px; }
  `]
})
export class PublicViewComponent {
  store = inject(TournamentStore);
  activeTab = signal<'standings' | 'matches' | 'bracket'>('standings');
  searchQuery = signal('');

  // Standings Logic
  getStandings(groupId: string) {
      return this.store.getGroupStandings(groupId);
  }

  filteredGroups() {
      // If searching, show all groups so we can find players inside.
      // Alternatively, could filter groups that contain the player.
      return this.store.groups();
  }

  // Matches Logic
  filteredMatches() {
      const q = this.searchQuery().toLowerCase();
      const rrMatches = this.store.matches();
      // Only show RR matches in matches tab? Or both?
      // Let's show RR matches in Matches tab.
      if (!q) return rrMatches;
      return rrMatches.filter(m => m.p1.toLowerCase().includes(q) || m.p2.toLowerCase().includes(q));
  }

  getGroupName(groupId: string) {
      return this.store.groups().find(g => g.id === groupId)?.name || '';
  }

  // Bracket Logic (Copied simple version from KnockoutComponent for read-only)
  rounds = computed(() => {
      const matches = this.store.knockoutMatches();
      const roundNames = matches.map(m => m.round).filter((r): r is string => !!r);
      const distinctRounds = [...new Set(roundNames)];
      const order = ['Ro16', 'QF', 'SF', 'F'];
      return distinctRounds.sort((a: string, b: string) => order.indexOf(a) - order.indexOf(b));
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

  isMatchHighlighted(match: Match): boolean {
      const q = this.searchQuery().toLowerCase();
      if (!q) return false;
      return match.p1.toLowerCase().includes(q) || match.p2.toLowerCase().includes(q);
  }
}
