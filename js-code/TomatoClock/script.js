
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  const timerDisplay = document.getElementById('timer');
  const statusDisplay = document.getElementById('status');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const workTimeInput = document.getElementById('workTime');
  const breakTimeInput = document.getElementById('breakTime');

  let workTime = 25 * 60; // 25 minutes in seconds
  let breakTime = 5 * 60; // 5 minutes in seconds
  let timeLeft = workTime;
  let timerInterval;
  let isRunning = false;
  let isWorkTime = true;

  function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    statusDisplay.textContent = isWorkTime ? '工作' : '休息';
  }

  function startTimer() {
    if (!isRunning) {
      isRunning = true;
      startBtn.disabled = true;
      pauseBtn.disabled = false;
      timerInterval = setInterval(() => {
        timeLeft--;
        updateDisplay();
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          isWorkTime = !isWorkTime;
          timeLeft = isWorkTime ? workTime : breakTime;
          startTimer();
        }
      }, 1000);
    }
  }

  function pauseTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }

  function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    isWorkTime = true;
    timeLeft = workTime;
    updateDisplay();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }

  function openSettings() {
    settingsModal.style.display = 'flex';
  }

  function closeSettings() {
    settingsModal.style.display = 'none';
  }

  function saveSettings() {
    workTime = parseInt(workTimeInput.value) * 60;
    breakTime = parseInt(breakTimeInput.value) * 60;
    resetTimer();
    closeSettings();
  }

  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  resetBtn.addEventListener('click', resetTimer);
  settingsBtn.addEventListener('click', openSettings);
  saveSettingsBtn.addEventListener('click', saveSettings);
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeSettings();
  });

  updateDisplay();
});

// PWA Support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(
      (registration) => {
        console.log('ServiceWorker registration successful');
      },
      (err) => {
        console.log('ServiceWorker registration failed: ', err);
      }
    );
  });
}
