"use strict";

const notificationButton = document.getElementById("enableNotifications");
let swRegistration = null;
const TokenElem = document.getElementById("token");
const ErrElem = document.getElementById("err");

// Inizializza Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDZQOfx-TGAck6SgyRDSgDttd87-xUEPtc",
  authDomain: "prova-295a2.firebaseapp.com",
  projectId: "prova-295a2",
  storageBucket: "prova-295a2.appspot.com",
  messagingSenderId: "182916563214",
  appId: "1:182916563214:web:819d30fa86573a36e1575f"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

initializeApp();

function initializeApp() {
  if ("serviceWorker" in navigator && "PushManager" in window) {
    console.log("Service Worker and Push are supported");
    initializeUi();
    initializeFCM();

    // Registra il Service Worker
    navigator.serviceWorker
      .register("/prova/firebase-messaging-sw.js")
      .then(swReg => {
        console.log("Service Worker is registered", swReg);
        swRegistration = swReg;
      })
      .catch(error => {
        console.error("Service Worker Error", error);
        ErrElem.innerHTML = "Service Worker Error: " + error.message;
      });
  } else {
    console.warn("Push messaging is not supported");
    notificationButton.textContent = "Push Not Supported";
  }
}

function initializeUi() {
  notificationButton.addEventListener("click", () => {
    displayNotification();
  });
}

function initializeFCM() {
  messaging
    .requestPermission()
    .then(() => {
      console.log("Notification permission granted.");
      return messaging.getToken();
    })
    .then(token => {
      TokenElem.innerHTML = "Token is: " + token;
    })
    .catch(err => {
      ErrElem.innerHTML += "Error getting permission to notify: " + err.message;
      console.log("Unable to get permission to notify.", err);
    });
}

function displayNotification() {
  if (Notification.permission === "granted") {
    notification();
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        notification();
      } else {
        alert("You denied or dismissed permissions to notifications.");
      }
    });
  } else {
    alert(
      "You denied permissions to notifications. Please update your browser or phone settings to allow notifications."
    );
  }
}

function notification() {
  const options = {
    body: "Testing Our Notification",
    icon: "./bell.png",
    badge: "./bell.png" // Opzionale, può aiutare a visualizzare l'icona su dispositivi mobili
  };
  
  if (swRegistration) {
    swRegistration.showNotification("PWA Notification!", options).catch(err => {
      console.error("Notification display error:", err);
      ErrElem.innerHTML += "Notification display error: " + err.message;
    });
  } else {
    console.error("Service Worker registration not found.");
    ErrElem.innerHTML += "Service Worker registration not found.";
  }
}
