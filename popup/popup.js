import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

console.log('popup.js loaded');

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

console.log('Initializing Firebase');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let userInfo = null;

function getUserInfo(interactive = true) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: interactive }, function(token) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + token)
          .then(response => response.json())
          .then(data => {
            userInfo = data;
            resolve(data);
          })
          .catch(error => reject(error));
      }
    });
  });
}

function updateUIState(isLoggedIn) {
  const loginStatus = document.getElementById('login-status');
  const loginButton = document.getElementById('login-button');
  const logoutButton = document.getElementById('logoutButton');
  const noteForm = document.getElementById('note-form');

  if (isLoggedIn) {
    loginStatus.textContent = `Logged in as ${userInfo.email}`;
    loginButton.classList.add('hidden');
    logoutButton.classList.remove('hidden');
    noteForm.classList.remove('hidden');
  } else {
    loginStatus.textContent = 'Not logged in';
    loginButton.classList.remove('hidden');
    logoutButton.classList.add('hidden');
    noteForm.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM content loaded');
  
  const loginButton = document.getElementById('login-button');
  const logoutButton = document.getElementById('logoutButton');
  const noteContent = document.getElementById('note-content');
  const saveNote = document.getElementById('save-note');

  console.log('Login button:', loginButton);
  console.log('Logout button:', logoutButton);

  // Check login status
  getUserInfo(false).then(user => {
    console.log('User info:', user);
    updateUIState(true);
  }).catch(error => {
    console.log('Not logged in:', error);
    updateUIState(false);
  });

  // Login with Chrome Identity
  loginButton.addEventListener('click', () => {
    console.log('Login button clicked');
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError) {
        console.error('Error getting auth token:', chrome.runtime.lastError);
      } else {
        console.log('Auth token received');
        getUserInfo(true).then(user => {
          console.log('Login successful:', user);
          updateUIState(true);
        }).catch(error => {
          console.error('Error signing in:', error);
        });
      }
    });
  });

  // Logout
  logoutButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({action: "logout"}, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error during logout:', chrome.runtime.lastError);
      } else if (response && response.success) {
        console.log('Logout successful');
        userInfo = null;
        updateUIState(false);
      } else {
        console.error("Logout failed:", response ? response.error : "Unknown error");
      }
    });
  });

  // Save note
  saveNote.addEventListener('click', async () => {
    console.log('Save note clicked');
    const content = noteContent.value.trim();
    if (content && userInfo) {
      try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        const note = {
          content: content,
          url: tab.url,
          title: tab.title,
          userEmail: userInfo.email,
          timestamp: new Date().toISOString()
        };
        
        // Save note to Firestore
        const docRef = await addDoc(collection(db, "notes"), note);
        console.log("Note saved with ID: ", docRef.id);
        
        // Save note to chrome.storage
        await saveNoteToStorage(note, tab.id);
        
        noteContent.value = '';
        alert('Note saved successfully!');
      } catch (error) {
        console.error("Error saving note: ", error);
        alert('Error saving note. Please try again.');
      }
    } else {
      alert('Please enter a note and ensure you are logged in.');
    }
  });

  async function saveNoteToStorage(note, tabId) {
    // Get existing notes for this URL
    const result = await chrome.storage.local.get(note.url);
    let urlData = result[note.url] || { html: '', notes: [] };
    
    // If we haven't saved the HTML for this URL yet, get it now
    if (!urlData.html) {
      urlData.html = await getPageHTML(tabId);
    }
    
    // Add the new note
    urlData.notes.push(note);
    
    // Save back to storage
    await chrome.storage.local.set({ [note.url]: urlData });
  }

  function getPageHTML(tabId) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, {action: "getHTML"}, function(response) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response.html);
        }
      });
    });
  }
});