// ===================== FIREBASE CONFIG =====================
const firebaseConfig = {
  apiKey: "AIzaSyBfIdUPxFknEKx_X0EWWXkkf5Q1w3EXn-Y",
  authDomain: "streakora-256.firebaseapp.com",
  projectId: "streakora-256",
  storageBucket: "streakora-256.firebasestorage.app",
  messagingSenderId: "418029337637",
  appId: "1:418029337637:web:f6526bbc4835ffad2793cc",
  measurementId: "G-5X19LQVYMM"
};

// ===================== FIREBASE INIT =====================
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

// ===================== UI REFS =====================
const loginBox = document.getElementById("loginBox");
const app = document.getElementById("app");
const list = document.getElementById("list");
const scoreCard = document.getElementById("scoreCard");

// ===================== STATE =====================
let currentUser = null;
let isGuest = false;
let notifInterval = null;

// Append toast element once
const toast = document.createElement("div");
toast.id = "toast";
document.body.appendChild(toast);

// ===================== TOAST =====================
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2800);
}

// ===================== LOGIN — GOOGLE =====================
document.getElementById("googleBtn").onclick = () => {
  auth.signInWithPopup(provider).catch(err => {
    showToast("Login failed: " + err.message);
  });
};

// ===================== LOGIN — GUEST =====================
document.getElementById("guestBtn").onclick = () => {
  isGuest = true;   // FIX: was mistakenly re-declared as false below this line

  currentUser = {
    uid: "guest_user",
    displayName: "Guest User",
    photoURL: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
  };

  loginBox.style.display = "none";
  app.style.display = "block";

  document.getElementById("userName").innerText = "Guest User 👋";
  document.getElementById("userPhoto").src = currentUser.photoURL;

  loadGuestPromises();
  startNotifications();
};

// ===================== AUTH STATE =====================
auth.onAuthStateChanged(user => {
  if (!user && !isGuest) {
    loginBox.style.display = "block";
    app.style.display = "none";
    return;
  }

  if (user) {
    currentUser = user;
    isGuest = false;

    loginBox.style.display = "none";
    app.style.display = "block";

    document.getElementById("userName").innerText = user.displayName;
    document.getElementById("userPhoto").src = user.photoURL;

    loadPromises();
    startNotifications();
  }
});

// ===================== LOGOUT =====================
function logout() {
  if (notifInterval) clearInterval(notifInterval);

  if (isGuest) {
    isGuest = false;
    currentUser = null;
    loginBox.style.display = "block";
    app.style.display = "none";
    list.innerHTML = "";
    scoreCard.innerHTML = "";
  } else {
    auth.signOut();
  }
}

// ===================== DATE HELPERS =====================
function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function daysDiff(date) {
  if (!date) return 999;
  return Math.floor((new Date() - new Date(date)) / 86400000);
}

// ===================== SAFE TEXT HELPER =====================
// Prevents XSS — never inject user text via innerHTML
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ===================== AI COACH =====================
function aiCoach(score, level, missed) {
  if (score === 100) return "🔥 Perfect day! You're unstoppable. Keep the streak alive!";
  if (score >= 75)   return "💪 Great work! Just a few more to go — finish strong today.";
  if (score >= 50)   return "⚡ Halfway there. Push through — consistency beats perfection.";
  if (score >= 25)   return "😤 Rough day? Even one promise kept builds the habit. Do one now.";
  if (missed > 0 && score === 0) return "🌑 Every master was once a beginner. Start with one promise right now.";
  if (level >= 10)   return "🏆 Level " + level + " legend! Your discipline is showing.";
  return "🤖 Show up today. Your future self is watching.";
}

// ===================== BUILD CARD ELEMENT (safe, no innerHTML) =====================
function buildCard({ text, streak, xp, doneToday, onDone, onDelete }) {
  const card = document.createElement("div");
  card.className = "card" + (doneToday ? " done-today" : "");

  if (doneToday) {
    const badge = document.createElement("span");
    badge.className = "done-badge";
    badge.textContent = "✅ Done Today";
    card.appendChild(badge);
  }

  const title = document.createElement("p");
  title.className = "promise-text";
  title.textContent = text;   // textContent — safe, no XSS
  card.appendChild(title);

  const streakP = document.createElement("p");
  streakP.textContent = "🔥 Streak: " + streak;
  card.appendChild(streakP);

  const xpP = document.createElement("p");
  xpP.textContent = "⚡ XP: " + xp;
  card.appendChild(xpP);

  const actions = document.createElement("div");
  actions.className = "actions";

  const doneBtn = document.createElement("button");
  doneBtn.className = "btn-done";
  doneBtn.textContent = doneToday ? "✅ Done" : "Mark Done";
  doneBtn.disabled = doneToday;
  doneBtn.onclick = onDone;
  actions.appendChild(doneBtn);

  const delBtn = document.createElement("button");
  delBtn.className = "btn-delete";
  delBtn.textContent = "🗑 Delete";
  delBtn.onclick = onDelete;
  actions.appendChild(delBtn);

  card.appendChild(actions);
  return card;
}

