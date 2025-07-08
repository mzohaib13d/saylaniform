import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js"
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js"
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzMbAvFTsZ580p_TIRQoc-8sSKR9wZDS8",
  authDomain: "saylanistudent01.firebaseapp.com",
  databaseURL: "https://saylanistudent01-default-rtdb.firebaseio.com",
  projectId: "saylanistudent01",
  storageBucket: "saylanistudent01.firebasestorage.app",
  messagingSenderId: "564963033490",
  appId: "1:564963033490:web:bc3a355da6a3c170bf014b",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

// Global variables
let compressedFileGlobal = null

// DOM elements
const uploadArea = document.getElementById("upload-area")
const fileInput = document.getElementById("file-upload")
const registrationForm = document.getElementById("registration-form")
const submitBtn = document.getElementById("submit-btn")
const submitText = document.getElementById("submit-text")
const submitSpinner = document.getElementById("submit-spinner")
const loadingOverlay = document.getElementById("loading-overlay")
const messageContainer = document.getElementById("message-container")
const messageContent = document.getElementById("message-content")
const messageText = document.getElementById("message-text")
const closeMessage = document.getElementById("close-message")

// Utility functions
function showMessage(message, type = "success") {
  messageText.textContent = message
  messageContent.className = `message-content ${type}`
  messageContainer.style.display = "block"

  // Auto hide after 5 seconds
  setTimeout(() => {
    hideMessage()
  }, 5000)
}

function hideMessage() {
  messageContainer.style.display = "none"
}

function showLoading() {
  loadingOverlay.style.display = "flex"
  submitBtn.disabled = true
  submitText.style.display = "none"
  submitSpinner.style.display = "inline-block"
}

function hideLoading() {
  loadingOverlay.style.display = "none"
  submitBtn.disabled = false
  submitText.style.display = "inline-block"
  submitSpinner.style.display = "none"
}

function generateRandomPassword() {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
}

function getFileExtension(filename) {
  return filename.split(".").pop().toLowerCase()
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

  // Validate CNIC format (basic validation)
  const cnic = formData.get("cnic")
  if (cnic && cnic.length < 13) {
    throw new Error("Please enter a valid CNIC number")
  }

// Form submission handler
registrationForm.addEventListener("submit", async (e) => {
  e.preventDefault()

  const formData = new FormData(e.target)

  try {
    // Show loading
    showLoading()

    // Validate form
    validateForm(formData)

    const email = formData.get("email")
    const file = compressedFileGlobal || fileInput.files[0]

    // Generate random password for Firebase Auth
    const password = generateRandomPassword()

    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Upload image to Firebase Storage
    const fileName = `profile_${Date.now()}.${getFileExtension(file.name)}`
    const fileRef = ref(storage, `students/${user.uid}/${fileName}`)
    await uploadBytes(fileRef, file)
    const photoURL = await getDownloadURL(fileRef)

    // Prepare student data
    const studentData = {
      // Personal Information
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

      // System fields
      photoURL,
      uid: user.uid,
      password: password, // Store generated password
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "pending", // Can be: pending, approved, rejected
    }

    // Save to Firestore
    await setDoc(doc(db, "students", user.uid), studentData)

    // Also add to a general registrations collection for admin purposes
    await addDoc(collection(db, "registrations"), {
      ...studentData,
      registrationId: user.uid,
    })

    // Success
    hideLoading()
    showMessage("🎉 Registration successful! Your application has been submitted.", "success")

    // Reset form
    registrationForm.reset()
    uploadArea.innerHTML = `
      <div class="upload-icon">
        <svg viewBox="0 0 24 24" width="48" height="48">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
        <span>+ Upload</span>
      </div>
    `
    uploadArea.classList.remove("has-image")
    compressedFileGlobal = null
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
})

// Close message handler
closeMessage.addEventListener("click", hideMessage)

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  console.log("Firebase Registration Form initialized")

  // Add some basic form validation styling
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
