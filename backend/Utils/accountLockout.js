const MAX_FAILED_ATTEMPTS = 6;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

function isAccountLocked(user) {
  if (!user?.lockedUntil) return false;
  return new Date(user.lockedUntil).getTime() > Date.now();
}

function getLockoutRemainingSeconds(user) {
  if (!isAccountLocked(user)) return 0;
  return Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 1000);
}

async function recordFailedLogin(user) {
  const nextCount = (user.failedLoginAttempts || 0) + 1;
  user.failedLoginAttempts = nextCount;

  if (nextCount >= MAX_FAILED_ATTEMPTS) {
    user.lockedUntil = new Date(Date.now() + LOCKOUT_WINDOW_MS);
    user.failedLoginAttempts = 0;
  }

  await user.save({ validateBeforeSave: false });
}

async function clearFailedLogins(user) {
  if (!user.failedLoginAttempts && !user.lockedUntil) return;
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  await user.save({ validateBeforeSave: false });
}

module.exports = {
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_WINDOW_MS,
  isAccountLocked,
  getLockoutRemainingSeconds,
  recordFailedLogin,
  clearFailedLogins
};
