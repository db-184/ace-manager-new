import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentStore, TournamentSettings } from '../services/tournament.store';
import { GoogleGenAI } from "@google/genai";

declare var process: any;

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto bg-slate-900 p-8 rounded-xl shadow-2xl border border-slate-800">
      <h2 class="text-3xl font-bold text-white mb-8 flex items-center font-['Chakra_Petch']">
        <span class="bg-[#ccff00] text-black w-8 h-8 rounded flex items-center justify-center text-lg mr-4 font-bold shadow-[0_0_10px_#ccff00]">1</span>
        Tournament Setup
      </h2>

      <div class="space-y-8">
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">Tournament Name</label>
          <div class="flex gap-2">
            <input 
              type="text" 
              [(ngModel)]="settings.name" 
              class="block w-full rounded-lg border-slate-700 bg-slate-800 text-white shadow-sm focus:border-[#ccff00] focus:ring-[#ccff00] sm:text-sm p-3 border placeholder-slate-500 transition-colors" 
              placeholder="e.g. Grand Slam 2026"
            >
            <button 
              (click)="generateName()" 
              [disabled]="isGenerating()"
              class="px-4 py-2 bg-slate-800 text-[#ccff00] rounded-lg hover:bg-slate-700 border border-slate-700 hover:border-[#ccff00] text-sm flex items-center transition-all disabled:opacity-50"
              title="Generate name with AI"
            >
              @if (isGenerating()) {
                <i class="fas fa-spinner fa-spin"></i>
              } @else {
                <i class="fas fa-bolt"></i>
              }
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">Format</label>
          <select 
            [(ngModel)]="settings.format" 
            class="block w-full rounded-lg border-slate-700 bg-slate-800 text-white shadow-sm focus:border-[#ccff00] focus:ring-[#ccff00] sm:text-sm p-3 border"
          >
            <option value="Singles">Singles</option>
            <option value="Doubles">Doubles</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">Set Count</label>
          <div class="flex space-x-4">
            @for (count of [1, 3, 5]; track count) {
              <label class="flex-1 flex items-center justify-center space-x-2 cursor-pointer p-4 border rounded-lg hover:bg-slate-800 transition-all" 
                [class.border-[#ccff00]]="settings.setCount === count"
                [class.bg-slate-800]="settings.setCount === count"
                [class.border-slate-700]="settings.setCount !== count"
              >
                <input type="radio" name="setCount" [value]="count" [(ngModel)]="settings.setCount" class="text-[#ccff00] focus:ring-[#ccff00] bg-slate-900 border-slate-600">
                <span class="text-white font-medium">{{ count }} Set{{ count > 1 ? 's' : '' }}</span>
              </label>
            }
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">Tournament Mode</label>
          <select 
            [(ngModel)]="settings.mode" 
            class="block w-full rounded-lg border-slate-700 bg-slate-800 text-white shadow-sm focus:border-[#ccff00] focus:ring-[#ccff00] sm:text-sm p-3 border"
          >
            <option value="Round-Robin + Knockout">Round-Robin + Knockout</option>
            <option value="Knockout Only">Knockout Only</option>
          </select>
        </div>

        @if (settings.mode === 'Round-Robin + Knockout') {
          <div class="animate-fade-in bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <label class="block text-sm font-medium text-[#ccff00] mb-3 uppercase tracking-wider">Knockout Qualification Cutoff</label>
            <div class="grid grid-cols-3 gap-3">
              @for (stage of ['Round of 16', 'Round of 8', 'Semi-finals']; track stage) {
                <button 
                   type="button"
                   (click)="settings.knockoutStart = $any(stage)"
                   [class]="settings.knockoutStart === stage 
                      ? 'bg-[#ccff00] text-black border-transparent font-bold shadow-[0_0_10px_rgba(204,255,0,0.4)]' 
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'"
                   class="border rounded-lg py-3 px-2 text-sm focus:outline-none transition-all"
                >
                  {{ stage }}
                </button>
              }
            </div>
          </div>
        }
      </div>

      <div class="mt-10 flex justify-end">
        <button 
          (click)="nextStep()" 
          [disabled]="!settings.name"
          class="bg-[#ccff00] text-black font-bold px-8 py-3 rounded-lg hover:bg-[#b3e600] focus:outline-none focus:ring-2 focus:ring-[#ccff00] focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-all uppercase tracking-wide"
        >
          Next Step <i class="fas fa-arrow-right ml-2"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
  `]
})
export class SetupComponent {
  store = inject(TournamentStore);
  
  // Use a local copy to avoid partial saves while typing
  settings: TournamentSettings = { ...this.store.settings() };
  isGenerating = signal(false);

  nextStep() {
    // When moving forward, we commit the local settings to the global store
    this.store.updateSettings(this.settings);
    this.store.setStep(2);
  }

  async generateName() {
    const apiKey = process.env.API_KEY; 
    if (!apiKey) {
        alert('AI features require an API Key. Check your environment variables.');
        return;
    }

    this.isGenerating.set(true);
    try {
        const ai = new GoogleGenAI({apiKey: apiKey});
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: 'Generate a creative, short, professional name for a tennis tournament. Just return the name string, nothing else.'
        });
        
        const text = response.text;

        if (text) {
            this.settings.name = String(text).trim().replace(/^"|"$/g, '');
        }
    } catch (e) {
        console.error("AI Error:", e);
        alert('Failed to generate name. Please enter it manually.');
    } finally {
        this.isGenerating.set(false);
    }
  }
}