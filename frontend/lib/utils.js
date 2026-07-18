/**
 * utils.js — Shared utility functions
 *
 * Extracted from duplicated implementations in:
 *   - app/schemes/page.jsx (formatAmount, inside SchemeCard and activeFormatAmount)
 *   - app/schemes/[id]/page.jsx (formatAmount)
 *   - app/search/page.jsx (formatAmount, inside SchemeCard)
 */

// ---------------------------------------------------------------------------
// Format benefit amount with frequency suffix
// Duplicated in 4+ files as inline functions with identical logic
// ---------------------------------------------------------------------------
/**
 * Formats a benefit amount with its frequency for display.
 *
 * @param {number|null|undefined} amount - The benefit amount in INR
 * @param {string} [frequency] - One of "monthly", "annual", "one-time"
 * @returns {string|null} Formatted string like "₹6,000/month" or null if no amount
 */
export function formatAmount(amount, frequency) {
  if (!amount) return null;

  const freq =
    frequency === "monthly"  ? "/month"
    : frequency === "annual" ? "/year"
    : frequency === "one-time" ? " one-time"
    : "";

  return `₹${amount.toLocaleString("en-IN")}${freq}`;
}

// ---------------------------------------------------------------------------
// Tailwind class name merge helper
// Filters out falsy values and joins with space
// ---------------------------------------------------------------------------
/**
 * Merges class names, filtering out falsy values.
 * Lightweight alternative to clsx/classnames.
 *
 * @param  {...(string|boolean|undefined|null)} classes
 * @returns {string}
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Capitalize first letter of a string
// Used for displaying gender values, status labels, etc.
// ---------------------------------------------------------------------------
/**
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---------------------------------------------------------------------------
// Calculate days remaining until a target date
// Extracted from app/tracker/page.jsx
// ---------------------------------------------------------------------------
/**
 * @param {string} dateStr - ISO date string or YYYY-MM-DD
 * @returns {number|null} Days remaining (negative if overdue), null if no date
 */
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Format a snake_case string into Title Case
// Used for occupation types, document keys, etc.
// ---------------------------------------------------------------------------
/**
 * @param {string} str - e.g. "cash_transfer"
 * @returns {string} - e.g. "Cash Transfer"
 */
export function snakeToTitle(str) {
  if (!str) return "";
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Safely parse JSON from localStorage with a fallback
// Repeated pattern across almost every page component
// ---------------------------------------------------------------------------
/**
 * @param {string} key - localStorage key
 * @param {*} fallback - Default value if parsing fails
 * @returns {*}
 */
export function getStorageJSON(key, fallback = null) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Safely stringify and store JSON to localStorage.
 *
 * @param {string} key
 * @param {*} value
 */
export function setStorageJSON(key, value) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail (quota exceeded, etc.)
  }
}
