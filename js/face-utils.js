const STUDENTS_KEY = "fras_students";
const ATTENDANCE_KEY = "fras_attendance";

function assertFaceApiLoaded() {
  if (typeof window === "undefined" || !window.faceapi) {
    throw new Error("face-api.js is not loaded. Include it before running this script.");
  }
}

function toNumberArray(descriptor) {
  if (!descriptor) {
    throw new Error("Descriptor is required.");
  }

  if (Array.isArray(descriptor)) {
    return descriptor.map((value) => Number(value));
  }

  if (descriptor instanceof Float32Array) {
    return Array.from(descriptor);
  }

  throw new Error("Descriptor must be an Array or Float32Array.");
}

function toFloat32Descriptor(descriptor) {
  return new Float32Array(toNumberArray(descriptor));
}

function readJsonFromStorage(key, fallback = []) {
  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) {
      return fallback;
    }
    const parsed = JSON.parse(rawValue);
    return parsed ?? fallback;
  } catch (error) {
    console.error(`Failed to parse localStorage key: ${key}`, error);
    return fallback;
  }
}

function writeJsonToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    throw new Error(`Failed to save data in localStorage for key: ${key}. ${error.message}`);
  }
}

function normalizeDescriptorSet(input) {
  if (Array.isArray(input) && input.length && Array.isArray(input[0])) {
    return input.map(toNumberArray);
  }

  if (Array.isArray(input) && input.length === 128 && typeof input[0] === "number") {
    return [toNumberArray(input)];
  }

  return [];
}

function normalizeStudentsStore(rawStore) {
  if (rawStore && !Array.isArray(rawStore) && typeof rawStore === "object") {
    const normalized = {};
    Object.entries(rawStore).forEach(([rollNumber, value]) => {
      if (!value || typeof value !== "object") {
        return;
      }

      const descriptors = normalizeDescriptorSet(value.descriptors || value.descriptor);
      if (!descriptors.length) {
        return;
      }

      normalized[rollNumber] = {
        descriptors,
        registeredAt: value.registeredAt || value.updatedAt || new Date().toISOString(),
        id: value.id || rollNumber,
        name: value.name || rollNumber,
        rollNumber,
        email: value.email || "",
        department: value.department || ""
      };
    });
    return normalized;
  }

  if (Array.isArray(rawStore)) {
    const migrated = {};
    rawStore.forEach((student) => {
      if (!student || typeof student !== "object") {
        return;
      }

      const rollNumber = String(student.rollNumber || "").trim();
      if (!rollNumber) {
        return;
      }

      const descriptors = normalizeDescriptorSet(student.descriptors || student.descriptor);
      if (!descriptors.length) {
        return;
      }

      migrated[rollNumber] = {
        descriptors,
        registeredAt: student.registeredAt || student.updatedAt || new Date().toISOString(),
        id: student.id || rollNumber,
        name: student.name || rollNumber,
        rollNumber,
        email: student.email || "",
        department: student.department || ""
      };
    });
    return migrated;
  }

  return {};
}

function getStudentsStore() {
  const rawStore = readJsonFromStorage(STUDENTS_KEY, {});
  const normalized = normalizeStudentsStore(rawStore);

  const serializedRaw = JSON.stringify(rawStore || {});
  const serializedNormalized = JSON.stringify(normalized);
  if (serializedRaw !== serializedNormalized) {
    writeJsonToStorage(STUDENTS_KEY, normalized);
  }

  return normalized;
}

function getAttendanceRecords() {
  return readJsonFromStorage(ATTENDANCE_KEY, []);
}

function getEuclideanDistance(descriptorA, descriptorB) {
  if (!descriptorA || !descriptorB || descriptorA.length !== descriptorB.length) {
    throw new Error("Descriptors must be valid and have the same length.");
  }

  let sum = 0;
  for (let index = 0; index < descriptorA.length; index += 1) {
    const difference = descriptorA[index] - descriptorB[index];
    sum += difference * difference;
  }
  return Math.sqrt(sum);
}

export async function loadFaceModels(modelsPath = "/models") {
  try {
    assertFaceApiLoaded();
    const { faceapi } = window;

    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(modelsPath),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath),
      faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath)
    ]);
  } catch (error) {
    throw new Error(`Unable to load face models from ${modelsPath}. ${error.message}`);
  }
}

export async function getDescriptorFromImage(image) {
  try {
    assertFaceApiLoaded();

    if (!image) {
      throw new Error("Image input is required.");
    }

    const detection = await window.faceapi
      .detectSingleFace(image, new window.faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection?.descriptor) {
      throw new Error("No face detected. Keep your face centered and try again.");
    }

    return detection.descriptor;
  } catch (error) {
    throw new Error(`Failed to extract face descriptor. ${error.message}`);
  }
}

