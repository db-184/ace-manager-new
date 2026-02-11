import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentStore } from '../services/tournament.store';

@Component({
  selector: 'app-tournament-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto">
        <div class="mb-10">
            <h2 class="text-4xl font-bold text-white font-['Chakra_Petch'] mb-2">{{ store.settings().name }}</h2>
            <div class="flex items-center space-x-4 text-sm text-slate-400">
                 <span class="bg-slate-900 border border-slate-700 px-3 py-1 rounded">{{ store.settings().format }}</span>
                 <span>&bull;</span>
                 <span class="text-[#ccff00] uppercase font-bold tracking-wider">Tournament Overview</span>
            </div>
        </div>

        <!-- Overall Progress -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-8 mb-10 shadow-2xl relative overflow-hidden">
             <div class="absolute top-0 right-0 p-4 opacity-10">
                <i class="fas fa-chart-pie text-9xl text-[#ccff00]"></i>
             </div>
             
             <h3 class="text-lg font-bold text-white uppercase tracking-wider mb-6">Tournament Progress</h3>
             
             <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                 <div>
                     <p class="text-sm text-slate-500 mb-1">Total Matches</p>
                     <p class="text-4xl font-black text-white font-mono">{{ store.stats().total }}</p>
                 </div>
                 <div>
                     <p class="text-sm text-slate-500 mb-1">Completed</p>
                     <p class="text-4xl font-black text-[#ccff00] font-mono">{{ store.stats().completed }}</p>
                 </div>
                 <div>
                     <p class="text-sm text-slate-500 mb-1">Completion Rate</p>
                     <p class="text-4xl font-black text-white font-mono">
                        {{ store.stats().total > 0 ? Math.round((store.stats().completed / store.stats().total) * 100) : 0 }}<span class="text-lg align-top text-slate-500">%</span>
                     </p>
                 </div>
             </div>

             <!-- Bar -->
             <div class="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
                 <div class="bg-[#ccff00] h-full transition-all duration-1000 ease-out" [style.width.%]="store.stats().total > 0 ? (store.stats().completed / store.stats().total) * 100 : 0"></div>
             </div>
        </div>

        <!-- Group Breakdown -->
        @if (store.settings().mode !== 'Knockout Only') {
            <h3 class="text-2xl font-bold text-white mb-6 flex items-center">
                <span class="w-2 h-8 bg-[#ccff00] mr-3 rounded-full"></span>
                Group Progress
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                @for (group of store.stats().groupStats; track group.groupId) {
                    <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-600 transition-colors">
                        <div class="flex justify-between items-start mb-4">
                            <h4 class="text-xl font-bold text-white uppercase tracking-tight">{{ group.groupName }}</h4>
                            <span class="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">{{ group.completed }} / {{ group.total }}</span>
                        </div>
                        
                        <div class="w-full bg-slate-950 rounded-full h-2 mb-6">
                             <div class="bg-[#ccff00] h-full rounded-full transition-all" [style.width.%]="group.total > 0 ? (group.completed / group.total) * 100 : 0"></div>
                        </div>

                        <button 
                            (click)="store.manageGroupScores(group.groupId)"
                            class="w-full bg-[#ccff00]/10 hover:bg-[#ccff00] text-[#ccff00] hover:text-black border border-[#ccff00]/20 font-bold py-3 rounded-lg transition-all uppercase text-sm tracking-wide flex items-center justify-center"
                        >
                            <i class="fas fa-edit mr-2"></i> Edit Scores
                        </button>
                    </div>
                }
            </div>
        }

        <!-- Quick Actions -->
        <div class="border-t border-slate-800 pt-8 flex gap-4">
             <button (click)="store.setStep(1)" class="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors">
                <i class="fas fa-cog mr-2"></i> Edit Settings
             </button>
             <button (click)="store.setStep(2)" class="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors">
                <i class="fas fa-users mr-2"></i> Manage Groups
             </button>
             <button (click)="store.setStep(5)" class="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors">
                <i class="fas fa-sitemap mr-2"></i> Knockout Bracket
             </button>
        </div>
    </div>
  `
})
export class TournamentSummaryComponent {
  store = inject(TournamentStore);
  Math = Math;
}