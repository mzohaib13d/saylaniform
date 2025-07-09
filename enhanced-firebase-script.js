import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js"
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js"
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
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
let registrationForm,
  submitBtn,
  submitText,
  submitSpinner,
  loadingOverlay,
  messageContainer,
  messageContent,
  messageText,
  closeMessage,
  signinBtn

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

function generateRandomPassword() {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
}

function validateForm(formData) {
  const requiredFields = [
    "country",
    "city",
    "course",
    "proficiency",
    "name",
    "father-name",
    "email",
    "phone",
    "cnic",
    "dob",
    "gender",
    "address",
    "qualification",
    "laptop",
  ]

  for (const field of requiredFields) {
    if (!formData.get(field)) {
      throw new Error(`${field.replace("-", " ")} is required`)
    }
  }

  // Validate email format
  const email = formData.get("email")
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error("Please enter a valid email address")
  }

  // Validate CNIC format
  const cnic = formData.get("cnic")
  if (cnic && cnic.length < 13) {
    throw new Error("Please enter a valid CNIC number")
  }
}

// Initialize DOM elements and event listeners after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("Firebase Registration Form initialized")

  // Initialize DOM elements
  registrationForm = document.getElementById("registration-form")
  submitBtn = document.getElementById("submit-btn")
  submitText = document.getElementById("submit-text")
  submitSpinner = document.getElementById("submit-spinner")
  loadingOverlay = document.getElementById("loading-overlay")
  messageContainer = document.getElementById("message-container")
  messageContent = document.getElementById("message-content")
  messageText = document.getElementById("message-text")
  closeMessage = document.getElementById("close-message")
  signinBtn = document.getElementById("signin-btn")

  // Check if elements exist before adding event listeners
  if (signinBtn) {
    signinBtn.addEventListener("click", () => {
      window.location.href = "index.html"
    })
  }

  if (closeMessage) {
    closeMessage.addEventListener("click", hideMessage)
  }

  if (registrationForm) {
    registrationForm.addEventListener("submit", handleFormSubmission)
  }

  // Form validation styling
  const inputs = document.querySelectorAll("input[required], select[required]")
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

// Form submission handler
async function handleFormSubmission(e) {
  e.preventDefault()

  const formData = new FormData(e.target)

  try {
    showLoading()
    validateForm(formData)

    const email = formData.get("email")
    const password = generateRandomPassword()

    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Prepare student data
    const studentData = {
      country: formData.get("country"),
      city: formData.get("city"),
      course: formData.get("course"),
      proficiency: formData.get("proficiency"),
      name: formData.get("name"),
      fatherName: formData.get("father-name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      cnic: formData.get("cnic"),
      fatherCnic: formData.get("father-cnic") || "",
      dob: formData.get("dob"),
      gender: formData.get("gender"),
      address: formData.get("address"),
      qualification: formData.get("qualification"),
      laptop: formData.get("laptop"),
      uid: user.uid,
      password: password,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "pending",
    }

    // Save to Firestore
    await setDoc(doc(db, "students", user.uid), studentData)
    await addDoc(collection(db, "registrations"), {
      ...studentData,
      registrationId: user.uid,
    })

    hideLoading()
    showMessage("🎉 Registration successful! Redirecting to sign-in page...", "success")
    if (registrationForm) {
      registrationForm.reset()
    }

    // Redirect to sign-in page after 2 seconds
    setTimeout(() => {
      window.location.href = "index.html"
    }, 2000)
  } catch (error) {
    hideLoading()
    console.error("Registration error:", error)

    let errorMessage = "Registration failed. Please try again."

    if (error.code === "auth/email-already-in-use") {
      errorMessage = "This email is already registered. Please use a different email."
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Please enter a valid email address."
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password is too weak. Please try again."
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
