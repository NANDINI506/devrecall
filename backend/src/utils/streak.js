// Daily streak logic. A "day" is calculated in the configured timezone (default India, +5:30).
const OFFSET_MIN = Number(process.env.TZ_OFFSET_MINUTES ?? 330);

const dayKey = (date = new Date()) => new Date(date.getTime() + OFFSET_MIN * 60000).toISOString().slice(0, 10);
const daysAgo = (n) => dayKey(new Date(Date.now() - n * 86400000));

// Call this whenever the user does something that counts as studying
// (completes a topic, submits a quiz, asks the AI tutor a question).
async function recordActivity(user) {
  const today = dayKey();
  if (user.streak.lastActive === today) return; // already counted today

  user.streak.current = user.streak.lastActive === daysAgo(1) ? user.streak.current + 1 : 1;
  user.streak.longest = Math.max(user.streak.longest, user.streak.current);
  user.streak.lastActive = today;
  user.activityDates = [...user.activityDates, today].slice(-90);
  await user.save();
}

// The streak shown to the user: it is "alive" only if they studied today or yesterday.
function currentStreak(user) {
  const last = user.streak.lastActive;
  return last === dayKey() || last === daysAgo(1) ? user.streak.current : 0;
}

module.exports = { dayKey, daysAgo, recordActivity, currentStreak };
