/**
 * Clipboard utility with fallback for iframe/restricted environments
 * Handles cases where Clipboard API is blocked by permissions policy
 */

/**
 * Copies text to clipboard with fallback methods
 * @param text - Text to copy
 * @returns Promise that resolves when copy is successful
 */
export async function copyToClipboard(text: string): Promise<void> {
  // Try modern Clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (err) {
      // Silently fall through to fallback - this is expected in iframe environments
      // No need to log as the fallback will handle it
    }
  }

  // Fallback: Use execCommand (works in more contexts)
  return copyToClipboardFallback(text);
}

/**
 * Fallback method using document.execCommand (deprecated but widely supported)
 * Works better in iframe environments where Clipboard API is blocked
 */
function copyToClipboardFallback(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    
    // Style it to be invisible and non-intrusive
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    textarea.setAttribute('readonly', '');
    
    document.body.appendChild(textarea);
    
    try {
      // Select the text
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      
      // Copy using execCommand
      const successful = document.execCommand('copy');
      
      if (successful) {
        resolve();
      } else {
        reject(new Error('execCommand copy failed'));
      }
    } catch (err) {
      reject(err);
    } finally {
      // Clean up
      document.body.removeChild(textarea);
    }
  });
}

/**
 * Check if clipboard access is available
 */
export function isClipboardAvailable(): boolean {
  return !!(navigator.clipboard && navigator.clipboard.writeText);
}

/**
 * Get a user-friendly error message for clipboard failures
 */
export function getClipboardErrorMessage(): string {
  if (!isClipboardAvailable()) {
    return 'Clipboard access not available in this environment';
  }
  return 'Failed to copy to clipboard';
}