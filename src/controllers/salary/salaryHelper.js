function calculateWeeklyOffs(year, month, weekOffName = 'Sunday') {
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = daysOfWeek.indexOf((weekOffName || 'Sunday').toLowerCase());
  if (targetDay === -1) return 0;

  const totalDays = new Date(year, month, 0).getDate();
  let count = 0;
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, month - 1, day);
    if (d.getDay() === targetDay) count++;
  }
  return count;
}

module.exports = { calculateWeeklyOffs };
