import { Injectable, signal, computed } from '@angular/core';
import * as firebaseApp from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  Firestore, 
  Unsubscribe 
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { firebaseConfig } from '../firebase.config';

export interface Player {
  id: string;
  name: string;
  groupId: string;
}

export interface Group {
  id: string;
  name: string;
}

export interface Match {
  id: string;
  groupId: string; 
  p1: string; 
  p2: string; 
  score: string;
  isWalkover: boolean;
  winner: string | null;
  isFinished: boolean;
  setScores: string[];
  round?: string; 
  nextMatchId?: string;
  bracketPos?: 'top' | 'bottom'; 
}

export interface PlayerStats {
  playerId: string;
  name: string;
  groupId: string;
  points: number;
  matchesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesWonPerMatch: number;
  gamesLostPerMatch: number;
}

export interface TournamentSettings {
  name: string;
  format: 'Singles' | 'Doubles';
  setCount: 1 | 3 | 5;
  mode: 'Round-Robin + Knockout' | 'Knockout Only';
  knockoutStart: 'Round of 16' | 'Round of 8' | 'Semi-finals';
}

export interface TournamentSummary {
    id: string;
    name: string;
    status: 'Live' | 'Upcoming' | 'Completed';
    playersCount: number;
    format: 'Singles' | 'Doubles';
    location: string;
}

interface TournamentData {
    settings: TournamentSettings;
    groups: Group[];
    players: Player[];
    matches: Match[];
    knockoutMatches: Match[];
}

@Injectable({
  providedIn: 'root'
})
export class TournamentStore {
  // Navigation & State
  currentView = signal<'landing' | 'login' | 'admin' | 'public'>('landing');
  adminState = signal<'hub' | 'details'>('hub');
  isAuthenticated = signal<boolean>(false);
  currentUser = signal<string | null>(null);
  currentStep = signal<number>(1);
  activeGroupFilter = signal<string | null>(null);
  globalError = signal<string | null>(null);

  // Persistence
  private db: Firestore | null = null;
  currentTournamentId = signal<string | null>(null);
  private currentTournamentUnsub: Unsubscribe | null = null;

  // Active Data
  settings = signal<TournamentSettings>({
    name: '',
    format: 'Singles',
    setCount: 3,
    mode: 'Round-Robin + Knockout',
    knockoutStart: 'Round of 8'
  });

  groups = signal<Group[]>([]);
  players = signal<Player[]>([]);
  matches = signal<Match[]>([]);
  knockoutMatches = signal<Match[]>([]);
  tournamentsList = signal<TournamentSummary[]>([]);

  stats = computed(() => {
      const rrMatches = this.matches();
      const koMatches = this.knockoutMatches();
      // Combine matches for total stats
      const allMatches = [...rrMatches, ...koMatches];
      
      const total = allMatches.length;
      const completed = allMatches.filter(m => m.isFinished).length;
      
      // Group stats specific to Round Robin
      const groupStats = this.groups().map(g => {
          const gMatches = rrMatches.filter(m => m.groupId === g.id);
          return {
              groupId: g.id,
              groupName: g.name,
              total: gMatches.length,
              completed: gMatches.filter(m => m.isFinished).length
          };
      });
      return { total, completed, groupStats };
  });

  constructor() {
      this.initFirebase();
  }

