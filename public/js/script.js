document.addEventListener("DOMContentLoaded", function () {
  setupSearch();
  setupBackToTop();
  setupMobileMenu();
  loadVideos();
});

function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", filterVideos);
  }
}

function setupBackToTop() {
  const backToTop = document.getElementById("backToTop");
  if (backToTop) {
    window.addEventListener("scroll", function () {
      backToTop.style.display = window.scrollY > 300 ? "block" : "none";
    });
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}

function setupMobileMenu() {
  const menuToggle = document.querySelector(".menu-toggle");
  const leftnav = document.querySelector(".leftnav");
  const rightnav = document.querySelector(".rightnav");
  if (menuToggle && leftnav && rightnav) {
    menuToggle.addEventListener("click", function () {
      const isVisible = leftnav.style.display === "flex";
      leftnav.style.display = isVisible ? "none" : "flex";
      rightnav.style.display = isVisible ? "none" : "flex";
    });
  }
}

function loadVideos() {
  // Determine the container (videoGrid for index.html or videoList for others)
  const container = document.getElementById("videoGrid") || document.getElementById("videoList");
  if (!container) return;
  
  fetch('/videos')
    .then(response => response.json())
    .then(videos => {
      container.innerHTML = "";
      videos.forEach(video => {
        // Use different markup based on the container id
        if (container.id === "videoGrid") {
          const videoCard = document.createElement("div");
          videoCard.className = "video-container";
          videoCard.setAttribute("data-title", video.title.toLowerCase());
          videoCard.innerHTML = `
            <div class="video-thumbnail">
              <a href="#" onclick="playVideo('${video.id}', event)">
                <img src="${video.thumbnailUrl}" alt="${video.title}">
              </a>
            </div>
            <div class="video-details">
              <div class="video-title">${video.title}</div>
              <div class="video-author">Beardman</div>
            </div>
          `;
          container.appendChild(videoCard);
        } else {
          const videoCard = document.createElement("div");
          videoCard.className = "video";
          videoCard.innerHTML = `
            <div class="video-thumbnail" onclick="playVideo('${video.id}', event)">
              <img src="${video.thumbnailUrl}" alt="Thumbnail">
            </div>
            <p>${video.title}</p>
            <button onclick="deleteVideo('${video.id}')">Delete</button>
            <button onclick="likeVideo('${video.id}')">Like (<span id="like-${video.id}">${video.likes}</span>)</button>
          `;
          container.appendChild(videoCard);
        }
      });
    })
    .catch(err => console.error("Error loading videos:", err));
}

function playVideo(id, event) {
  event.preventDefault();
  fetch('/videos')
    .then(response => response.json())
    .then(videos => {
      const video = videos.find(v => v.id === id);
      if (video) {
        // For simplicity, open the video in a new tab
        window.open(video.videoUrl, "_blank");
      }
    })
    .catch(err => console.error("Error playing video:", err));
}

function deleteVideo(id) {
  if (confirm("Are you sure you want to delete this video?")) {
    fetch(`/videos/${id}`, { method: "DELETE" })
      .then(response => response.json())
      .then(data => {
        alert("Video deleted successfully!");
        loadVideos();
      })
      .catch(err => console.error("Error deleting video:", err));
  }
}

function likeVideo(id) {
  fetch(`/videos/${id}/like`, { method: "POST" })
    .then(response => response.json())
    .then(updatedVideo => {
      const likeSpan = document.getElementById(`like-${id}`);
      if (likeSpan) likeSpan.innerText = updatedVideo.likes;
    })
    .catch(err => console.error("Error liking video:", err));
}

function filterVideos() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const videoCards = document.querySelectorAll(".video-container");
  videoCards.forEach(card => {
    const title = card.getAttribute("data-title");
    card.style.display = title.includes(input) ? "block" : "none";
  });
}

function clearAllVideos() {
  // Fetch all videos and delete them one by one
  fetch('/videos')
    .then(response => response.json())
    .then(videos => {
      const deletePromises = videos.map(video =>
        fetch(`/videos/${video.id}`, { method: "DELETE" })
      );
      return Promise.all(deletePromises);
    })
    .then(() => {
      alert("All videos deleted.");
      loadVideos();
    })
    .catch(err => console.error("Error clearing videos:", err));
}

// Attach clear-all handler if the button exists
document.addEventListener("DOMContentLoaded", function() {
  const clearBtn = document.getElementById("clearAllBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", clearAllVideos);
  }
});
