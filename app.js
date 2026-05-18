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

// ===================== FIREBASE =====================
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
let isGuest = false;

// ===================== LOGIN =====================
document.getElementById("googleBtn").onclick = () => {
  auth.signInWithPopup(provider);
};


// ===================== GUEST MODE =====================
document.getElementById("guestBtn").onclick = () => {

  isGuest = true;
  let isGuest = false;

  currentUser = {
    uid: "guest_user",
    displayName: "Guest User",
    photoURL:
      "https://cdn-icons-png.flaticon.com/512/149/149071.png"
  };

  loginBox.style.display = "none";
  app.style.display = "block";

  document.getElementById("userName").innerText =
    "Guest User 👋";

  document.getElementById("userPhoto").src =
    currentUser.photoURL;

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

    loginBox.style.display = "none";
    app.style.display = "block";

    document.getElementById("userName").innerText =
      user.displayName;

    document.getElementById("userPhoto").src =
      user.photoURL;

    loadPromises();
    startNotifications();
  }
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

  return Math.floor(
    (new Date() - new Date(date)) / 86400000
  );
}

// ===================== ADD PROMISE =====================
function addPromise() {

  const input = document.getElementById("promiseInput");
  const text = input.value.trim();

  if (!text) return;

  // =====================
  // GUEST STORAGE
  // =====================
  if (isGuest) {

    let guestData =
      JSON.parse(localStorage.getItem("guestPromises")) || [];

    guestData.push({
      text,
      streak: 0,
      lastCompletedDate: "",
      xp: 0,
      createdAt: Date.now()
    });

    localStorage.setItem(
      "guestPromises",
      JSON.stringify(guestData)
    );

    input.value = "";

    loadGuestPromises();
    return;
  }

  // =====================
  // FIREBASE STORAGE
  // =====================
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

// ===================== GUEST LOAD =====================
function loadGuestPromises() {

  list.innerHTML = "";

  let guestData =
    JSON.parse(localStorage.getItem("guestPromises")) || [];

  let total = 0;
  let doneToday = 0;
  let xpTotal = 0;
  let missed = 0;

  guestData.forEach((data, index) => {

    let streak = data.streak || 0;
    let last = data.lastCompletedDate || "";

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

          <button onclick="guestDone(${index})">
            ✅ Done
          </button>

          <button onclick="guestDelete(${index})">
            ❌ Delete
          </button>

        </div>

      </div>
    `;
  });

  let score =
    total === 0
      ? 0
      : Math.round((doneToday / total) * 100);

  let level = Math.floor(xpTotal / 100);

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
}

// ===================== GUEST DONE =====================
function guestDone(index) {

  let data =
    JSON.parse(localStorage.getItem("guestPromises")) || [];

  const today = getToday();

  if (data[index].lastCompletedDate === today) {
    alert("Already done today!");
    return;
  }

  let newStreak = 1;

  if (
    data[index].lastCompletedDate === getYesterday()
  ) {
    newStreak = data[index].streak + 1;
  }

  let xpGain = 10 + newStreak * 2;

  data[index].streak = newStreak;
  data[index].lastCompletedDate = today;
  data[index].xp += xpGain;

  localStorage.setItem(
    "guestPromises",
    JSON.stringify(data)
  );

  loadGuestPromises();
}

// ===================== GUEST DELETE =====================
function guestDelete(index) {

  let data =
    JSON.parse(localStorage.getItem("guestPromises")) || [];

  data.splice(index, 1);

  localStorage.setItem(
    "guestPromises",
    JSON.stringify(data)
  );

  loadGuestPromises();
    }
