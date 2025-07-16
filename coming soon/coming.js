document.addEventListener("DOMContentLoaded", () => {
  const targetDate = new Date("2025-07-20T00:00:00").getTime();

  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");

  const flipCard = document.getElementById("flip-card");
  const flipFront = document.getElementById("flip-front");

  let lastSeconds = null;

  function updateCountdown() {
    const now = Date.now();
    const diff = targetDate - now;

    if (diff <= 0) {
      daysEl.textContent = hoursEl.textContent = minutesEl.textContent = "00";
      flipFront.textContent = "00";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const secondsStr = String(seconds).padStart(2, "0");

    daysEl.textContent = String(days).padStart(2, "0");
    hoursEl.textContent = String(hours).padStart(2, "0");
    minutesEl.textContent = String(minutes).padStart(2, "0");

    if (secondsStr !== lastSeconds) {
      flipCard.classList.add("flip");

      setTimeout(() => {
        flipFront.textContent = secondsStr;
      }, 300); // in der Mitte der Flip-Animation

      setTimeout(() => {
        flipCard.classList.remove("flip");
      }, 600);

      lastSeconds = secondsStr;
    }
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
});
