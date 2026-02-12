import { bootstrapApplication } from '@angular/platform-browser'; import { AppComponent } from './src/app.component'; import { firebaseConfig } from './src/firebase.config'; import { initializeApp } from 'firebase/app';

// Initialize Firebase before the app starts initializeApp(firebaseConfig);

// Start the Angular application using the root component 

bootstrapApplication(AppComponent) .catch((err) => console.error(err));