// ===================== RENDER SCORE CARD =====================
function renderScoreCard(total, doneToday, missed, xpTotal) {
  const score = total === 0 ? 0 : Math.round((doneToday / total) * 100);
  const level = Math.floor(xpTotal / 100);
  const ai = aiCoach(score, level, missed);

  scoreCard.innerHTML = "";

  // Score
  const s = document.createElement("div");
  s.className = "card";
  s.innerHTML =
    "<h3>⚡ Discipline Score</h3>" +
    "<h1>" + score + "%</h1>" +
    "<p>🏆 Level: " + level + "</p>" +
    "<p>🔥 XP: " + xpTotal + "</p>";
  scoreCard.appendChild(s);

  // Analytics
  const a = document.createElement("div");
  a.className = "card";
  a.innerHTML =
    "<h3>📊 Analytics</h3>" +
    "<p>✅ Done Today: " + doneToday + "</p>" +
    "<p>❌ Pending: " + missed + "</p>";
  scoreCard.appendChild(a);

  // AI Coach
  const c = document.createElement("div");
  c.className = "card ai-card";
  c.innerHTML = "<h3>🤖 AI Coach</h3><p>" + escapeHTML(ai) + "</p>";
  scoreCard.appendChild(c);
}

// ===================== GUEST — LOAD =====================
function loadGuestPromises() {
  list.innerHTML = "";

  let guestData = JSON.parse(localStorage.getItem("guestPromises")) || [];

  let total = 0, doneToday = 0, xpTotal = 0, missed = 0;
  const today = getToday();

  // FIX: reset broken streaks and SAVE them back
  let changed = false;
  guestData = guestData.map(item => {
    if (daysDiff(item.lastCompletedDate) > 1 && item.streak !== 0) {
      item.streak = 0;
      changed = true;
    }
    return item;
  });
  if (changed) {
    localStorage.setItem("guestPromises", JSON.stringify(guestData));
  }

  if (guestData.length === 0) {
    list.innerHTML = '<div class="empty-state"><span>🌱</span>No promises yet. Add your first one above!</div>';
  }

  guestData.forEach((data, index) => {
    const isDoneToday = data.lastCompletedDate === today;
    if (isDoneToday) doneToday++;
    else missed++;
    xpTotal += data.xp || 0;
    total++;

    const card = buildCard({
      text: data.text,
      streak: data.streak || 0,
      xp: data.xp || 0,
      doneToday: isDoneToday,
      onDone: () => guestDone(index),
      onDelete: () => guestDelete(index)
    });

    list.appendChild(card);
  });

  renderScoreCard(total, doneToday, missed, xpTotal);
}

// ===================== GUEST — DONE =====================
function guestDone(index) {
  let data = JSON.parse(localStorage.getItem("guestPromises")) || [];
  const today = getToday();

  if (data[index].lastCompletedDate === today) {
    showToast("Already marked done today!");
    return;
  }

  let newStreak = 1;
  if (data[index].lastCompletedDate === getYesterday()) {
    newStreak = (data[index].streak || 0) + 1;
  }

  const xpGain = 10 + newStreak * 2;

  data[index].streak = newStreak;
  data[index].lastCompletedDate = today;
  data[index].xp = (data[index].xp || 0) + xpGain;

  localStorage.setItem("guestPromises", JSON.stringify(data));
  showToast("✅ Done! +" + xpGain + " XP 🔥");
  loadGuestPromises();
}

// ===================== GUEST — DELETE =====================
function guestDelete(index) {
  let data = JSON.parse(localStorage.getItem("guestPromises")) || [];
  const name = data[index].text;
  data.splice(index, 1);
  localStorage.setItem("guestPromises", JSON.stringify(data));
  showToast("🗑 \"" + name.substring(0, 20) + "\" deleted");
  loadGuestPromises();
}

