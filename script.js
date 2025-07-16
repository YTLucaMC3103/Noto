function login() {
    const button = document.getElementById('login-btn')

    window.location.href = '/login/login.html'
}

function sendMail() {
  const mailtoURL = `mailto:noto.romano.reese@gmail.com`;
  window.location.href = mailtoURL;
}

function socials(platform) {
    const urls = {
        youtube: "https://youtube.com/@notobyromano?si=0uvjrTyIlHDPwFjj",
        instagram: "https://www.instagram.com/noto.romano.reese/",
        x: "https://x.com/noto_romano"
    };

  const url = urls[platform.toLowerCase()];
  if (url) {
    window.open(url, '_blank');
  } else {
    console.warn("Unbekannte Plattform:", platform);
  }
}

  document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.nav-left a');
    const currentPath = window.location.pathname;

    links.forEach(link => {
      if (link.getAttribute('href') === currentPath.split('/').pop()) {
        link.classList.add('active');
      }
    });
  });

function toggleDropdown() {
  const menu = document.getElementById("dropdown-menu");
  const icon = document.getElementById("dropdown-icon");

  menu.classList.toggle("open");
  icon.classList.toggle("rotated");
}

// IntersectionObserver einmal initialisieren
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        if (id) {
          history.replaceState(null, null, `#${id}`);
        }
      }
    });
  },
  {
    threshold: 0.5
  }
);

// Alle Sections einmal beobachten
document.querySelectorAll("section").forEach(section => {
  observer.observe(section);
});

// Scroll-Effekt: Slide die white-box nach oben, wenn zweite Section sichtbar
document.addEventListener('scroll', () => {
  const whiteBox = document.querySelector('.white-box');
  const secondSection = document.querySelector('.second-section');
  if (!whiteBox || !secondSection) return;

  const sectionTop = secondSection.getBoundingClientRect().top;

  if (sectionTop <= window.innerHeight * 0.5) {
    whiteBox.style.transform = 'translateY(-100vh)';
  } else {
    whiteBox.style.transform = 'translateY(0)';
  }
});

window.addEventListener("load", () => {
  const hash = window.location.hash;
  if (hash) {
    const section = document.querySelector(hash);
    if (section) {
      section.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }
});

function navigate(location) {
  window.location.href = `${location}.html`
}