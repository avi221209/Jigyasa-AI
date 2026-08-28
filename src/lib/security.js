/**
 * Security & Input Validation Layer
 * =================================
 * Enforces strict input validation schemas, error message sanitization,
 * and safety checks to prevent information leakage and invalid payloads.
 */

// Permitted confidence values
const ALLOWED_CONFIDENCE_LEVELS = new Set(['low', 'medium', 'high']);

/**
 * Validate student free-text reasoning input against strict schema
 * @param {any} input - Student response text
 * @returns {{ valid: boolean, sanitized?: string, error?: string }}
 */
export function validateStudentInput(input) {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Invalid payload: Reasoning input must be a string.' };
  }

  const trimmed = input.trim();

  if (trimmed.length < 15) {
    return { valid: false, error: 'Input too short. Please provide at least 15 characters explaining your trace.' };
  }

  if (trimmed.length > 2000) {
    return { valid: false, error: 'Input exceeds maximum length limit (2000 characters).' };
  }

  // Reject control characters and dangerous null bytes
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(trimmed)) {
    return { valid: false, error: 'Invalid characters detected in input.' };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validate Ask Mode question input against strict schema
 * @param {any} input
 * @returns {{ valid: boolean, sanitized?: string, error?: string }}
 */
export function validateAskModeQuestion(input) {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Invalid payload: Question must be a string.' };
  }

  const trimmed = input.trim();

  if (trimmed.length < 10) {
    return { valid: false, error: 'Question too short. Please provide at least 10 characters.' };
  }

  if (trimmed.length > 1000) {
    return { valid: false, error: 'Question exceeds maximum limit of 1000 characters.' };
  }

  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(trimmed)) {
    return { valid: false, error: 'Invalid control characters detected in question.' };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validate Follow-Up challenge answer against strict schema
 * @param {any} input
 * @returns {{ valid: boolean, sanitized?: string, error?: string }}
 */
export function validateFollowUpAnswer(input) {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Invalid payload: Answer must be a string.' };
  }

  const trimmed = input.trim();

  if (trimmed.length < 5) {
    return { valid: false, error: 'Answer too short. Please provide at least 5 characters.' };
  }

  if (trimmed.length > 1000) {
    return { valid: false, error: 'Answer exceeds maximum limit of 1000 characters.' };
  }

  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(trimmed)) {
    return { valid: false, error: 'Invalid control characters detected.' };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validate Explain It Back student explanation against strict schema
 * @param {any} input
 * @returns {{ valid: boolean, sanitized?: string, error?: string }}
 */
export function validateExplainBackInput(input) {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Invalid payload: Explanation must be a string.' };
  }

  const trimmed = input.trim();

  if (trimmed.length < 10) {
    return { valid: false, error: 'Explanation too short. Please provide at least 10 characters.' };
  }

  if (trimmed.length > 1500) {
    return { valid: false, error: 'Explanation exceeds maximum limit of 1500 characters.' };
  }

  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(trimmed)) {
    return { valid: false, error: 'Invalid control characters detected.' };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validate self-rated confidence level against strict enum schema
 * @param {any} level
 * @returns {boolean}
 */
export function validateConfidenceLevel(level) {
  return ALLOWED_CONFIDENCE_LEVELS.has(level);
}

/**
 * Sanitize runtime error messages to prevent internal stack trace or path leakage
 * @param {Error|string|any} rawError
 * @returns {string} User-safe generic message
 */
export function sanitizeUserErrorMessage(rawError) {
  const message = rawError?.message || String(rawError || 'An error occurred.');

  // Log full detailed error for developer debugging
  console.error('[Security Audit] Full Internal Error:', rawError);

  // Check for common sensitive leak patterns (paths, API keys, database details)
  if (/sk-[a-zA-Z0-9_-]{10,}|AIzaSy[a-zA-Z0-9_-]{10,}/i.test(message)) {
    return 'API key configuration error. Switched to fallback diagnostic mode.';
  }

  if (/(?:[C-Z]:\\|\/home\/|\/Users\/|\/var\/|\.js:\d+)/i.test(message)) {
    return 'Internal system processing error. Switched to local heuristic mode.';
  }

  if (/SQL|database|connect|ECONNREFUSED|ENOTFOUND/i.test(message)) {
    return 'Service connection error. Retrying with local heuristic mode.';
  }

  // Safe fallback
  return 'The AI service encountered a temporary error. Switched to local fallback mode.';
}

/**
 * File upload safety validator (defense-in-depth utility)
 * @param {File} file
 * @param {Array<string>} allowedMimeTypes
 * @param {number} maxSizeBytes
 */
export function validateFileUpload(file, allowedMimeTypes = ['image/png', 'image/jpeg', 'text/plain'], maxSizeBytes = 2097152) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File exceeds maximum allowed size (${(maxSizeBytes / (1024 * 1024)).toFixed(1)}MB).` };
  }

  // Verify extension is not executable
  const extension = (file.name.split('.').pop() || '').toLowerCase();
  const dangerousExtensions = new Set(['exe', 'js', 'html', 'php', 'py', 'sh', 'bat', 'cmd', 'ps1', 'vbs', 'dll', 'cgi', 'pl']);
  if (dangerousExtensions.has(extension)) {
    return { valid: false, error: 'Executable or script files are strictly prohibited.' };
  }

  if (!allowedMimeTypes.includes(file.type)) {
    return { valid: false, error: `Invalid file type (${file.type}). Allowed types: ${allowedMimeTypes.join(', ')}` };
  }

  return { valid: true };
}

