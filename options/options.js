import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

// Replace with your Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // Get this from Firebase Console
    authDomain: "YOUR_AUTH_DOMAIN", // Get this from Firebase Console
    projectId: "YOUR_PROJECT_ID", // Get this from Firebase Console
    storageBucket: "YOUR_STORAGE_BUCKET", // Get this from Firebase Console
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Get this from Firebase Console
    appId: "YOUR_APP_ID", // Get this from Firebase Console
    measurementId: "YOUR_MEASUREMENT_ID" // Get this from Firebase Console
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', function() {
  const loginStatus = document.getElementById('login-status');
  const loginButton = document.getElementById('login-button');
  const optionsForm = document.getElementById('options-form');
  const defaultTags = document.getElementById('default-tags');
  const saveOptions = document.getElementById('save-options');

  // Check login status
  getUserInfo(false).then(user => {
    console.log('User info:', user);
    loginStatus.textContent = `Logged in as ${user.email}`;
    loginButton.classList.add('hidden');
    noteForm.classList.remove('hidden');
  }).catch(error => {
    console.log('Not logged in:', error);
    loginStatus.textContent = 'Not logged in';
    loginButton.classList.remove('hidden');
    noteForm.classList.add('hidden');
  });;

  // Login with Chrome Identity
  loginButton.addEventListener('click', () => {
    console.log('Login button clicked');
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError) {
        console.error('Error getting auth token:', chrome.runtime.lastError);
      } else {
        console.log('Auth token received:', token);
        getUserInfo(true).then(user => {
          console.log('Login successful:', user);
          loginStatus.textContent = `Logged in as ${user.email}`;
          loginButton.classList.add('hidden');
          optionsForm.classList.remove('hidden');
        }).catch(error => {
          console.error('Error getting user info:', error);
        });
      }
    });
  });

  // Save options
  saveOptions.addEventListener('click', () => {
    const tags = defaultTags.value.split(',').map(tag => tag.trim());
    chrome.storage.sync.set({ defaultTags: tags }, () => {
      alert('Options saved successfully!');
    });
  });

  // Load options
  function loadOptions() {
    chrome.storage.sync.get('defaultTags', (result) => {
      if (result.defaultTags) {
        defaultTags.value = result.defaultTags.join(', ');
      }
    });
  }
});