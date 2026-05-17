// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBfIdUPxFknEKx_X0EWWXkkf5Q1w3EXn-Y",
  authDomain: "streakora-256.firebaseapp.com",
  projectId: "streakora-256",
  storageBucket: "streakora-256.firebasestorage.app",
  messagingSenderId: "418029337637",
  appId: "1:418029337637:web:f6526bbc4835ffad2793cc",
  measurementId: "G-5X19LQVYMM"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const list = document.getElementById("list");

// ➕ Add Promise
function addPromise() {
  const input = document.getElementById("promiseInput");
  const text = input.value.trim();

  if (!text) return;

  db.collection("promises").add({
    text: text,
    streak: 0,
    doneToday: false,
    createdAt: Date.now()
  });

  input.value = "";
}

// 📥 Load Data
db.collection("promises").onSnapshot(snapshot => {
  list.innerHTML = "";

  snapshot.forEach(doc => {
    const p = doc.data();

    list.innerHTML += `
      <div class="card">
        <div><b>${p.text}</b></div>
        <div>🔥 Streak: ${p.streak}</div>

        <div class="actions">
          <button class="small-btn" onclick="markDone('${doc.id}', ${p.streak}, ${p.doneToday})">
            Done
          </button>

          <button class="small-btn" onclick="deletePromise('${doc.id}')">
            Delete
          </button>
        </div>
      </div>
    `;
  });
});

// ✅ Mark Done
function markDone(id, streak, doneToday) {
  if (doneToday) return;

  db.collection("promises").doc(id).update({
    streak: streak + 1,
    doneToday: true
  });
}

// ❌ Delete
function deletePromise(id) {
  db.collection("promises").doc(id).delete();
}
