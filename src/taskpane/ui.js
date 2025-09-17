export function updateProgressBar(current, total, txt = "") {
    const percent = Math.round((current / total) * 100);
    document.getElementById("progressFill").style.width = percent + "%";
    document.getElementById("progressText").innerText = `${txt} [${percent}%]`;
}

export function showProgress(msg) {
  document.getElementById("progressText").innerText = msg;
  document.getElementById("progressBarContainer").style.display = "block";
}

export function showError(msg) {
  document.getElementById("errorContainer").innerText = msg;
}

export function clearError() {
  document.getElementById("errorContainer").innerText = "";
}
