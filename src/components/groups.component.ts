import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentStore, Player } from '../services/tournament.store';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto">
       <div class="flex justify-between items-center mb-8">
        <h2 class="text-3xl font-bold text-white flex items-center font-['Chakra_Petch']">
            <span class="bg-[#ccff00] text-black w-8 h-8 rounded flex items-center justify-center text-lg mr-4 font-bold shadow-[0_0_10px_#ccff00]">2</span>
            {{ store.settings().mode === 'Knockout Only' ? 'Player Registration' : 'Group Configuration' }}
        </h2>
        <div class="space-x-2">
            <button (click)="configureGroups()" class="text-sm bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 hover:text-white transition-colors">
                <i class="fas fa-sync mr-2 text-[#ccff00]"></i> Reset Groups
            </button>
        </div>
       </div>

       <!-- Config Controls -->
       <div class="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
           <div>
               <label class="block text-sm font-medium text-slate-400 mb-2">Number of Groups</label>
               <input type="number" min="1" max="16" [(ngModel)]="numGroups" class="block w-full rounded-lg border-slate-700 bg-slate-800 text-white shadow-sm focus:border-[#ccff00] focus:ring-[#ccff00] p-3 border">
           </div>
           <div>
               <label class="block text-sm font-medium text-slate-400 mb-2">Players per Group</label>
               <input type="number" min="2" max="10" [(ngModel)]="playersPerGroup" class="block w-full rounded-lg border-slate-700 bg-slate-800 text-white shadow-sm focus:border-[#ccff00] focus:ring-[#ccff00] p-3 border">
           </div>
           <div class="flex items-end">
               <button (click)="configureGroups()" class="w-full bg-slate-700 text-white px-4 py-3 rounded-lg hover:bg-slate-600 transition-colors shadow-md font-medium border border-slate-600 hover:border-slate-500">
                   Apply Configuration
               </button>
           </div>
       </div>

       <!-- Group Cards Grid -->
       <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
           @for (group of localGroups(); track group.id; let i = $index) {
               <div class="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden flex flex-col h-full hover:border-slate-600 transition-colors">
                   <div class="bg-slate-950/50 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                       <input 
                         [(ngModel)]="group.name" 
                         class="bg-transparent font-bold text-[#ccff00] focus:outline-none focus:border-b focus:border-[#ccff00] w-full uppercase tracking-wider"
                         placeholder="Group Name"
                        >
                       <button (click)="removeGroup(group.id)" class="text-slate-600 hover:text-red-500 transition-colors ml-2">
                           <i class="fas fa-trash-alt"></i>
                       </button>
                   </div>
                   <div class="p-4 flex-1 space-y-3">
                       @for (player of getPlayersInGroup(group.id); track player.tempId; let pIndex = $index) {
                           <div class="flex items-center space-x-2">
                               <span class="text-xs font-mono text-slate-500 w-4">{{pIndex + 1}}</span>
                               <input 
                                 [(ngModel)]="player.name" 
                                 (ngModelChange)="validate()"
                                 [class.border-red-500]="isDuplicate(player.name, player.tempId)"
                                 class="block w-full text-sm rounded bg-slate-800 border-slate-700 text-white shadow-sm focus:border-[#ccff00] focus:ring-[#ccff00] p-2 border transition-colors"
                                 placeholder="Player Name"
                                >
                                <button (click)="removePlayer(group.id, player.tempId)" class="text-slate-600 hover:text-red-500">
                                    <i class="fas fa-times"></i>
                                </button>
                           </div>
                       }
                       <button (click)="addPlayerToGroup(group.id)" class="w-full py-2 border border-dashed border-slate-700 rounded text-slate-400 hover:border-[#ccff00] hover:text-[#ccff00] text-sm transition-colors mt-2 bg-slate-800/50">
                           <i class="fas fa-plus mr-1"></i> Add Player
                       </button>
                   </div>
               </div>
           }
           
           <!-- Add Group Button -->
           <div class="flex items-center justify-center min-h-[300px] border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-xl hover:border-[#ccff00] hover:bg-slate-900 transition-all cursor-pointer group" (click)="addNewGroup()">
               <div class="text-center">
                   <div class="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-[#ccff00] transition-colors shadow-lg">
                       <i class="fas fa-plus text-slate-400 group-hover:text-black text-2xl"></i>
                   </div>
                   <span class="text-slate-400 font-medium group-hover:text-white uppercase tracking-wider">Add New Group</span>
               </div>
           </div>
       </div>

        <!-- Validation & Navigation -->
        @if (validationError()) {
            <div class="bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 rounded-r shadow-sm">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-circle text-red-500"></i>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-red-400 font-medium">{{ validationError() }}</p>
                    </div>
                </div>
            </div>
        }

       <div class="flex justify-between border-t border-slate-800 pt-6">
           <button (click)="store.setStep(1)" class="text-slate-400 hover:text-white font-medium px-4 py-2 flex items-center">
               <i class="fas fa-arrow-left mr-2"></i> Back
           </button>
           <button 
             (click)="finishStep()" 
             [disabled]="!!validationError()"
             class="bg-[#ccff00] text-black font-bold px-8 py-3 rounded-lg hover:bg-[#b3e600] shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
            >
               @if (store.settings().mode === 'Knockout Only') {
                   Generate Bracket <i class="fas fa-sitemap ml-2"></i>
               } @else {
                   Generate Matches <i class="fas fa-check ml-2"></i>
               }
           </button>
       </div>
    </div>
  `
})
export class GroupsComponent implements OnInit {
  store = inject(TournamentStore);
  
  numGroups = 2;
  playersPerGroup = 4;
  
  // Local state to manage edits before saving to store
  localGroups = signal<{id: string, name: string}[]>([]);
  localPlayers = signal<{tempId: string, groupId: string, name: string}[]>([]);
  
  validationError = signal<string | null>(null);

  ngOnInit() {
      // Check if store already has groups/players (e.g. going back from step 3)
      const existingGroups = this.store.groups();
      if (existingGroups.length > 0) {
          // Hydrate local state from store
          this.localGroups.set(existingGroups.map(g => ({...g}))); // clone
          
          const existingPlayers = this.store.players();
          this.localPlayers.set(existingPlayers.map(p => ({
              tempId: p.id,
              groupId: p.groupId,
              name: p.name
          })));

          // Update config inputs to reflect current state approximately
          this.numGroups = existingGroups.length;
          if (this.numGroups > 0) {
              const maxPlayers = Math.max(...existingGroups.map(g => 
                  existingPlayers.filter(p => p.groupId === g.id).length
              ));
              this.playersPerGroup = maxPlayers > 0 ? maxPlayers : 4;
          }
          
          this.validate();
      } else {
          // Initialize defaults
          this.configureGroups();
      }
  }

  configureGroups() {
    const groups = [];
    const players = [];
    
    for(let i=0; i<this.numGroups; i++) {
        const groupId = `g-${Date.now()}-${i}`;
        groups.push({ id: groupId, name: `Group ${String.fromCharCode(65+i)}` });
        
        for(let j=0; j<this.playersPerGroup; j++) {
            players.push({
                tempId: `p-${groupId}-${j}`,
                groupId: groupId,
                name: `Player ${i*this.playersPerGroup + j + 1}`
            });
        }
    }
    
    this.localGroups.set(groups);
    this.localPlayers.set(players);
    this.validate();
  }

  addNewGroup() {
      const i = this.localGroups().length;
      const groupId = `g-${Date.now()}-${Math.random()}`;
      this.localGroups.update(g => [...g, { id: groupId, name: `Group ${String.fromCharCode(65+i)}` }]);
      // Add default players
      const newPlayers = [];
      for(let j=0; j<this.playersPerGroup; j++) {
            newPlayers.push({
                tempId: `p-${groupId}-${j}`,
                groupId: groupId,
                name: `New Player ${j + 1}`
            });
      }
      this.localPlayers.update(p => [...p, ...newPlayers]);
      this.validate();
  }

  removeGroup(id: string) {
      this.localGroups.update(g => g.filter(x => x.id !== id));
      this.localPlayers.update(p => p.filter(x => x.groupId !== id));
      this.validate();
  }

  addPlayerToGroup(groupId: string) {
      this.localPlayers.update(p => [...p, {
          tempId: `p-${Date.now()}`,
          groupId,
          name: 'New Player'
      }]);
      this.validate();
  }

  removePlayer(groupId: string, tempId: string) {
      this.localPlayers.update(p => p.filter(x => x.tempId !== tempId));
      this.validate();
  }

  getPlayersInGroup(groupId: string) {
      return this.localPlayers().filter(p => p.groupId === groupId);
  }

  isDuplicate(name: string, currentId: string): boolean {
      if(!name) return false;
      return this.localPlayers().some(p => p.name.trim().toLowerCase() === name.trim().toLowerCase() && p.tempId !== currentId);
  }

  validate() {
      const names = this.localPlayers().map(p => p.name.trim().toLowerCase());
      const uniqueNames = new Set(names);
      
      if (names.some(n => !n)) {
          this.validationError.set("All players must have a name.");
          return;
      }
      
      if (uniqueNames.size !== names.length) {
          this.validationError.set("Duplicate player names found. Names must be unique across the tournament.");
          return;
      }

      if (this.localGroups().length === 0) {
          this.validationError.set("At least one group is required.");
          return;
      }

      this.validationError.set(null);
  }

  finishStep() {
      if (this.validationError()) return;

      // Commit to store
      this.store.groups.set(this.localGroups());
      
      // Map local players to store players (ensure structure matches)
      const storePlayers: Player[] = this.localPlayers().map(p => ({
          id: p.tempId,
          name: p.name.trim(),
          groupId: p.groupId
      }));
      this.store.players.set(storePlayers);
      
      // IMPORTANT: Only regenerate matches if they don't exist OR if user explicitly reset/changed configuration.
      // However, detecting "change" is complex. 
      // For now, if we are in this step, we assume the user intends to (re)generate the structure.
      // To be safe against accidental data loss, we could check if matches exist.
      // But typically "Next Step" implies moving forward with current config.
      
      const hasMatches = this.store.matches().length > 0;
      const isKnockout = this.store.settings().mode === 'Knockout Only';

      if (!hasMatches) {
          if (isKnockout) {
             this.store.generateKnockoutBracket();
          } else {
             this.store.generateRoundRobin();
          }
      } else {
          // If matches exist, we might want to preserve scores if players haven't changed drastically.
          // For simplicity in this applet: regenerate if players changed count, otherwise keep?
          // The store.generateRoundRobin() currently wipes matches.
          // Let's assume hitting "Next" here forces a regeneration because we just defined groups.
          // If the user just viewed this page and clicked Next without changes, it might be annoying to lose scores.
          // A safer check:
          const currentPlayersSig = JSON.stringify(this.store.players().map(p => p.id).sort());
          const matchPlayersSig = JSON.stringify([...new Set(this.store.matches().map(m => [m.p1, m.p2]).flat())].sort()); // This is hard to compare names vs IDs.
          
          // Re-generating is the standard behavior for "Wizard" steps that define structure.
          if (isKnockout) {
              if (this.store.knockoutMatches().length === 0) this.store.generateKnockoutBracket();
          } else {
              // Only regenerate if match count doesn't align or we want to force it.
              // For this version, we will regenerate to ensure consistency with the group configuration.
              this.store.generateRoundRobin(); 
          }
      }

      if (isKnockout) {
          this.store.setStep(5);
      } else {
          this.store.setStep(3);
      }
  }
}