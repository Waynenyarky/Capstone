/**
 * Generate a reference number with format: PREFIX-YYYY-XXXXXX
 * @param {string} prefix - The prefix for the reference (e.g., 'CLR', 'APP', 'PER')
 * @returns {string} The generated reference number
 */
async function generateReferenceNumber(prefix) {
  const year = new Date().getFullYear();
  
  // Generate a random 6-digit number
  const random = Math.floor(100000 + Math.random() * 900000);
  
  // In a production system, you'd want to check uniqueness against the database
  // and increment if there's a collision
  
  return `${prefix}-${year}-${random}`;
}

/**
 * Generate a sequential reference number
 * @param {string} prefix - The prefix
 * @param {number} sequence - The sequence number
 * @returns {string} The formatted reference number
 */
function formatReferenceNumber(prefix, sequence) {
  const year = new Date().getFullYear();
  const paddedSequence = String(sequence).padStart(6, '0');
  return `${prefix}-${year}-${paddedSequence}`;
}

module.exports = {
  generateReferenceNumber,
  formatReferenceNumber
};
