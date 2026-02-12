import { bootstrapApplication } from '@angular/platform-browser'; import { AppComponent } from './src/app.component'; import { firebaseConfig } from './src/firebase.config'; import { initializeApp } from 'firebase/app';

// Initialize Firebase initializeApp(firebaseConfig);

bootstrapApplication(AppComponent) .catch((err) => console.error(err));