export function saveStudentDescriptor(student, descriptors) {
  try {
    if (!student || typeof student !== "object") {
      throw new Error("Valid student data is required.");
    }

    const requiredFields = ["name", "rollNumber"];
    requiredFields.forEach((field) => {
      if (!student[field] || String(student[field]).trim() === "") {
        throw new Error(`Student field '${field}' is required.`);
      }
    });

    if (!Array.isArray(descriptors) || descriptors.length !== 5) {
      throw new Error("Exactly 5 descriptors are required for registration.");
    }

    const normalizedDescriptors = descriptors.map(toNumberArray);

    const studentsStore = getStudentsStore();
    const normalizedRollNumber = String(student.rollNumber).trim();

    const existingRecord = studentsStore[normalizedRollNumber] || {};
    const record = {
      id: student.id || existingRecord.id || `S-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      name: String(student.name).trim(),
      rollNumber: normalizedRollNumber,
      email: student.email ? String(student.email).trim() : "",
      department: student.department ? String(student.department).trim() : "",
      descriptors: normalizedDescriptors,
      registeredAt: new Date().toISOString()
    };

    studentsStore[normalizedRollNumber] = record;
    writeJsonToStorage(STUDENTS_KEY, studentsStore);
    return record;
  } catch (error) {
    throw new Error(`Failed to save student descriptor. ${error.message}`);
  }
}

export function matchFace(liveDescriptor, threshold = 0.55) {
  try {
    assertFaceApiLoaded();

    const normalizedLiveDescriptor = toFloat32Descriptor(liveDescriptor);
    const studentsStore = getStudentsStore();
    const students = Object.values(studentsStore);

    if (!students.length) {
      return {
        matched: false,
        reason: "No registered students found.",
        distance: null,
        confidence: 0,
        student: null,
        threshold
      };
    }

    const labeledDescriptors = students
      .map((student) => {
        const label = String(student.rollNumber || student.id || "").trim();
        const descriptorList = Array.isArray(student.descriptors)
          ? student.descriptors.map(toFloat32Descriptor)
          : [];

        if (!label || !descriptorList.length) {
          return null;
        }

        return new window.faceapi.LabeledFaceDescriptors(label, descriptorList);
      })
      .filter(Boolean);

    if (!labeledDescriptors.length) {
      return {
        matched: false,
        reason: "No valid student descriptors found.",
        distance: null,
        confidence: 0,
        student: null,
        threshold
      };
    }

    const faceMatcher = new window.faceapi.FaceMatcher(labeledDescriptors, threshold);
    const bestMatchResult = faceMatcher.findBestMatch(normalizedLiveDescriptor);
    const smallestDistance = Number(bestMatchResult.distance.toFixed(4));
    const matched = bestMatchResult.label !== "unknown" && smallestDistance < threshold;

    const matchedStudent = matched
      ? students.find(
          (student) =>
            String(student.rollNumber || student.id || "").trim().toLowerCase() ===
            String(bestMatchResult.label).trim().toLowerCase()
        ) || null
      : null;

    const confidence = Math.max(0, Math.min(100, ((threshold - smallestDistance) / threshold) * 100));

    return {
      matched,
      reason: matched ? "Face matched successfully." : "Face not recognized.",
      distance: smallestDistance,
      confidence: Number(confidence.toFixed(2)),
      student: matchedStudent,
      threshold
    };
  } catch (error) {
    throw new Error(`Failed to match face. ${error.message}`);
  }
}

export function markAttendance(studentId, subject, date = new Date()) {
  try {
    if (!studentId) {
      throw new Error("studentId is required.");
    }
    if (!subject || String(subject).trim() === "") {
      throw new Error("subject is required.");
    }

    const dateObj = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(dateObj.getTime())) {
      throw new Error("Invalid date supplied.");
    }

    const dateKey = dateObj.toISOString().slice(0, 10);
    const normalizedSubject = String(subject).trim();

    const attendance = getAttendanceRecords();
    const duplicate = attendance.find(
      (record) =>
        record.studentId === studentId &&
        String(record.subject).toLowerCase() === normalizedSubject.toLowerCase() &&
        record.date === dateKey
    );

    if (duplicate) {
      return {
        success: false,
        duplicate: true,
        message: "Attendance already marked for this student, subject, and date.",
        record: duplicate
      };
    }

    const entry = {
      id: `A-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      studentId,
      subject: normalizedSubject,
      date: dateKey,
      timestamp: new Date().toISOString(),
      status: "present"
    };

    attendance.push(entry);
    writeJsonToStorage(ATTENDANCE_KEY, attendance);

    return {
      success: true,
      duplicate: false,
      message: "Attendance marked successfully.",
      record: entry
    };
  } catch (error) {
    throw new Error(`Failed to mark attendance. ${error.message}`);
  }
}

export function averageDescriptors(descriptors) {
  if (!Array.isArray(descriptors) || descriptors.length === 0) {
    throw new Error("At least one descriptor is required to calculate average.");
  }

  const normalized = descriptors.map(toNumberArray);
  const length = normalized[0].length;

  if (!normalized.every((descriptor) => descriptor.length === length)) {
    throw new Error("All descriptors must have the same length.");
  }

  const sums = new Array(length).fill(0);
  normalized.forEach((descriptor) => {
    descriptor.forEach((value, index) => {
      sums[index] += value;
    });
  });

  return sums.map((sum) => sum / normalized.length);
}

export function getRegisteredStudents() {
  return Object.values(getStudentsStore());
}

export function getAttendanceHistory() {
  return getAttendanceRecords();
}
