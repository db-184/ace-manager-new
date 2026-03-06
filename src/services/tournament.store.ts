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
import { getAuth, signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';
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
  nextLoserMatchId?: string;
  bracketPos?: 'top' | 'bottom';
  completedAt?: number;
}

export interface PlayerStats {
  playerId: string;
  name: string;
  groupId: string;
  points: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
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
          
          // Enable real-time sync and control cache
          const { enableIndexedDbPersistence, enableNetwork } = await import('firebase/firestore');
          
          try {
              // Enable persistence for offline support
              await enableIndexedDbPersistence(this.db);
          } catch (err: any) {
              if (err.code === 'failed-precondition') {
                  // Multiple tabs open, persistence can only be enabled in one tab at a time
                  console.log('Persistence failed: Multiple tabs open');
              } else if (err.code === 'unimplemented') {
                  // Browser doesn't support persistence
                  console.log('Persistence not supported');
              }
          }
          
          // Ensure network is enabled for real-time updates
          await enableNetwork(this.db);

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
            ...(m.nextLoserMatchId ? { nextLoserMatchId: String(m.nextLoserMatchId) } : {}),
            ...(m.bracketPos ? { bracketPos: String(m.bracketPos) } : {}),
            ...(m.completedAt ? { completedAt: m.completedAt } : {})
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
      
