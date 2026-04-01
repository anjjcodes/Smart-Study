const StudyLog = require('../models/StudyLog');

/**
 * Burnout Detection Logic:
 * HIGH risk:
 *   - Any day in last 7 days has > 8 study hours
 *   - 7 consecutive days of study with no rest day (hours > 0)
 * MODERATE risk:
 *   - Any day in last 7 days has > 5 tasks
 *   - Total weekly hours > 40
 */
async function detectBurnout(userId) {
  const today = new Date();
  const results = {
    riskLevel: 'none',   // none | moderate | high
    triggers: [],
    suggestions: [],
    weeklyStats: {}
  };

  // Get last 7 days date strings
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split('T')[0]);
  }

  // Fetch study logs for last 7 days
  const logs = await StudyLog.find({
    userId,
    date: { $in: last7Days }
  }).lean();

  // Map date -> log for easy access
  const logMap = {};
  logs.forEach(log => { logMap[log.date] = log; });

  let totalWeeklyHours = 0;
  let maxDailyHours = 0;
  let maxDailyTasks = 0;
  let consecutiveStudyDays = 0;
  let maxConsecutive = 0;

  last7Days.forEach(date => {
    const log = logMap[date] || { totalHours: 0, taskCount: 0 };
    totalWeeklyHours += log.totalHours;

    if (log.totalHours > maxDailyHours) maxDailyHours = log.totalHours;
    if (log.taskCount > maxDailyTasks) maxDailyTasks = log.taskCount;

    if (log.totalHours > 0) {
      consecutiveStudyDays++;
      if (consecutiveStudyDays > maxConsecutive) maxConsecutive = consecutiveStudyDays;
    } else {
      consecutiveStudyDays = 0;
    }
  });

  results.weeklyStats = {
    totalWeeklyHours: Math.round(totalWeeklyHours * 10) / 10,
    maxDailyHours: Math.round(maxDailyHours * 10) / 10,
    maxDailyTasks,
    consecutiveDays: maxConsecutive,
    dailyBreakdown: last7Days.map(date => ({
      date,
      hours: logMap[date]?.totalHours || 0,
      tasks: logMap[date]?.taskCount || 0
    }))
  };

  // Apply burnout rules
  if (maxDailyHours > 8) {
    results.riskLevel = 'high';
    results.triggers.push(`You studied more than 8 hours on a single day (${maxDailyHours.toFixed(1)} hrs)`);
    results.suggestions.push('Break your study sessions into 90-min blocks with 15-min breaks (Pomodoro technique).');
    results.suggestions.push('Aim for maximum 6 focused hours per day for better retention.');
  }

  if (maxConsecutive >= 7) {
    results.riskLevel = 'high';
    results.triggers.push(`You studied ${maxConsecutive} consecutive days without a rest day`);
    results.suggestions.push('Schedule at least one rest day per week. Rest improves memory consolidation.');
    results.suggestions.push('Consider taking tomorrow off or doing only light review.');
  }

  if (maxDailyTasks > 5) {
    if (results.riskLevel !== 'high') results.riskLevel = 'moderate';
    results.triggers.push(`You had more than 5 tasks in a single day (${maxDailyTasks} tasks)`);
    results.suggestions.push('Limit yourself to 3–5 tasks per day using time-blocking.');
    results.suggestions.push('Prioritize your Most Important Task (MIT) first each morning.');
  }

  if (totalWeeklyHours > 40 && results.riskLevel === 'none') {
    results.riskLevel = 'moderate';
    results.triggers.push(`Weekly study hours are high (${totalWeeklyHours.toFixed(1)} hrs this week)`);
    results.suggestions.push('Aim for 6–8 hours of study per day with adequate sleep (7–8 hrs).');
  }

  // Deduplicate suggestions
  results.suggestions = [...new Set(results.suggestions)];

  return results;
}

module.exports = { detectBurnout };