  private async initFirebase() {
      try {
          if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") {
              this.globalError.set("Firebase configuration missing.");
              return;
          }
          
          const fb = firebaseApp as any;
          const app = fb.getApps().length === 0 
              ? fb.initializeApp(firebaseConfig) 
              : fb.getApp();

          const auth = getAuth(app);
          this.db = getFirestore(app);

          try {
             await signInAnonymously(auth);
          } catch (authErr: any) {
             if (authErr.code === 'auth/operation-not-allowed') {
                 this.globalError.set("Enable 'Anonymous' sign-in in Firebase Console.");
                 return;
             }
          }
          
          onSnapshot(collection(this.db!, 'tournaments'), (snapshot) => {
             this.globalError.set(null);
             const summaries: TournamentSummary[] = snapshot.docs.map(doc => {
                 const data = doc.data() as TournamentData;
                 let status: 'Upcoming' | 'Live' | 'Completed' = 'Upcoming';
                 if (data.matches?.length > 0) status = 'Live';
                 if (data.knockoutMatches?.some(m => m.isFinished && m.round === 'F')) status = 'Completed';

                 return {
                     id: doc.id,
                     name: data.settings?.name || 'Untitled',
                     status: status,
                     playersCount: data.players?.length || 0,
                     format: data.settings?.format || 'Singles',
                     location: 'Main Court'
                 };
             });
             this.tournamentsList.set(summaries);
          }, (err) => {
              if (err.code === 'permission-denied') {
                  this.globalError.set("ACCESS DENIED: Check Firestore Rules.");
              }
          });
      } catch (e: any) {
          this.globalError.set(`Initialization Error: ${e.message}`);
      }
  }

  // --- SAFE SAVE LOGIC ---
  private saveState() {
    const id = this.currentTournamentId();
    if (!id || !this.db) return;

    try {
        // Defensive Mapping: Explicitly cast every field to primitive to avoid hidden objects/circles
        const mapMatch = (m: Match): any => ({
            id: String(m.id || ''),
            groupId: String(m.groupId || ''),
            p1: String(m.p1 || ''),
            p2: String(m.p2 || ''),
            score: String(m.score || ''),
            isWalkover: !!m.isWalkover,
            winner: m.winner ? String(m.winner) : null,
            isFinished: !!m.isFinished,
            setScores: Array.isArray(m.setScores) ? m.setScores.map(s => String(s)) : [],
            ...(m.round ? { round: String(m.round) } : {}),
            ...(m.nextMatchId ? { nextMatchId: String(m.nextMatchId) } : {}),
            ...(m.bracketPos ? { bracketPos: String(m.bracketPos) } : {})
        });

        const currentData: TournamentData = {
            settings: { 
                name: String(this.settings().name || ''),
                format: this.settings().format,
                setCount: this.settings().setCount,
                mode: this.settings().mode,
                knockoutStart: this.settings().knockoutStart
            },
            groups: this.groups().map(g => ({ id: String(g.id), name: String(g.name) })),
            players: this.players().map(p => ({ 
                id: String(p.id), 
                name: String(p.name), 
                groupId: String(p.groupId) 
            })),
            matches: this.matches().map(mapMatch),
            knockoutMatches: this.knockoutMatches().map(mapMatch)
        };

        // Double check against circular structures before sending to Firebase
        const sanitized = JSON.parse(JSON.stringify(currentData));

        setDoc(doc(this.db, 'tournaments', id), sanitized).catch(err => {
            console.error("Firestore Save Error:", String(err));
        });
    } catch (e) {
        console.error("Critical: Failed to sanitize state for saving.", e);
    }
  }

  createNewTournament() {
      this.resetData();
      const newId = Date.now().toString();
      this.currentTournamentId.set(newId);
      // Removed saveState() here - it will be called when user enters settings in step 1
      this.subscribeToTournament(newId);
      this.adminState.set('details');
      this.currentStep.set(1);
  }

  loadAdminTournament(id: string) {
      this.currentTournamentId.set(id);
      this.subscribeToTournament(id);
      this.adminState.set('details');
      this.currentStep.set(0); 
  }

  private subscribeToTournament(id: string) {
      if (!this.db) return;
      if (this.currentTournamentUnsub) this.currentTournamentUnsub();
      this.currentTournamentUnsub = onSnapshot(doc(this.db, 'tournaments', id), (docSnap) => {
          if (docSnap.exists()) {
              const data = docSnap.data() as TournamentData;
              this.settings.set(data.settings);
              this.groups.set(data.groups || []);
              this.players.set(data.players || []);
              this.matches.set(data.matches || []);
              this.knockoutMatches.set(data.knockoutMatches || []);
          }
      });
  }

  deleteTournament(id: string) {
      if (!this.db) return;
      deleteDoc(doc(this.db, 'tournaments', id));
      if (this.currentTournamentId() === id) {
          this.backToHub();
      }
  }

  updateSettings(newSettings: TournamentSettings) {
    this.settings.set(newSettings);
    this.saveState();
  }

  addGroup(groupName: string) {
    const id = Date.now().toString() + Math.random().toString().slice(2, 5);
    this.groups.update(g => [...g, { id, name: groupName }]);
    this.saveState();
    return id;
  }

  addPlayer(name: string, groupId: string) {
    const id = Date.now().toString() + Math.random().toString().slice(2, 5);
    this.players.update(p => [...p, { id, name, groupId }]);
    this.saveState();
  }

  updatePlayerName(playerId: string, newName: string) {
    const player = this.players().find(p => p.id === playerId);
    if (player) {
        const oldName = player.name;
        this.players.update(all => all.map(p => p.id === playerId ? { ...p, name: newName } : p));
        
        const updateMatchNames = (m: Match) => {
            let p1 = m.p1; let p2 = m.p2; let winner = m.winner;
            if (p1 === oldName) p1 = newName;
            if (p2 === oldName) p2 = newName;
            if (winner === oldName) winner = newName;
            return { ...m, p1, p2, winner };
        };

        this.matches.update(ms => ms.map(updateMatchNames));
        this.knockoutMatches.update(ks => ks.map(updateMatchNames));
        this.saveState();
    }
  }

  deletePlayer(playerId: string) {
      const player = this.players().find(p => p.id === playerId);
      if (player) {
          const playerName = player.name;
          this.players.update(ps => ps.filter(p => p.id !== playerId));
          this.matches.update(ms => ms.filter(m => m.p1 !== playerName && m.p2 !== playerName));
          this.saveState();
      }
  }

  generateRoundRobin() {
    const allMatches: Match[] = [];
    const players = this.players();
    this.groups().forEach(group => {
      const names = players.filter(p => p.groupId === group.id).map(p => p.name);
      for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
           allMatches.push({
             id: Math.random().toString(36).substr(2, 9),
             groupId: group.id, p1: names[i], p2: names[j],
             score: '', isWalkover: false, winner: null, isFinished: false, setScores: []
           });
        }
      }
    });
    this.matches.set(allMatches);
    this.saveState();
  }

  updateMatchScore(matchId: string, updates: Partial<Match>) {
    this.matches.update(ms => ms.map(m => m.id === matchId ? { ...m, ...updates } : m));
    this.saveState();
  }

  updateKnockoutMatchScore(matchId: string, updates: Partial<Match>) {
    this.knockoutMatches.update(ms => {
      return ms.map(m => {
        if (m.id === matchId) {
          const updatedMatch = { ...m, ...updates };
          if (updatedMatch.isFinished && updatedMatch.winner && updatedMatch.nextMatchId) {
            this.advanceWinner(updatedMatch.nextMatchId, updatedMatch.winner, updatedMatch.bracketPos);
          }
          return updatedMatch;
        }
        return m;
      });
    });
    this.saveState();
  }

  private advanceWinner(nextMatchId: string, winnerName: string, fromPos: 'top' | 'bottom' | undefined) {
      setTimeout(() => {
          this.knockoutMatches.update(ms => ms.map(m => {
              if (m.id === nextMatchId) {
                  const isP1 = fromPos === 'top';
                  return { ...m, p1: isP1 ? winnerName : m.p1, p2: !isP1 ? winnerName : m.p2 };
              }
              return m;
          }));
          this.saveState();
      }, 0);
  }

  resetData() {
    this.groups.set([]); this.players.set([]); this.matches.set([]); this.knockoutMatches.set([]);
    this.settings.set({ name: '', format: 'Singles', setCount: 3, mode: 'Round-Robin + Knockout', knockoutStart: 'Round of 8' });
  }

  goHome() { this.currentView.set('landing'); this.currentTournamentId.set(null); }
  goToLogin() { this.currentView.set('login'); }
  login(e: string, p?: string) {
    if (e === 'admin@acemanager.com' && p === 'admin123') {
        this.isAuthenticated.set(true); this.currentUser.set(e);
        this.currentView.set('admin'); this.adminState.set('hub');
        return true;
    }
    return false;
  }
  logout() { 
      this.isAuthenticated.set(false); this.currentUser.set(null); this.currentView.set('landing'); 
      if (this.currentTournamentUnsub) { this.currentTournamentUnsub(); this.currentTournamentUnsub = null; }
  }
  backToHub() { 
      this.currentTournamentId.set(null); this.adminState.set('hub'); 
      if (this.currentTournamentUnsub) { this.currentTournamentUnsub(); this.currentTournamentUnsub = null; }
  }
  setStep(s: number) { this.currentStep.set(s); }
  manageGroupScores(groupId: string) { this.activeGroupFilter.set(groupId); this.currentStep.set(4); }
  enterPublicTournament(id: string) { this.currentTournamentId.set(id); this.subscribeToTournament(id); this.currentView.set('public'); }

  getGroupStandings(groupId: string): PlayerStats[] {
    const groupMatches = this.matches().filter(m => m.groupId === groupId && m.isFinished);
    const groupPlayers = this.players().filter(p => p.groupId === groupId);
    
    const stats: PlayerStats[] = groupPlayers.map(p => ({
      playerId: p.id, name: p.name, groupId: p.groupId, points: 0, matchesPlayed: 0,
      gamesWon: 0, gamesLost: 0, gamesWonPerMatch: 0, gamesLostPerMatch: 0
    }));

    groupMatches.forEach(m => {
      const p1Stats = stats.find(s => s.name === m.p1);
      const p2Stats = stats.find(s => s.name === m.p2);
      if (!p1Stats || !p2Stats) return;
      p1Stats.matchesPlayed++; p2Stats.matchesPlayed++;
      if (m.winner === m.p1) p1Stats.points += 2;
      else if (m.winner === m.p2) p2Stats.points += 2;
      const { p1Games, p2Games } = this.parseGames(m.score);
      p1Stats.gamesWon += p1Games; p1Stats.gamesLost += p2Games;
      p2Stats.gamesWon += p2Games; p2Stats.gamesLost += p1Games;
    });

    stats.forEach(s => {
      s.gamesWonPerMatch = s.matchesPlayed ? s.gamesWon / s.matchesPlayed : 0;
      s.gamesLostPerMatch = s.matchesPlayed ? s.gamesLost / s.matchesPlayed : 0;
    });

    return stats.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const h2h = this.checkHeadToHead(a.name, b.name, groupMatches);
      if (h2h !== 0) return h2h;
      return b.gamesWonPerMatch - a.gamesWonPerMatch || a.gamesLostPerMatch - b.gamesLostPerMatch;
    });
  }

  private parseGames(score: string): { p1Games: number, p2Games: number } {
    if (!score) return { p1Games: 0, p2Games: 0 };
    const parts = score.trim().split(/\s+/);
    let p1T = 0; let p2T = 0;
    parts.forEach(part => {
        const scores = part.split('-');
        if (scores.length === 2) {
            const g1 = parseInt(scores[0]); const g2 = parseInt(scores[1]);
            if (!isNaN(g1)) p1T += g1; if (!isNaN(g2)) p2T += g2;
        }
    });
    return { p1Games: p1T, p2Games: p2T };
  }

  private checkHeadToHead(p1: string, p2: string, matches: Match[]): number {
      const match = matches.find(m => (m.p1 === p1 && m.p2 === p2) || (m.p1 === p2 && m.p2 === p1));
      if (!match || !match.winner) return 0;
      return match.winner === p1 ? -1 : 1;
  }

  generateKnockoutBracket() {
      const settings = this.settings();
      const startRound = settings.knockoutStart;
      let numPlayers = startRound === 'Round of 16' ? 16 : startRound === 'Round of 8' ? 8 : 4;

      let qualifiedPlayers: {name: string}[] = [];

      if (settings.mode === 'Knockout Only') {
          qualifiedPlayers = [...this.players()]
            .map(p => ({name: p.name}))
            .sort(() => Math.random() - 0.5);
      } else {
          const groups = this.groups();
          if (groups.length === 0) return;
          const perGroup = Math.ceil(numPlayers / groups.length);
          groups.forEach(g => qualifiedPlayers.push(...this.getGroupStandings(g.id).slice(0, perGroup)));
      }

      const newMatches: Match[] = [];
      const createMatch = (r: string, nextId?: string, pos?: 'top' | 'bottom'): Match => ({
          id: Date.now().toString() + Math.random().toString().slice(2, 6),
          groupId: 'knockout', p1: 'TBD', p2: 'TBD', score: '', isWalkover: false,
          winner: null, isFinished: false, setScores: [], round: r, nextMatchId: nextId, bracketPos: pos
      });

      const finalMatch = createMatch('F');
      newMatches.push(finalMatch);

      if (numPlayers >= 4) {
          const sf1 = createMatch('SF', finalMatch.id, 'top');
          const sf2 = createMatch('SF', finalMatch.id, 'bottom');
          newMatches.push(sf1, sf2);
          if (numPlayers >= 8) {
               newMatches.push(createMatch('QF', sf1.id, 'top'), createMatch('QF', sf1.id, 'bottom'),
                               createMatch('QF', sf2.id, 'top'), createMatch('QF', sf2.id, 'bottom'));
          }
      }

      const startMatches = newMatches.filter(m => m.round === (numPlayers === 4 ? 'SF' : numPlayers === 8 ? 'QF' : 'Ro16'));
      startMatches.sort((a,b) => (a.bracketPos === 'top' ? -1 : 1));

      for(let i=0; i < startMatches.length; i++) {
          const m = startMatches[i];
          const p1 = qualifiedPlayers[i*2]; 
          const p2 = qualifiedPlayers[i*2 + 1];
          if (p1) m.p1 = p1.name; 
          if (p2) m.p2 = p2.name;
      }

      this.knockoutMatches.set(newMatches);
      this.saveState();
  }
}