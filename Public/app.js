const form = document.querySelector("#form");
const imageInput = document.querySelector("#imageInput");
const preview = document.querySelector("#preview");
const uploadPrompt = document.querySelector("#uploadPrompt");
const dropzone = document.querySelector("#dropzone");
const generateButton = document.querySelector("#generate");
const statusCard = document.querySelector("#statusCard");
const statusTitle = document.querySelector("#statusTitle");
const statusText = document.querySelector("#statusText");
const spinner = document.querySelector("#spinner");
const resultCard = document.querySelector("#resultCard");
const resultVideo = document.querySelector("#resultVideo");
const downloadLink = document.querySelector("#downloadLink");

imageInput.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (!file) return;
  preview.src = URL.createObjectURL(file);
  preview.hidden = false;
  uploadPrompt.hidden = true;
});
dropzone.addEventListener("dragover", e => { e.preventDefault(); dropzone.style.borderColor = "#e7bd63"; });
dropzone.addEventListener("dragleave", () => { dropzone.style.borderColor = ""; });
dropzone.addEventListener("drop", e => {
  e.preventDefault();
  dropzone.style.borderColor = "";
  const file = e.dataTransfer.files?.[0];
  if (!file) return;
  const transfer = new DataTransfer();
  transfer.items.add(file);
  imageInput.files = transfer.files;
  imageInput.dispatchEvent(new Event("change"));
});

form.addEventListener("submit", async e => {
  e.preventDefault();
  if (!imageInput.files?.[0]) return showError("Choose an image first.");
  const data = new FormData(form);
  generateButton.disabled = true;
  statusCard.hidden = false;
  resultCard.hidden = true;
  spinner.hidden = false;
  statusTitle.textContent = "Generating your video…";
  statusText.textContent = "Magic Hour is processing the image. This can take a few minutes; keep this page open.";
  try {
    const response = await fetch("/api/generate", { method: "POST", body: data });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || "Could not generate video.");
    statusTitle.textContent = "Your video is ready";
    statusText.textContent = result.projectId ? `Project ID: ${result.projectId}` : "Generation completed successfully.";
    spinner.hidden = true;
    resultVideo.src = result.videoUrl;
    downloadLink.href = result.videoUrl;
    resultCard.hidden = false;
    resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    statusTitle.textContent = "Generation failed";
    statusText.textContent = error.message;
    spinner.hidden = true;
  } finally {
    generateButton.disabled = false;
  }
});
function showError(message) {
  statusCard.hidden = false;
  spinner.hidden = true;
  statusTitle.textContent = "Check your image";
  statusText.textContent = message;
                      }