// ===================== ADD PROMISE =====================
function addPromise() {
  const input = document.getElementById("promiseInput");
  const text = input.value.trim();
  if (!text) return;

  if (isGuest) {
    let guestData = JSON.parse(localStorage.getItem("guestPromises")) || [];
    guestData.push({
      text,
      streak: 0,
      lastCompletedDate: "",
      xp: 0,
      createdAt: Date.now()
    });
    localStorage.setItem("guestPromises", JSON.stringify(guestData));
    input.value = "";
    loadGuestPromises();
    showToast("🌟 Promise added!");
    return;
  }

  // Firebase
  db.collection("users")
    .doc(currentUser.uid)
    .collection("promises")
    .add({
      text,
      streak: 0,
      lastCompletedDate: "",
      xp: 0,
      createdAt: Date.now()
    })
    .then(() => {
      showToast("🌟 Promise added!");
    })
    .catch(err => {
      showToast("Error: " + err.message);
    });

  input.value = "";
}

// ===================== FIREBASE — LOAD PROMISES =====================
function loadPromises() {
  list.innerHTML = '<div class="loading">Loading your promises...</div>';

  db.collection("users")
    .doc(currentUser.uid)
    .collection("promises")
    .orderBy("createdAt", "asc")
    .onSnapshot(snapshot => {
      list.innerHTML = "";
      scoreCard.innerHTML = "";

      const today = getToday();
      let total = 0, doneToday = 0, xpTotal = 0, missed = 0;

      if (snapshot.empty) {
        list.innerHTML = '<div class="empty-state"><span>🌱</span>No promises yet. Add your first one above!</div>';
        renderScoreCard(0, 0, 0, 0);
        return;
      }

      // FIX: check and reset broken streaks in Firestore
      snapshot.forEach(doc => {
        const data = doc.data();
        if (daysDiff(data.lastCompletedDate) > 1 && data.streak !== 0) {
          db.collection("users")
            .doc(currentUser.uid)
            .collection("promises")
            .doc(doc.id)
            .update({ streak: 0 });
        }
      });

      snapshot.forEach(doc => {
        const data = doc.data();
        const id = doc.id;
        const isDoneToday = data.lastCompletedDate === today;
        const streak = daysDiff(data.lastCompletedDate) > 1 ? 0 : (data.streak || 0);

        if (isDoneToday) doneToday++;
        else missed++;
        xpTotal += data.xp || 0;
        total++;

        const card = buildCard({
          text: data.text,
          streak,
          xp: data.xp || 0,
          doneToday: isDoneToday,
          onDone: () => firebaseDone(id, data),
          onDelete: () => firebaseDelete(id, data.text)
        });

        list.appendChild(card);
      });

      renderScoreCard(total, doneToday, missed, xpTotal);
    }, err => {
      list.innerHTML = '<div class="empty-state"><span>⚠️</span>Error loading data.</div>';
      console.error(err);
    });
}

// ===================== FIREBASE — DONE =====================
function firebaseDone(id, data) {
  const today = getToday();

  if (data.lastCompletedDate === today) {
    showToast("Already marked done today!");
    return;
  }

  let newStreak = 1;
  if (data.lastCompletedDate === getYesterday()) {
    newStreak = (data.streak || 0) + 1;
  }

  const xpGain = 10 + newStreak * 2;

  db.collection("users")
    .doc(currentUser.uid)
    .collection("promises")
    .doc(id)
    .update({
      streak: newStreak,
      lastCompletedDate: today,
      xp: (data.xp || 0) + xpGain
    })
    .then(() => {
      showToast("✅ Done! +" + xpGain + " XP 🔥");
    });
}

// ===================== FIREBASE — DELETE =====================
function firebaseDelete(id, text) {
  db.collection("users")
    .doc(currentUser.uid)
    .collection("promises")
    .doc(id)
    .delete()
    .then(() => {
      showToast("🗑 \"" + text.substring(0, 20) + "\" deleted");
    });
}

// ===================== NOTIFICATIONS =====================
function startNotifications() {
  if (notifInterval) clearInterval(notifInterval);

  if (!("Notification" in window)) return;

  Notification.requestPermission().then(permission => {
    if (permission !== "granted") return;

    // Check every hour if there are uncompleted promises
    notifInterval = setInterval(() => {
      const hour = new Date().getHours();
      if (hour < 8 || hour > 21) return; // Only notify 8am–9pm

      const today = getToday();
      let pending = 0;

      if (isGuest) {
        const data = JSON.parse(localStorage.getItem("guestPromises")) || [];
        pending = data.filter(p => p.lastCompletedDate !== today).length;
      }

      if (pending > 0) {
        new Notification("⚡ Streakora Reminder", {
          body: "You have " + pending + " promise(s) left to keep today. Don't break your streak!",
          icon: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
        });
      }
    }, 60 * 60 * 1000); // every 1 hour
  });
  }
  
