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
  const newsletterDropdown = document.getElementById("newsletter-dropdown");
  const deleteButton = document.getElementById("delete-newsletter-button");
  const deleteMessage = document.getElementById("delete-message");
  const leaveButton = document.getElementById("leave-button");

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

  // Handle Newsletter Upload
  uploadForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const file = newsletterFileInput.files[0];
    const newsletterLink = document.getElementById("newsletter-link").value.trim();
    const newsletterNameInput = document.getElementById("newsletter-name").value.trim();

    if (!file && !newsletterLink) {
      console.log("No file or link provided.");
      uploadMessage.textContent = "Please provide a file or a link.";
      uploadMessage.style.color = "red";
      return;
    }

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
          populateNewsletterDropdown(); // Refresh dropdown list
        })
        .catch((error) => {
          console.error("Error during upload process:", error);
          uploadMessage.textContent = "An error occurred. Please try again.";
          uploadMessage.style.color = "red";
        });
    } else if (newsletterLink) {
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
        document.getElementById("newsletter-link").value = "";
        document.getElementById("newsletter-name").value = "";
        populateNewsletterDropdown(); // Refresh dropdown list
      })
      .catch((error) => {
        console.error("Error saving newsletter metadata:", error);
        uploadMessage.textContent = "An error occurred. Please try again.";
        uploadMessage.style.color = "red";
      });
    }
  });

  // Populate the dropdown with newsletters from Firestore
  function populateNewsletterDropdown() {
    console.log("Populating newsletter dropdown...");
    newsletterDropdown.innerHTML = ""; // Clear existing options
    db.collection("newsletters")
      .orderBy("timestamp", "desc")
      .get()
      .then((querySnapshot) => {
        if (querySnapshot.empty) {
          console.log("No newsletters found.");
          const option = document.createElement("option");
          option.text = "No newsletters available";
          option.value = "";
          newsletterDropdown.add(option);
        } else {
          querySnapshot.forEach((doc) => {
            const newsletter = doc.data();
            const option = document.createElement("option");
            option.value = doc.id;
            option.text = newsletter.name;
            // Store the newsletter URL in a data attribute
            option.setAttribute("data-url", newsletter.url);
            newsletterDropdown.add(option);
          });
        }
      })
      .catch((error) => {
        console.error("Error loading newsletters for dropdown:", error);
        deleteMessage.textContent = "Error loading newsletters. Please try again.";
        deleteMessage.style.color = "red";
      });
  }

  // Handle deletion of selected newsletter
  deleteButton.addEventListener("click", () => {
    const selectedOption = newsletterDropdown.options[newsletterDropdown.selectedIndex];
    const newsletterId = selectedOption.value;
    const newsletterUrl = selectedOption.getAttribute("data-url");

    if (!newsletterId) {
      deleteMessage.textContent = "No newsletter selected.";
      deleteMessage.style.color = "red";
      return;
    }

    if (confirm("Are you sure you want to delete the selected newsletter?")) {
      // Delete from Firestore
      db.collection("newsletters")
        .doc(newsletterId)
        .delete()
        .then(() => {
          console.log("Newsletter deleted from Firestore:", newsletterId);
          // If the newsletter was uploaded as a file, delete it from Firebase Storage
          if (newsletterUrl.startsWith("https://firebasestorage.googleapis.com")) {
            const fileRef = storage.refFromURL(newsletterUrl);
            fileRef.delete()
              .then(() => {
                console.log("File deleted from Firebase Storage:", newsletterUrl);
                deleteMessage.textContent = "Newsletter deleted successfully!";
                deleteMessage.style.color = "green";
                populateNewsletterDropdown();
              })
              .catch((error) => {
                console.error("Error deleting file from Firebase Storage:", error);
                deleteMessage.textContent = "Error deleting file. Please try again.";
                deleteMessage.style.color = "red";
              });
          } else {
            deleteMessage.textContent = "Newsletter deleted successfully!";
            deleteMessage.style.color = "green";
            populateNewsletterDropdown();
          }
        })
        .catch((error) => {
          console.error("Error deleting newsletter from Firestore:", error);
          deleteMessage.textContent = "Error deleting newsletter. Please try again.";
          deleteMessage.style.color = "red";
        });
    }
  });

  // Initial load of the dropdown
  populateNewsletterDropdown();
});
