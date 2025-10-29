/**
 * Utility functions for user-related operations
 */

// Array of available default user icons
const DEFAULT_USER_ICONS = [
  '/assets/images/User Icon.png',
  '/assets/images/user_icon2.png',
  '/assets/images/user_icon3.png',
  '/assets/images/user_icon4.png'
];

/**
 * Get a random user icon based on user ID to ensure consistency
 * @param {string} userId - The user's ID for consistent randomization
 * @returns {string} - Path to the random user icon
 */
export const getRandomUserIcon = (userId) => {
  if (!userId) {
    // Fallback to completely random if no userId
    const randomIndex = Math.floor(Math.random() * DEFAULT_USER_ICONS.length);
    return DEFAULT_USER_ICONS[randomIndex];
  }
  
  // Use userId to create a consistent "random" selection
  // This ensures the same user always gets the same random icon
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Get positive index
  const index = Math.abs(hash) % DEFAULT_USER_ICONS.length;
  return DEFAULT_USER_ICONS[index];
};

/**
 * Get user avatar URL - returns user's avatar if they have one, otherwise random icon
 * @param {object} user - User object with details
 * @returns {string} - Avatar URL or random icon path
 */
export const getUserAvatarUrl = (user) => {
  if (user?.details?.avatar) {
    return user.details.avatar;
  }
  
  return getRandomUserIcon(user?._id || user?.id);
};