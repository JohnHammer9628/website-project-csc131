document.addEventListener("DOMContentLoaded", () => {
  // Initialize Firebase
  const app = firebase.app();
  const db = firebase.firestore();
  const storage = firebase.storage();
  const auth = firebase.auth();

  // DOM Elements
  const uploadForm = document.getElementById("upload-form");
  const newsletterFileInput = document.getElementById("newsletter-file");
  const uploadMessage = document.getElementById("upload-message");
  const newslettersContainer = document.getElementById("newsletters-container");
  const leaveButton = document.getElementById("leave-button");

  // Debug: Log Firebase initialization
  console.log("Firebase initialized:", app.name);

  // Check if the user is authenticated
  auth.onAuthStateChanged((user) => {
      if (!user) {
          console.log("User not authenticated. Redirecting to articles.html...");
          window.location.href = "articles.html";
      } else {
          console.log("User authenticated:", user.email);
      }
  });

  // Handle Leave Button (sign out)
  leaveButton.addEventListener("click", () => {
      auth.signOut()
          .then(() => {
              console.log("Signed out successfully. Redirecting to articles.html...");
              window.location.href = "articles.html";
          })
          .catch((error) => {
              console.error("Sign-out error:", error);
              uploadMessage.textContent = "Error signing out. Please try again.";
              uploadMessage.style.color = "red";
          });
  });

  uploadForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Get form input values
    const file = newsletterFileInput.files[0];
    const newsletterLink = document.getElementById("newsletter-link").value.trim();
    const newsletterNameInput = document.getElementById("newsletter-name").value.trim();

    // Require either a file or a link
    if (!file && !newsletterLink) {
      console.log("No file or link provided.");
      uploadMessage.textContent = "Please provide a file or a link.";
      uploadMessage.style.color = "red";
      return;
    }

    // If a file is selected, upload it to Firebase Storage
    if (file) {
      console.log("File selected:", file.name);
      const storageRef = storage.ref(`newsletters/${file.name}`);
      console.log("Uploading file to Firebase Storage...");

      storageRef.put(file)
        .then((snapshot) => {
          console.log("File uploaded successfully. Getting download URL...");
          return snapshot.ref.getDownloadURL();
        })
        .then((url) => {
          console.log("Download URL:", url);
          console.log("Saving newsletter metadata to Firestore...");
          return db.collection("newsletters").add({
            name: newsletterNameInput ? newsletterNameInput : file.name,
            url: url,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          });
        })
        .then(() => {
          console.log("Newsletter metadata saved to Firestore.");
          uploadMessage.textContent = "Newsletter uploaded successfully!";
          uploadMessage.style.color = "green";
          // Clear form fields
          newsletterFileInput.value = "";
          document.getElementById("newsletter-link").value = "";
          document.getElementById("newsletter-name").value = "";
          loadNewsletters(); // Refresh the newsletter list in the admin panel
        })
        .catch((error) => {
          console.error("Error during upload process:", error);
          uploadMessage.textContent = "An error occurred. Please try again.";
          uploadMessage.style.color = "red";
        });
    } else if (newsletterLink) {
      // If only a link is provided, save it directly to Firestore
      console.log("Using provided link:", newsletterLink);
      db.collection("newsletters").add({
        name: newsletterNameInput ? newsletterNameInput : newsletterLink,
        url: newsletterLink,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .then(() => {
        console.log("Newsletter metadata saved with link.");
        uploadMessage.textContent = "Newsletter linked successfully!";
        uploadMessage.style.color = "green";
        // Clear inputs
        document.getElementById("newsletter-link").value = "";
        document.getElementById("newsletter-name").value = "";
        loadNewsletters();
      })
      .catch((error) => {
        console.error("Error saving newsletter metadata:", error);
        uploadMessage.textContent = "An error occurred. Please try again.";
        uploadMessage.style.color = "red";
      });
    }
  });

  // Load and display newsletters in the admin panel
  function loadNewsletters() {
      console.log("Loading newsletters from Firestore...");
      newslettersContainer.innerHTML = ""; // Clear existing content

      db.collection("newsletters")
          .orderBy("timestamp", "desc")
          .get()
          .then((querySnapshot) => {
              if (querySnapshot.empty) {
                  console.log("No newsletters found in the collection.");
                  uploadMessage.textContent = "No newsletters found. Upload one to get started!";
                  uploadMessage.style.color = "blue";
              } else {
                  console.log("Newsletters fetched successfully:", querySnapshot.size);
                  querySnapshot.forEach((doc) => {
                      const newsletter = doc.data();
                      console.log("Newsletter data:", newsletter);
                      const newsletterHtml = `
                          <div class="newsletter-item">
                              <a href="${newsletter.url}" target="_blank">${newsletter.name}</a>
                          </div>
                      `;
                      newslettersContainer.insertAdjacentHTML("beforeend", newsletterHtml);
                  });
              }
          })
          .catch((error) => {
              console.error("Error loading newsletters:", error);
              uploadMessage.textContent = "Error loading newsletters. Please try again.";
              uploadMessage.style.color = "red";
          });
  }

  // Load newsletters when the admin panel page loads
  loadNewsletters();
});
