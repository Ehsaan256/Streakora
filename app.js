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

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

// ===================== UI =====================
const loginBox = document.getElementById("loginBox");
const app = document.getElementById("app");
const list = document.getElementById("list");
const scoreCard = document.getElementById("scoreCard");

let currentUser = null;

// ===================== LOGIN =====================
document.getElementById("googleBtn").onclick = () => {
  auth.signInWithPopup(provider);
};

auth.onAuthStateChanged(user => {
  if (!user) {
    loginBox.style.display = "block";
    app.style.display = "none";
    return;
  }

  currentUser = user;

  loginBox.style.display = "none";
  app.style.display = "block";

  document.getElementById("userName").innerText = user.displayName;
  document.getElementById("userPhoto").src = user.photoURL;

  loadPromises();
  startNotifications();
});

// ===================== DATE HELPERS =====================
function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getYesterday() {
  let d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function daysDiff(date) {
  if (!date) return 999;
  return Math.floor((new Date() - new Date(date)) / 86400000);
}

// ===================== ADD PROMISE =====================
function addPromise() {

  const input = document.getElementById("promiseInput");
  const text = input.value.trim();

  if (!text) return;

  db.collection("users")
    .doc(currentUser.uid)
    .collection("promises")
    .add({
      text,
      streak: 0,
      lastCompletedDate: "",
      xp: 0,
      createdAt: Date.now()
    });

  input.value = "";
}

// ===================== LOAD =====================
function loadPromises() {

  db.collection("users")
    .doc(currentUser.uid)
    .collection("promises")
    .onSnapshot(snapshot => {

      list.innerHTML = "";

      let total = 0;
      let doneToday = 0;
      let xpTotal = 0;
      let missed = 0;

      snapshot.forEach(doc => {

        const data = doc.data();

        let streak = data.streak || 0;
        let last = data.lastCompletedDate || "";

        // 🔥 MISS CHECK
        if (daysDiff(last) > 1) {
          streak = 0;
        }

        if (last === getToday()) doneToday++;
        if (last !== getToday()) missed++;

        xpTotal += data.xp || 0;
        total++;

        list.innerHTML += `
          <div class="card">

            <h3>${data.text}</h3>

            <p>🔥 Streak: ${streak}</p>
            <p>⚡ XP: ${data.xp || 0}</p>

            <div class="actions">

              <button onclick="markDone('${doc.id}', ${data.streak || 0}, '${data.lastCompletedDate || ""}')">
                ✅ Done
              </button>

              <button onclick="deletePromise('${doc.id}')">
                ❌ Delete
              </button>

            </div>

          </div>
        `;
      });

      // =====================
      // 📊 SCORE SYSTEM
      // =====================
      let score = total === 0 ? 0 : Math.round((doneToday / total) * 100);
      let level = Math.floor(xpTotal / 100);

      // =====================
      // 🤖 AI COACH
      // =====================
      let ai = aiCoach(score, level);

      scoreCard.innerHTML = `
        <div class="card">
          <h3>⚡ Discipline Score</h3>
          <h1>${score}%</h1>
          <p>🏆 Level: ${level}</p>
          <p>🔥 XP: ${xpTotal}</p>
        </div>

        <div class="card">
          <h3>📊 Analytics</h3>
          <p>✅ Done Today: ${doneToday}</p>
          <p>❌ Pending: ${missed}</p>
        </div>

        <div class="card">
          <h3>🤖 AI Coach</h3>
          <p>${ai}</p>
        </div>
      `;

    });
}

// ===================== MARK DONE =====================
function markDone(id, streak, lastDate) {

  const today = getToday();

  if (lastDate === today) {
    alert("Already done today!");
    return;
  }

  let newStreak = 1;

  if (lastDate === getYesterday()) {
    newStreak = streak + 1;
  }

  let xpGain = 10 + newStreak * 2;

  db.collection("users")
    .doc(currentUser.uid)
    .collection("promises")
    .doc(id)
    .update({
      streak: newStreak,
      lastCompletedDate: today,
      xp: firebase.firestore.FieldValue.increment(xpGain)
    });
}

// ===================== DELETE =====================
function deletePromise(id) {
  db.collection("users")
    .doc(currentUser.uid)
    .collection("promises")
    .doc(id)
    .delete();
}

// ===================== AI COACH =====================
function aiCoach(score, level) {

  if (score < 40) return "⚠️ You're off track. Start small today.";

  if (level >= 10) return "🏆 Elite discipline. You are rare.";

  if (score > 80) return "🔥 Strong consistency. Keep momentum.";

  return "💡 Progress matters more than perfection.";
}

// ===================== NOTIFICATIONS (BASIC) =====================
function startNotifications() {

  setInterval(() => {
    alert("⏰ Streak reminder: Don’t break your chain today!");
  }, 1000 * 60 * 60 * 6); // every 6 hours
}

// ===================== LOGOUT =====================
function logout() {
  auth.signOut();
}
