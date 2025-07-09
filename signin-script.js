import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js"
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js"
import {
  getFirestore,
  query,
  collection,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqOsWxq15-AAwy6pv-BnQnvSWpqIXvkW8",
  authDomain: "saylaniform3.firebaseapp.com",
  projectId: "saylaniform3",
  storageBucket: "saylaniform3.firebasestorage.app",
  messagingSenderId: "653600970827",
  appId: "1:653600970827:web:639a5ed39072a2345695ce",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// DOM elements - will be initialized after DOM loads
let signinForm,
  submitBtn,
  submitText,
  submitSpinner,
  loadingOverlay,
  messageContainer,
  messageContent,
  messageText,
  closeMessage,
  newRegistrationBtn

// Utility functions
function showMessage(message, type = "success") {
  if (messageText && messageContent && messageContainer) {
    messageText.textContent = message
    messageContent.className = `message-content ${type}`
    messageContainer.style.display = "block"

    setTimeout(() => {
      hideMessage()
    }, 5000)
  }
}

function hideMessage() {
  if (messageContainer) {
    messageContainer.style.display = "none"
  }
}

function showLoading() {
  if (loadingOverlay && submitBtn && submitText && submitSpinner) {
    loadingOverlay.style.display = "flex"
    submitBtn.disabled = true
    submitText.style.display = "none"
    submitSpinner.style.display = "inline-block"
  }
}

function hideLoading() {
  if (loadingOverlay && submitBtn && submitText && submitSpinner) {
    loadingOverlay.style.display = "none"
    submitBtn.disabled = false
    submitText.style.display = "inline-block"
    submitSpinner.style.display = "none"
  }
}

function validateForm(formData) {
  const email = formData.get("email")
  const cnic = formData.get("cnic")

  if (!email || !cnic) {
    throw new Error("Please fill in all required fields")
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error("Please enter a valid email address")
  }

  // Validate CNIC format (basic validation)
  if (cnic.length < 13) {
    throw new Error("Please enter a valid CNIC number")
  }
}

// Initialize DOM elements and event listeners after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("Firebase Sign In Form initialized")

  // Initialize DOM elements
  signinForm = document.getElementById("signin-form")
  submitBtn = document.getElementById("submit-btn")
  submitText = document.getElementById("submit-text")
  submitSpinner = document.getElementById("submit-spinner")
  loadingOverlay = document.getElementById("loading-overlay")
  messageContainer = document.getElementById("message-container")
  messageContent = document.getElementById("message-content")
  messageText = document.getElementById("message-text")
  closeMessage = document.getElementById("close-message")
  newRegistrationBtn = document.getElementById("new-registration-btn")

  // Check if elements exist before adding event listeners
  if (newRegistrationBtn) {
    newRegistrationBtn.addEventListener("click", () => {
      window.location.href = "rgstr_std.html"
    })
  }

  if (closeMessage) {
    closeMessage.addEventListener("click", hideMessage)
  }

  if (signinForm) {
    signinForm.addEventListener("submit", handleSignInSubmission)
  }

  // Form validation styling
  const inputs = document.querySelectorAll("input[required]")
  inputs.forEach((input) => {
    input.addEventListener("invalid", function () {
      this.style.borderColor = "#f44336"
    })

    input.addEventListener("input", function () {
      if (this.validity.valid) {
        this.style.borderColor = "#8DC63F"
      }
    })
  })
})

// Move form submission handler to a separate function
async function handleSignInSubmission(e) {
  e.preventDefault()

  const formData = new FormData(e.target)

  try {
    showLoading()
    validateForm(formData)

    const email = formData.get("email")
    const cnic = formData.get("cnic")

    // Query Firestore to find user by email and CNIC
    const studentsRef = collection(db, "students")
    const q = query(studentsRef, where("email", "==", email), where("cnic", "==", cnic))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      hideLoading()
      showMessage("No account found with this email and CNIC combination. Please register first.", "error")
      return
    }

    // Get the first matching document
    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()

    // Sign in with the stored password
    const userCredential = await signInWithEmailAndPassword(auth, email, userData.password)
    const user = userCredential.user

    hideLoading()
    showMessage(`Welcome back, ${userData.name}! Sign in successful.`, "success")

    // Store user data in sessionStorage for dashboard use
    sessionStorage.setItem("userData", JSON.stringify(userData))

    // Redirect to student portal after 2 seconds
    setTimeout(() => {
      window.location.href = "student-portal.html"
    }, 2000)
  } catch (error) {
    hideLoading()
    console.error("Sign in error:", error)

    let errorMessage = "Sign in failed. Please try again."

    if (error.code === "auth/user-not-found") {
      errorMessage = "No account found with this email and CNIC. Please register first."
    } else if (error.code === "auth/wrong-password") {
      errorMessage = "Invalid credentials. Please check your email and CNIC."
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Please enter a valid email address."
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many failed attempts. Please try again later."
    } else if (error.message) {
      errorMessage = error.message
    }

    showMessage(errorMessage, "error")
  }
}


document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase()
  if (e.ctrlKey && e.shiftKey && key === "i") e.preventDefault()
  if (key === "f12") e.preventDefault()
  if (e.ctrlKey && key === "u") e.preventDefault()
})

document.addEventListener("contextmenu", (e) => {
  e.preventDefault()
})
