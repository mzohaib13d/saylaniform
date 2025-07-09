import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js"
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js"
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

// DOM elements
let loginForm, loginSection, studentDetails, loadingOverlay, messageContainer, messageContent, messageText, closeMessage

// Utility functions
function showMessage(message, type = "success") {
  if (messageText && messageContent && messageContainer) {
    messageText.textContent = message
    messageContent.className = `message-content ${type}`
    messageContainer.style.display = "block"

    setTimeout(() => {
      hideMessage()
    }, 2000)
  }
}

function hideMessage() {
  if (messageContainer) {
    messageContainer.style.display = "none"
  }
}

function showLoading() {
  if (loadingOverlay) {
    loadingOverlay.style.display = "flex"
  }
}

function hideLoading() {
  if (loadingOverlay) {
    loadingOverlay.style.display = "none"
  }
}

function formatDate(dateString) {
  if (!dateString) return "-"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function displayStudentDetails(userData) {
  console.log("Displaying student details:", userData) // Debug log

  // Force hide login section and show details
  const loginSection = document.getElementById("login-section")
  const studentDetails = document.getElementById("student-details")

  if (loginSection) {
    loginSection.style.display = "none"
    console.log("Login section hidden")
  }

  if (studentDetails) {
    studentDetails.style.display = "block"
    console.log("Student details shown")
  } else {
    console.error("Student details element not found!")
  }

  // Update status badge
  const statusBadge = document.getElementById("status-badge")
  const statusText = document.getElementById("status-text")
  if (statusBadge && statusText) {
    const status = userData.status || "pending"
    statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1)

    statusBadge.className = "status-badge"
    if (status === "approved") statusBadge.classList.add("approved")
    else if (status === "rejected") statusBadge.classList.add("rejected")
  }

  // Update all fields with proper field mapping
  const fields = {
    "student-name": userData.name || userData.fullName,
    "father-name": userData.fatherName || userData["father-name"],
    dob: formatDate(userData.dob),
    gender: userData.gender,
    "student-cnic": userData.cnic,
    "student-email": userData.email,
    phone: userData.phone,
    address: userData.address,
    country: userData.country,
    city: userData.city,
    course: userData.course,
    proficiency: userData.proficiency,
    qualification: userData.qualification,
    laptop: userData.laptop === "yes" ? "Yes" : "No",
    "created-at": formatDate(userData.createdAt),
    "application-status":
      (userData.status || "Pending").charAt(0).toUpperCase() + (userData.status || "pending").slice(1),
    "student-id": userData.uid || "Not assigned",
  }

  Object.entries(fields).forEach(([id, value]) => {
    const element = document.getElementById(id)
    if (element) {
      element.textContent = value || "-"
      console.log(`Updated ${id}:`, value) // Debug log
    } else {
      console.warn(`Element with id '${id}' not found`) // Debug log
    }
  })

  // Scroll to details section
  if (studentDetails) {
    studentDetails.scrollIntoView({ behavior: "smooth" })
  }
}

// Handle form submission
async function handleLogin(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const email = formData.get("email")
  const cnic = formData.get("cnic")

  if (!email || !cnic) {
    showMessage("Please fill in all required fields", "error")
    return
  }

  try {
    showLoading()

    // Query Firestore to find user by email and CNIC
    const studentsRef = collection(db, "students")
    const q = query(studentsRef, where("email", "==", email), where("cnic", "==", cnic))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      hideLoading()
      showMessage("No registration found with this email and CNIC combination.", "error")
      return
    }

    // Get the first matching document
    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()

    hideLoading()
    showMessage(`Welcome back, ${userData.name}!`, "success")

    // Wait a moment for the message to show, then display details
    setTimeout(() => {
      console.log("About to display student details...")
      displayStudentDetails(userData)
    }, 500)
  } catch (error) {
    hideLoading()
    console.error("Login error:", error)
    showMessage("Error retrieving your information. Please try again.", "error")
  }
}

// Logout function
window.logout = () => {
  if (loginSection) loginSection.style.display = "block"
  if (studentDetails) studentDetails.style.display = "none"

  // Reset form
  if (loginForm) loginForm.reset()

  showMessage("Logged out successfully", "success")
}

// Initialize when DOM loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("Student Portal initialized")

  // Initialize DOM elements
  loginForm = document.getElementById("login-form")
  loginSection = document.getElementById("login-section")
  studentDetails = document.getElementById("student-details")
  loadingOverlay = document.getElementById("loading-overlay")
  messageContainer = document.getElementById("message-container")
  messageContent = document.getElementById("message-content")
  messageText = document.getElementById("message-text")
  closeMessage = document.getElementById("close-message")

  // Event listeners
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin)
  }

  if (closeMessage) {
    closeMessage.addEventListener("click", hideMessage)
  }

  // Form validation styling
  const inputs = document.querySelectorAll("input[required]")
  inputs.forEach((input) => {
    input.addEventListener("invalid", function () {
      this.style.borderColor = "#dc3545"
    })

    input.addEventListener("input", function () {
      if (this.validity.valid) {
        this.style.borderColor = "#28a745"
      }
    })
  })
})


document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase()
  if (e.ctrlKey && e.shiftKey && key === "i") e.preventDefault()
  if (key === "f12") e.preventDefault()
  if (e.ctrlKey && key === "u") e.preventDefault()
})

document.addEventListener("contextmenu", (e) => {
  e.preventDefault()
})
