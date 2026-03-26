import {
  getDescriptorFromImage,
  loadFaceModels,
  saveStudentDescriptor
} from "./face-utils.js";

const MAX_CAPTURES = 5;
const CAPTURE_GUIDES = [
  "Look straight",
  "Turn slightly left",
  "Turn slightly right",
  "Tilt up slightly",
  "Normal again"
];
let currentStream = null;
let capturedDescriptors = [];

function byId(id) {
  return document.getElementById(id);
}

function setStatus(message, type = "info") {
  const statusEl = byId("registerStatus");
  if (!statusEl) {
    return;
  }
  statusEl.textContent = message;
  statusEl.dataset.type = type;
}

function updateCaptureCount() {
  const countEl = byId("captureCount");
  if (!countEl) {
    return;
  }
  const nextGuide = CAPTURE_GUIDES[capturedDescriptors.length];
  countEl.textContent = `${capturedDescriptors.length}/${MAX_CAPTURES} captures${
    nextGuide ? ` • Next: ${nextGuide}` : ""
  }`;
}

function setSaveButtonState() {
  const saveBtn = byId("saveStudentBtn");
  if (!saveBtn) {
    return;
  }
  saveBtn.disabled = capturedDescriptors.length < MAX_CAPTURES;
}

async function startWebcam(videoEl) {
  if (!videoEl) {
    throw new Error("Missing video element for registration.");
  }

  stopWebcam();

  try {
    currentStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });
    videoEl.srcObject = currentStream;
    await videoEl.play();
  } catch (error) {
    throw new Error(`Unable to access webcam. ${error.message}`);
  }
}

function stopWebcam() {
  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
    currentStream = null;
  }
}

function frameToImage(videoEl, canvasEl) {
  return new Promise((resolve, reject) => {
    if (!videoEl || !canvasEl) {
      reject(new Error("Video/canvas elements are required."));
      return;
    }

    const width = videoEl.videoWidth;
    const height = videoEl.videoHeight;
    if (!width || !height) {
      reject(new Error("Webcam frame not ready. Please wait a moment and retry."));
      return;
    }

    canvasEl.width = width;
    canvasEl.height = height;

    const context = canvasEl.getContext("2d");
    if (!context) {
      reject(new Error("Unable to get canvas context."));
      return;
    }

    context.filter = "brightness(1.15) contrast(1.1)";
    context.drawImage(videoEl, 0, 0, width, height);
    context.filter = "none";
    const dataUrl = canvasEl.toDataURL("image/jpeg", 0.95);

    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to convert captured frame into image."));
    image.src = dataUrl;
  });
}

function getStudentPayload(formEl) {
  const formData = new FormData(formEl);
  const payload = {
    name: String(formData.get("name") || "").trim(),
    rollNumber: String(formData.get("rollNumber") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    department: String(formData.get("department") || "").trim()
  };

  if (!payload.name || !payload.rollNumber) {
    throw new Error("Name and Roll Number are required.");
  }

  return payload;
}

async function captureDescriptor() {
  const videoEl = byId("registerVideo");
  const canvasEl = byId("registerCanvas");

  if (capturedDescriptors.length >= MAX_CAPTURES) {
    setStatus("You already captured 5 photos. Save or reset to retry.", "warning");
    return;
  }

  try {
    const guideText = CAPTURE_GUIDES[capturedDescriptors.length] || "Hold still";
    setStatus(`Capture ${capturedDescriptors.length + 1}/${MAX_CAPTURES}: ${guideText}`, "info");

    const image = await frameToImage(videoEl, canvasEl);
    const descriptor = await getDescriptorFromImage(image);

    capturedDescriptors.push(Array.from(descriptor));
    updateCaptureCount();
    setSaveButtonState();

    const remaining = MAX_CAPTURES - capturedDescriptors.length;
    setStatus(
      remaining > 0
        ? `Capture successful. ${remaining} more capture(s) required.`
        : "All 5 captures completed. You can now save the student.",
      "success"
    );
  } catch (error) {
    setStatus(`${error.message} Retry capture.`, "error");
  }
}

function resetCaptures() {
  capturedDescriptors = [];
  updateCaptureCount();
  setSaveButtonState();
  setStatus("Captures reset. Please capture 5 guided photos again.", "info");
}

async function saveStudent(event) {
  event.preventDefault();

  const formEl = byId("studentForm");
  if (!formEl) {
    setStatus("Student form not found.", "error");
    return;
  }

  try {
    if (capturedDescriptors.length < MAX_CAPTURES) {
      throw new Error("Please capture exactly 5 photos before saving.");
    }

    const payload = getStudentPayload(formEl);
    const savedStudent = saveStudentDescriptor(payload, capturedDescriptors);

    setStatus(
      `Student saved: ${savedStudent.name} (${savedStudent.rollNumber}). Webcam stopped for privacy.`,
      "success"
    );

    stopWebcam();
    resetCaptures();
    formEl.reset();
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function init() {
  const formEl = byId("studentForm");
  const captureBtn = byId("captureBtn");
  const resetBtn = byId("retryCaptureBtn");
  const videoEl = byId("registerVideo");

  if (!formEl || !captureBtn || !videoEl) {
    console.warn("Registration UI elements missing. Expected IDs: studentForm, captureBtn, registerVideo.");
    return;
  }

  try {
    setStatus("Loading face models...", "info");
    await loadFaceModels("/models");
    await startWebcam(videoEl);
    updateCaptureCount();
    setSaveButtonState();
    setStatus("Models loaded. Capture 5 guided photos for registration.", "success");
  } catch (error) {
    setStatus(error.message, "error");
    return;
  }

  captureBtn.addEventListener("click", captureDescriptor);
  if (resetBtn) {
    resetBtn.addEventListener("click", resetCaptures);
  }
  formEl.addEventListener("submit", saveStudent);
  window.addEventListener("beforeunload", stopWebcam);
}

document.addEventListener("DOMContentLoaded", init);
