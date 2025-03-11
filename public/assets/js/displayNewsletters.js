document.addEventListener("DOMContentLoaded", () => {
    // Initialize Firebase
    const app = firebase.app();
    const db = firebase.firestore();
    const auth = firebase.auth();

    // DOM Elements
    const authSection = document.getElementById("auth-section");
    const googleSignInButton = document.getElementById("google-signin");
    const newslettersContainer = document.getElementById("newsletters-container");

    // Handle Google Sign-In
    googleSignInButton.addEventListener("click", () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .then((result) => {
                console.log("Signed in as:", result.user.email);
                // Redirect to adminNewsletter.html after successful sign-in
                window.location.href = "adminNewsletter.html";
            })
            .catch((error) => {
                console.error("Sign-in error:", error);
                alert("Sign-in failed. Please try again.");
            });
    });

    // Load newsletters from Firestore and display them
    function loadNewsletters() {
        newslettersContainer.innerHTML = ""; // Clear existing content

        db.collection("newsletters")
            .orderBy("timestamp", "desc")
            .get()
            .then((querySnapshot) => {
                if (querySnapshot.empty) {
                    newslettersContainer.innerHTML = "<p>No newsletters found.</p>";
                } else {
                    querySnapshot.forEach((doc) => {
                        const newsletter = doc.data();
                        const newsletterHtml = `
                            <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="150">
                                <div class="newsletter-item">
                                    <div class="newsletter-preview">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/PDF_file_icon.svg/1200px-PDF_file_icon.svg.png" alt="PDF Icon">
                                    </div>
                                    <h5 class="mt-3 mb-2">${newsletter.name}</h5>
                                    <a href="${newsletter.url}" target="_blank" class="btn btn-primary">Download</a>
                                </div>
                            </div>
                        `;
                        newslettersContainer.insertAdjacentHTML("beforeend", newsletterHtml);
                    });
                }
            })
            .catch((error) => {
                console.error("Error loading newsletters:", error);
                newslettersContainer.innerHTML = "<p>Error loading newsletters.</p>";
            });
    }

    // Load newsletters when the page loads
    loadNewsletters();
});
