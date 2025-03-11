document.addEventListener("DOMContentLoaded", () => {
    // Initialize Firebase (auto-configured by Firebase Hosting)
    const app = firebase.app();
    const db = firebase.firestore();

    // Get form and message elements
    const newsletterForm = document.getElementById("newsletterForm");
    const message = document.getElementById("message");

    // Handle form submission
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault(); // Prevent the form from refreshing the page

      const email = document.getElementById("email").value;

      // Reference to the specific document
      const docRef = db.collection("newsletter-emails").doc("7HUTzn0FBVopZWwY6I5b");

      // Update the document with the new email
      docRef
        .update({
          email: firebase.firestore.FieldValue.arrayUnion(email), // Add the email to an array field
          timestamp: firebase.firestore.FieldValue.serverTimestamp(), // Update the timestamp
        })
        .then(() => {
          message.textContent = "Thank you for subscribing!";
          message.style.color = "green";
          newsletterForm.reset(); // Clear the form
        })
        .catch((error) => {
          console.error("Error updating document: ", error);
          message.textContent = "An error occurred. Please try again.";
          message.style.color = "red";
        });
    });
});