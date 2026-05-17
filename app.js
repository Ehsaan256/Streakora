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

// INIT
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

const provider = new firebase.auth.GoogleAuthProvider();

const googleBtn = document.getElementById("googleBtn");

const loginBox = document.getElementById("loginBox");

const app = document.getElementById("app");

const list = document.getElementById("list");

const scoreCard = document.getElementById("scoreCard");

let currentUser = null;

// GOOGLE LOGIN
googleBtn.addEventListener("click", () => {

  auth.signInWithPopup(provider);

});

// AUTH STATE
auth.onAuthStateChanged(user => {

  if(user){

    currentUser = user;

    loginBox.style.display = "none";

    app.style.display = "block";

    document.getElementById("userName").innerText =
      user.displayName;

    document.getElementById("userPhoto").src =
      user.photoURL;

    loadPromises();

  }else{

    loginBox.style.display = "block";

    app.style.display = "none";

  }

});

// ADD PROMISE
function addPromise(){

  const input =
    document.getElementById("promiseInput");

  const text = input.value.trim();

  if(!text) return;

  db.collection("users")
    .doc(currentUser.uid)
    .collection("promises")
    .add({

      text:text,
      streak:0,
      completed:0,
      createdAt:Date.now()

    });

  input.value="";

}

// LOAD PROMISES
function loadPromises(){

  db.collection("users")
    .doc(currentUser.uid)
    .collection("promises")
    .onSnapshot(snapshot => {

      list.innerHTML = "";

      let total = 0;
      let completed = 0;

      snapshot.forEach(doc => {

        const data = doc.data();

        total++;

        completed += data.completed || 0;

        list.innerHTML += `
          <div class="card">

            <h3>${data.text}</h3>

            <p>🔥 Streak: ${data.streak}</p>

            <div class="actions">

              <button onclick="markDone(
                '${doc.id}',
                ${data.streak},
                ${data.completed || 0}
              )">

                ✅ Done

              </button>

              <button onclick="deletePromise(
                '${doc.id}'
              )">

                ❌ Delete

              </button>

            </div>

          </div>
        `;
      });

      // DISCIPLINE SCORE
      let score = total === 0
        ? 0
        : Math.round((completed / total));

      scoreCard.innerHTML = `
        <div class="card">
          <h3>⚡ Discipline Score</h3>
          <h1>${score}</h1>
        </div>
      `;

    });

}

// MARK DONE
function markDone(id, streak, lastDate) {

  const today = getToday();

  // already done today → stop
  if (lastDate === today) {
    alert("Already completed today!");
    return;
  }

  let newStreak = 1;

  // if user did it yesterday → continue streak
  if (lastDate === getYesterday()) {
    newStreak = streak + 1;
  }

  db.collection("users")
    .doc(currentUser.uid)
    .collection("promises")
    .doc(id)
    .update({
      streak: newStreak,
      lastCompletedDate: today
    });

}

// DELETE
function deletePromise(id){

  db.collection("users")
    .doc(currentUser.uid)
    .collection("promises")
    .doc(id)
    .delete();

}

// LOGOUT
function logout(){

  auth.signOut();

}
function getToday() {
  return new Date().toISOString().split("T")[0];
}
function getYesterday() {
  let d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}
