/**
 * Calculates exact age in years based on date of birth
 * @param {Date|string} dob - Date of birth
 * @returns {number} Age in full years
 */
export const calculateAge = (dob) => {
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) {
    return 0;
  }
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Verifies if user is at least 18 years old
 * @param {Date|string} dob 
 * @returns {boolean}
 */
export const is18OrOlder = (dob) => {
  const age = calculateAge(dob);
  return age >= 18;
};
