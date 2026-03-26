import {
  getDescriptorFromImage,
  loadFaceModels,
  markAttendance,
  matchFace
} from "./face-utils.js";

let stream = null;
let matchIntervalId = null;
let sessionTimeoutId = null;
let isMatching = false;

const MATCH_INTERVAL_MS = 800;
const MATCH_TIMEOUT_MS = 10000;

function byId(id) {
  return document.getElementById(id);
}

function setStatus(message, type = "info") {
  const statusEl = byId("attendanceStatus");
  if (!statusEl) {
    return;
  }
  statusEl.textContent = message;
  statusEl.dataset.type = type;
}

async function startWebcam(videoEl) {
  if (!videoEl) {
    throw new Error("Missing attendance video element.");
  }

  stopWebcam();

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });

    videoEl.srcObject = stream;
    await videoEl.play();
  } catch (error) {
    throw new Error(`Unable to start webcam. ${error.message}`);
  }
}

function stopWebcam() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
}

function stopMatchingTimers() {
  if (matchIntervalId) {
    clearInterval(matchIntervalId);
    matchIntervalId = null;
  }
  if (sessionTimeoutId) {
    clearTimeout(sessionTimeoutId);
    sessionTimeoutId = null;
  }
  isMatching = false;
}

function frameToImage(videoEl, canvasEl) {
  return new Promise((resolve, reject) => {
    if (!videoEl || !canvasEl) {
      reject(new Error("Video and canvas are required."));
      return;
    }

    const width = videoEl.videoWidth;
    const height = videoEl.videoHeight;

    if (!width || !height) {
      reject(new Error("Webcam not ready. Please wait and retry."));
      return;
    }

    canvasEl.width = width;
    canvasEl.height = height;

    const context = canvasEl.getContext("2d");
    if (!context) {
      reject(new Error("Cannot access canvas context."));
      return;
    }

    context.filter = "brightness(1.15) contrast(1.1)";
    context.drawImage(videoEl, 0, 0, width, height);
    context.filter = "none";

    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to read captured frame."));
    image.src = canvasEl.toDataURL("image/jpeg", 0.95);
  });
}

function getSelectedSubject() {
  const selectEl = byId("subjectSelect");
  if (!selectEl) {
    throw new Error("Subject selector not found.");
  }

  const subject = String(selectEl.value || "").trim();
  if (!subject) {
    throw new Error("Please select a subject first.");
  }

  return subject;
}

async function runAttendanceMatch() {
  const videoEl = byId("attendanceVideo");
  const canvasEl = byId("attendanceCanvas");
  const retryBtn = byId("retryMatchBtn");
  const captureBtn = byId("captureAttendanceBtn");

  try {
    if (isMatching) {
      setStatus("Matching is already in progress. Please wait...", "warning");
      return;
    }

    const subject = getSelectedSubject();
    if (!videoEl?.srcObject) {
      await startWebcam(videoEl);
    }

    stopMatchingTimers();
    isMatching = true;
    if (retryBtn) {
      retryBtn.disabled = true;
    }
    if (captureBtn) {
      captureBtn.disabled = true;
    }

    setStatus("Live matching started. Keep your face visible...", "info");

    const finalize = (message, type, shouldStopWebcam = true) => {
      stopMatchingTimers();
      if (captureBtn) {
        captureBtn.disabled = false;
      }
      if (retryBtn) {
        retryBtn.disabled = false;
      }
      if (shouldStopWebcam) {
        stopWebcam();
      }
      setStatus(message, type);
    };

    sessionTimeoutId = setTimeout(() => {
      finalize("No match found within 10 seconds. Please retry with better lighting and pose.", "error", true);
    }, MATCH_TIMEOUT_MS);

    matchIntervalId = setInterval(async () => {
      try {
        const image = await frameToImage(videoEl, canvasEl);
        const descriptor = await getDescriptorFromImage(image);
        const result = matchFace(descriptor, 0.55);

        if (!result.matched || !result.student) {
          return;
        }

        const attendanceResult = markAttendance(result.student.id || result.student.rollNumber, subject, new Date());

        const displayName = result.student.name || result.student.rollNumber || "Student";

        if (attendanceResult.duplicate) {
          finalize(
            `${displayName} already marked for ${subject} today. Confidence: ${result.confidence}%.`,
            "warning",
            true
          );
          return;
        }

        finalize(
          `Attendance marked for ${displayName} (${subject}). Confidence: ${result.confidence}%.`,
          "success",
          true
        );
      } catch (error) {
        const message = error?.message || "Matching failed for this frame.";
        if (!message.includes("No face detected")) {
          setStatus(`${message} Retrying...`, "warning");
        }
      }
    }, MATCH_INTERVAL_MS);
  } catch (error) {
    stopMatchingTimers();
    if (captureBtn) {
      captureBtn.disabled = false;
    }
    setStatus(error.message || "Attendance failed. Try again.", "error");
    if (retryBtn) {
      retryBtn.disabled = false;
    }
    stopWebcam();
  }
}

async function startAttendanceSession() {
  const videoEl = byId("attendanceVideo");
  const retryBtn = byId("retryMatchBtn");

  try {
    stopMatchingTimers();
    getSelectedSubject();
    await startWebcam(videoEl);
    setStatus("Webcam ready. Click capture to start 10-second live matching.", "success");
    if (retryBtn) {
      retryBtn.disabled = false;
    }
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function init() {
  const startBtn = byId("startAttendanceBtn");
  const captureBtn = byId("captureAttendanceBtn");
  const retryBtn = byId("retryMatchBtn");

  if (!startBtn || !captureBtn) {
    console.warn(
      "Attendance UI elements missing. Expected IDs: startAttendanceBtn, captureAttendanceBtn, subjectSelect, attendanceVideo."
    );
    return;
  }

  try {
    setStatus("Loading face models...", "info");
    await loadFaceModels("/models");
    setStatus("Models loaded. Select subject and start webcam.", "success");
  } catch (error) {
    setStatus(error.message, "error");
    return;
  }

  startBtn.addEventListener("click", startAttendanceSession);
  captureBtn.addEventListener("click", runAttendanceMatch);

  if (retryBtn) {
    retryBtn.addEventListener("click", startAttendanceSession);
  }

  window.addEventListener("beforeunload", () => {
    stopMatchingTimers();
    stopWebcam();
  });
}

document.addEventListener("DOMContentLoaded", init);