      // Subscribe with options to prefer server data over cache
      this.currentTournamentUnsub = onSnapshot(
          doc(this.db, 'tournaments', id),
          { includeMetadataChanges: true },
          (docSnap) => {
              if (docSnap.exists() && !docSnap.metadata.fromCache) {
                  // Only update when we get server data, not cached data
                  const data = docSnap.data() as TournamentData;
                  this.settings.set(data.settings);
                  this.groups.set(data.groups || []);
                  this.players.set(data.players || []);
                  this.matches.set(data.matches || []);
                  this.knockoutMatches.set(data.knockoutMatches || []);
              }
          }
      );
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
    if (updates.isFinished && !updates.completedAt) {
      updates.completedAt = Date.now();
    }
    this.matches.update(ms => ms.map(m => m.id === matchId ? { ...m, ...updates } : m));
    this.saveState();
  }

  updateKnockoutMatchScore(matchId: string, updates: Partial<Match>) {
    this.knockoutMatches.update(ms => {
      return ms.map(m => {
        if (m.id === matchId) {
          const updatedMatch = { ...m, ...updates };
          if (updatedMatch.isFinished && updatedMatch.winner) {
            // Advance winner to next match
            if (updatedMatch.nextMatchId) {
              this.advancePlayer(updatedMatch.nextMatchId, updatedMatch.winner, updatedMatch.bracketPos);
            }
            // Advance loser to 3rd place match
            if (updatedMatch.nextLoserMatchId) {
              const loser = updatedMatch.winner === updatedMatch.p1 ? updatedMatch.p2 : updatedMatch.p1;
              this.advancePlayer(updatedMatch.nextLoserMatchId, loser, updatedMatch.bracketPos);
            }
          }
          return updatedMatch;
        }
        return m;
      });
    });
    this.saveState();
  }

  private advancePlayer(nextMatchId: string, playerName: string, fromPos: 'top' | 'bottom' | undefined) {
      setTimeout(() => {
          this.knockoutMatches.update(ms => ms.map(m => {
              if (m.id === nextMatchId) {
                  const isP1 = fromPos === 'top';
                  return { ...m, p1: isP1 ? playerName : m.p1, p2: !isP1 ? playerName : m.p2 };
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
  async login(e: string, p?: string) {
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, e, p || '');
      this.isAuthenticated.set(true);
      this.currentUser.set(e);
      this.currentView.set('admin');
      this.adminState.set('hub');
      return true;
    } catch (error: any) {
      console.error('Login failed:', error);
      alert(`Login failed: ${error.message || 'Invalid credentials'}`);
      return false;
    }
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
      playerId: p.id, name: p.name, groupId: p.groupId, points: 0, 
      matchesPlayed: 0, matchesWon: 0, matchesLost: 0,
      gamesWon: 0, gamesLost: 0, gamesWonPerMatch: 0, gamesLostPerMatch: 0
    }));

    groupMatches.forEach(m => {
      const p1Stats = stats.find(s => s.name === m.p1);
      const p2Stats = stats.find(s => s.name === m.p2);
      if (!p1Stats || !p2Stats) return;
      
      p1Stats.matchesPlayed++; 
      p2Stats.matchesPlayed++;
      
      if (m.winner === m.p1) {
        p1Stats.points += 2;
        p1Stats.matchesWon++;
        p2Stats.matchesLost++;
      } else if (m.winner === m.p2) {
        p2Stats.points += 2;
        p2Stats.matchesWon++;
        p1Stats.matchesLost++;
      }
      
      const { p1Games, p2Games } = this.parseGames(m.score);
      p1Stats.gamesWon += p1Games; p1Stats.gamesLost += p2Games;
      p2Stats.gamesWon += p2Games; p2Stats.gamesLost += p1Games;
    });

    stats.forEach(s => {
      s.gamesWonPerMatch = s.matchesPlayed ? s.gamesWon / s.matchesPlayed : 0;
      s.gamesLostPerMatch = s.matchesPlayed ? s.gamesLost / s.matchesPlayed : 0;
    });

    return stats.sort((a, b) => {
      // 1. Points (2 per win)
      if (b.points !== a.points) return b.points - a.points;

      // 2. Matches played (more matches played ranks higher)
      if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed;

      // 3. Total games won (higher is better)
      if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;

      // 4. Total games lost (lower is better)
      if (a.gamesLost !== b.gamesLost) return a.gamesLost - b.gamesLost;

      // 5. Head-to-head
      return this.checkHeadToHead(a.name, b.name, groupMatches);
    });
  }

  private parseGames(score: string): { p1Games: number, p2Games: number } {
    if (!score) return { p1Games: 0, p2Games: 0 };
    
    // Remove tie-breaker scores in parentheses (e.g., "(1-7)")
    const cleanScore = score.replace(/\([^)]*\)/g, '').trim();
    
    const parts = cleanScore.split(/\s+/).filter(p => p.length > 0);
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
      const numPlayers = startRound === 'Round of 16' ? 16 : startRound === 'Round of 8' ? 8 : 4;
      const groups = this.groups();

      const newMatches: Match[] = [];

      const mkId = () => Date.now().toString() + Math.random().toString().slice(2, 6);

      const createMatch = (r: string, nextId?: string, pos?: 'top' | 'bottom', nextLoserId?: string): Match => ({
          id: mkId(),
          groupId: 'knockout', p1: 'TBD', p2: 'TBD', score: '', isWalkover: false,
          winner: null, isFinished: false, setScores: [], round: r,
          nextMatchId: nextId, bracketPos: pos, nextLoserMatchId: nextLoserId
      });

      const seedMatch = (r: string, p1name: string, p2name: string, nextId?: string, pos?: 'top' | 'bottom'): Match => {
          const m = createMatch(r, nextId, pos);
          m.p1 = p1name || 'TBD';
          m.p2 = p2name || 'TBD';
          return m;
      };

      const n = (p: {name: string} | undefined) => p?.name || 'TBD';

      if (settings.mode === 'Knockout Only') {
          // Random draw
          const thirdPlace = createMatch('3rd');
          const finalMatch = createMatch('F');
          const sf1 = createMatch('SF', finalMatch.id, 'top', thirdPlace.id);
          const sf2 = createMatch('SF', finalMatch.id, 'bottom', thirdPlace.id);
          newMatches.push(thirdPlace, finalMatch, sf1, sf2);

          const players = [...this.players()].map(p => ({name: p.name})).sort(() => Math.random() - 0.5);
          const pick = (i: number) => n(players[i]);

          if (numPlayers === 4) {
              sf1.p1 = pick(0); sf1.p2 = pick(1);
              sf2.p1 = pick(2); sf2.p2 = pick(3);
          } else if (numPlayers === 8) {
              const qf1 = createMatch('QF', sf1.id, 'top');
              const qf2 = createMatch('QF', sf1.id, 'bottom');
              const qf3 = createMatch('QF', sf2.id, 'top');
              const qf4 = createMatch('QF', sf2.id, 'bottom');
              [qf1, qf2, qf3, qf4].forEach((qf, i) => { qf.p1 = pick(i * 2); qf.p2 = pick(i * 2 + 1); });
              newMatches.push(qf1, qf2, qf3, qf4);
          } else {
              const qf1 = createMatch('QF', sf1.id, 'top');
              const qf2 = createMatch('QF', sf1.id, 'bottom');
              const qf3 = createMatch('QF', sf2.id, 'top');
              const qf4 = createMatch('QF', sf2.id, 'bottom');
              newMatches.push(qf1, qf2, qf3, qf4);
              const qfs = [qf1, qf2, qf3, qf4];
              for (let i = 0; i < 4; i++) {
                  newMatches.push(
                      seedMatch('Ro16', pick(i * 4), pick(i * 4 + 3), qfs[i].id, 'top'),
                      seedMatch('Ro16', pick(i * 4 + 1), pick(i * 4 + 2), qfs[i].id, 'bottom')
                  );
              }
          }

      } else {
          // Round-Robin + Knockout
          // Groups paired first-vs-last: (A,D), (B,C) for 4 groups
          if (groups.length === 0) return;

          const perGroup = Math.ceil(numPlayers / groups.length);

          // 3rd place play-off + Final
          const thirdPlace = createMatch('3rd');
          const finalMatch = createMatch('F');

          // SFs feed winners to Final and losers to 3rd place
          const sf1 = createMatch('SF', finalMatch.id, 'top', thirdPlace.id);
          const sf2 = createMatch('SF', finalMatch.id, 'bottom', thirdPlace.id);
          newMatches.push(thirdPlace, finalMatch, sf1, sf2);

          const numPairs = Math.floor(groups.length / 2);
          const groupPairs: [typeof groups[0], typeof groups[0]][] = [];
          for (let i = 0; i < numPairs; i++) {
              groupPairs.push([groups[i], groups[groups.length - 1 - i]]);
          }
          const sfSlots = [sf1, sf2];

          if (numPlayers === 4) {
              // 2 groups → directly into SFs
              const [gFirst, gLast] = groupPairs[0].map(g => this.getGroupStandings(g.id));
              sf1.p1 = n(gFirst[0]); sf1.p2 = n(gLast[0]);
              sf2.p1 = n(gFirst[1]); sf2.p2 = n(gLast[1]);

          } else if (numPlayers === 8) {
              // Each pair → 2 QFs feeding into one SF
              groupPairs.forEach(([groupA, groupB], pairIdx) => {
                  const gFirst = this.getGroupStandings(groupA.id);
                  const gLast  = this.getGroupStandings(groupB.id);
                  const sf = sfSlots[pairIdx];
                  const qfA = createMatch('QF', sf.id, 'top');
                  const qfB = createMatch('QF', sf.id, 'bottom');
                  qfA.p1 = n(gFirst[0]); qfA.p2 = n(gLast[1]);
                  qfB.p1 = n(gLast[0]);  qfB.p2 = n(gFirst[1]);
                  newMatches.push(qfA, qfB);
              });

          } else {
              // Round of 16 — exact format from tournament sheet:
              //
              // R16 (A vs D, rank-by-rank):
              //   M1: A1 vs D4 → QF9 (top)
              //   M2: A2 vs D3 → QF12 (bottom)
              //   M3: A3 vs D2 → QF11 (bottom)
              //   M4: A4 vs D1 → QF10 (top)
              //
              // R16 (B vs C, rank-by-rank):
              //   M5: B1 vs C4 → QF11 (top)
              //   M6: B2 vs C3 → QF10 (bottom)
              //   M7: B3 vs C2 → QF9 (bottom)
              //   M8: B4 vs C1 → QF12 (top)
              //
              // QFs (cross A/D vs B/C):
              //   QF9:  W(M1) vs W(M7) → SF1 top
              //   QF10: W(M4) vs W(M6) → SF2 top
              //   QF11: W(M5) vs W(M3) → SF2 bottom
              //   QF12: W(M8) vs W(M2) → SF1 bottom
              //
              // SFs: W(QF9) vs W(QF12) → SF1; W(QF10) vs W(QF11) → SF2
              // 3rd place: L(SF1) vs L(SF2)
              // Final: W(SF1) vs W(SF2)

              // Create 4 QFs
              const qf9  = createMatch('QF', sf1.id, 'top');
              const qf12 = createMatch('QF', sf1.id, 'bottom');
              const qf10 = createMatch('QF', sf2.id, 'top');
              const qf11 = createMatch('QF', sf2.id, 'bottom');
              newMatches.push(qf9, qf12, qf10, qf11);

              // Get standings for all 4 group pairs
              groupPairs.forEach(([groupA, groupB], pairIdx) => {
                  const gFirst = this.getGroupStandings(groupA.id); // e.g. Group A
                  const gLast  = this.getGroupStandings(groupB.id); // e.g. Group D

                  if (pairIdx === 0) {
                      // A vs D — feeds into QF9 and QF12 (SF1 side)
                      // Also cross-feeds into QF10 and QF11 (SF2 side) at QF level
                      newMatches.push(
                          seedMatch('Ro16', n(gFirst[0]), n(gLast[perGroup - 1]), qf9.id,  'top'),    // M1: A1 vs D4
                          seedMatch('Ro16', n(gFirst[1]), n(gLast[perGroup - 2]), qf12.id, 'bottom'), // M2: A2 vs D3
                          seedMatch('Ro16', n(gFirst[2]), n(gLast[perGroup - 3]), qf11.id, 'bottom'), // M3: A3 vs D2
                          seedMatch('Ro16', n(gFirst[3]), n(gLast[perGroup - 4]), qf10.id, 'top'),    // M4: A4 vs D1
                      );
                  } else {
                      // B vs C — feeds into QF11 and QF10 (SF2 side)
                      // Also cross-feeds into QF9 and QF12 (SF1 side) at QF level
                      newMatches.push(
                          seedMatch('Ro16', n(gFirst[0]), n(gLast[perGroup - 1]), qf11.id, 'top'),    // M5: B1 vs C4
                          seedMatch('Ro16', n(gFirst[1]), n(gLast[perGroup - 2]), qf10.id, 'bottom'), // M6: B2 vs C3
                          seedMatch('Ro16', n(gFirst[2]), n(gLast[perGroup - 3]), qf9.id,  'bottom'), // M7: B3 vs C2
                          seedMatch('Ro16', n(gFirst[3]), n(gLast[perGroup - 4]), qf12.id, 'top'),    // M8: B4 vs C1
                      );
                  }
              });
          }
      }

      this.knockoutMatches.set(newMatches);
      this.saveState();
  }
}