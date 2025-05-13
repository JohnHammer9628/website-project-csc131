document.addEventListener("DOMContentLoaded", () => {
  console.log("📄 DOMContentLoaded fired.");

  // --- Firebase init ---
  let app, db, storage, auth;
  try {
    app     = firebase.app();
    db      = firebase.firestore();
    storage = firebase.storage();
    auth    = firebase.auth();
    console.log("🔧 Firebase initialized:", app.name);
  } catch(err) {
    console.error("❌ Firebase init failed:", err);
    return;
  }

  // --- DOM refs & sanity checks ---
  const uploadForm           = document.getElementById("upload-form");
  const newsletterFileInput  = document.getElementById("newsletter-file");
  const newsletterLinkInput  = document.getElementById("newsletter-link");
  const newsletterNameInput  = document.getElementById("newsletter-name");
  const uploadMessage        = document.getElementById("upload-message");
  const newsletterDropdown   = document.getElementById("newsletter-dropdown");
  const deleteButton         = document.getElementById("delete-newsletter-button");
  const deleteMessage        = document.getElementById("delete-message");
  const leaveButton          = document.getElementById("leave-button");

  console.log("📌 DOM elements:", {
    uploadForm,
    newsletterFileInput,
    newsletterLinkInput,
    newsletterNameInput,
    uploadMessage,
    newsletterDropdown,
    deleteButton,
    deleteMessage,
    leaveButton
  });

  if (!newsletterDropdown) {
    console.error("❌ #newsletter-dropdown not found—your delete‐list will never show!");
  }

  // --- Admin whitelist ---
  const ALLOWED_EMAILS = [
    "jcaycedo423@gmail.com",
    "admin2@yourdomain.com"
  ];
  console.log("🔒 ALLOWED_EMAILS:", ALLOWED_EMAILS);

  // --- Auth guard ---
  auth.onAuthStateChanged(async (user) => {
    console.log("🗝️ onAuthStateChanged:", user?.email || user);

    if (!user) {
      console.log("↪ no user → redirect");
      return window.location.href = "articles.html";
    }
    if (!ALLOWED_EMAILS.includes(user.email)) {
      console.warn("🚫 unauthorized:", user.email);
      alert("🚫 You’re not an admin.");
      try { await auth.signOut(); } catch(e){ console.error("signOut err",e); }
      return window.location.href = "articles.html";
    }

    console.log("✅ authorized:", user.email);
    initAdminPanel();
    await populateNewsletterDropdown();
  });

  // --- Wire up UI ---
  function initAdminPanel() {
    console.log("🛠️ initAdminPanel");

    // Leave
    if (leaveButton) {
      console.log("➤ binding leaveButton");
      leaveButton.addEventListener("click", async () => {
        console.log("🔓 leaveButton clicked");
        try {
          await auth.signOut();
          window.location.href = "articles.html";
        } catch(e) {
          console.error("signOut error:", e);
          if (uploadMessage) {
            uploadMessage.textContent = "Error signing out.";
            uploadMessage.style.color = "red";
          }
        }
      });
    } else {
      console.warn("⚠️ leaveButton missing");
    }

    // Upload
    if (uploadForm) {
      console.log("➤ binding uploadForm");
      uploadForm.addEventListener("submit", async e => {
        console.log("🚀 uploadForm.submit fired");
        e.preventDefault();
        if (!uploadMessage) return console.warn("⚠️ no uploadMessage elem");

        uploadMessage.textContent = "";
        uploadMessage.style.color = "";

        const file = newsletterFileInput?.files[0];
        const link = newsletterLinkInput?.value.trim();
        const name = newsletterNameInput?.value.trim() || (file?.name || link);

        console.log("📋 values:", { file, link, name });

        if (!file && !link) {
          console.warn("⚠️ nothing provided");
          uploadMessage.textContent = "Please provide a file or a link.";
          uploadMessage.style.color = "red";
          return;
        }

        try {
          let url;
          if (file) {
            console.log("⬆️ uploading file:", file.name);
            const ref  = storage.ref(`newsletters/${file.name}`);
            const snap = await ref.put(file);
            console.log("✔️ storage.put done", snap);
            url = await snap.ref.getDownloadURL();
            console.log("🔗 downloadURL:", url);
          } else {
            console.log("🔗 link upload:", link);
            url = link;
          }

          console.log("💾 writing Firestore doc");
          await db.collection("newsletters").add({
            name,
            url,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
          console.log("✔️ Firestore write complete");

          uploadMessage.textContent = "Uploaded successfully!";
          uploadMessage.style.color = "green";
          newsletterFileInput.value = "";
          newsletterLinkInput.value = "";
          newsletterNameInput.value = "";

          console.log("🔄 repopulate dropdown after upload");
          await populateNewsletterDropdown();
        } catch(err) {
          console.error("❌ upload error:", err);
          uploadMessage.textContent = "Upload failed, check console.";
          uploadMessage.style.color = "red";
        }
      });
    } else {
      console.warn("⚠️ uploadForm missing");
    }

    // Delete
    if (deleteButton) {
      console.log("➤ binding deleteButton");
      deleteButton.addEventListener("click", async () => {
        console.log("🗑️ deleteButton clicked");
        if (!deleteMessage) return console.warn("⚠️ no deleteMessage elem");
        deleteMessage.textContent = "";

        if (!newsletterDropdown) {
          console.warn("⚠️ no newsletterDropdown!");
          return;
        }

        const opt = newsletterDropdown.options[newsletterDropdown.selectedIndex];
        console.log("🎯 selected opt:", opt);
        const id  = opt?.value;
        const url = opt?.dataset.url;

        if (!id) {
          deleteMessage.textContent = "No newsletter selected.";
          deleteMessage.style.color = "red";
          return;
        }
        if (!confirm("Delete permanently?")) {
          console.log("⛔ user cancelled");
          return;
        }

        try {
          console.log("🗑️ deleting Firestore doc", id);
          await db.collection("newsletters").doc(id).delete();
          if (url?.startsWith("https://firebasestorage.googleapis.com")) {
            console.log("🗑️ deleting storage file", url);
            await storage.refFromURL(url).delete();
          }
          deleteMessage.textContent = "Deleted successfully!";
          deleteMessage.style.color = "green";
          console.log("🔄 repopulate dropdown after delete");
          await populateNewsletterDropdown();
        } catch(err) {
          console.error("❌ deletion error:", err);
          deleteMessage.textContent = "Deletion failed, check console.";
          deleteMessage.style.color = "red";
        }
      });
    } else {
      console.warn("⚠️ deleteButton missing");
    }
  }

  // --- Populate dropdown ---
  async function populateNewsletterDropdown() {
    console.log("📥 populateNewsletterDropdown start");
    if (!newsletterDropdown) {
      console.warn("⚠️ cannot populate, no dropdown");
      return;
    }
    newsletterDropdown.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value       = "";
    placeholder.textContent = "Loading newsletters…";
    placeholder.disabled    = true;
    placeholder.selected    = true;
    newsletterDropdown.appendChild(placeholder);

    try {
      const snap = await db
        .collection("newsletters")
        .orderBy("timestamp", "desc")
        .get();
      console.log(`✔️ snapshot received (${snap.size} docs)`);

      newsletterDropdown.innerHTML = "";
      if (snap.empty) {
        console.log("ℹ️ no newsletters found");
        const o = document.createElement("option");
        o.value       = "";
        o.textContent = "No newsletters available";
        o.disabled    = true;
        newsletterDropdown.appendChild(o);
        return;
      }

      snap.forEach(doc => {
        const data = doc.data();
        console.log("📄 doc:", doc.id, data);
        const o = document.createElement("option");
        o.value       = doc.id;
        o.textContent = data.name;
        o.dataset.url = data.url;
        newsletterDropdown.appendChild(o);
      });
      console.log("🔄 dropdown populated");
    } catch(err) {
      console.error("❌ populateNewsletterDropdown error:", err);
      deleteMessage.textContent = "Load failed; check console.";
      deleteMessage.style.color = "red";
    }
  }
});
