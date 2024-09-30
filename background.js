import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { signOut, getAuth } from 'firebase/auth';

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
const db = getFirestore(app);
const auth = getAuth(app);

// Create context menu
chrome.runtime.onInstalled.addListener(() => {
    // Remove existing menu items to avoid duplicates
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: "saveNote",
            title: "Save as note",
            contexts: ["selection"]
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error creating context menu:', chrome.runtime.lastError);
            }
        });
    });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "saveNote") {
        chrome.identity.getAuthToken({ interactive: true }, async (token) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                return;
            }

            try {
                const userInfo = await getUserInfo(token);
                const note = {
                    content: info.selectionText,
                    url: tab.url,
                    title: tab.title,
                    userEmail: userInfo.email,
                    timestamp: new Date().toISOString()
                };

                const docRef = await addDoc(collection(db, "notes"), note);
                console.log("Note saved with ID: ", docRef.id);

                // Notify the user
                chrome.tabs.sendMessage(tab.id, { action: "noteSaved" });
            } catch (error) {
                console.error("Error saving note: ", error);
            }
        });
    }
});

// Add this to the existing listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "logout") {
        chrome.identity.getAuthToken({ interactive: false }, function(token) {
            if (token) {
                // Revoke the token
                fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
                    .then(() => chrome.identity.removeCachedAuthToken({ token: token }))
                    .then(() => {
                        console.log('Token revoked and removed from cache');
                        signOut(auth).then(() => {
                            sendResponse({success: true});
                        }).catch((error) => {
                            console.error("Error signing out:", error);
                            sendResponse({success: false, error: error.message});
                        });
                    });
            } else {
                sendResponse({success: true});
            }
        });
        return true; // Indicates that the response is asynchronous
    }
});

console.log('Background script loaded');

function getUserInfo(token) {
    return fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + token)
        .then(response => response.json());
}

function revokeToken(token) {
    if (token) {
        chrome.identity.removeCachedAuthToken({ token: token }, () => {
            console.log('Token revoked');
        });
    }
}

