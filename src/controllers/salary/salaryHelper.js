function calculateWeeklyOffs(arg1, arg2, arg3) {
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  let year = new Date().getFullYear();
  let month = new Date().getMonth() + 1;
  let weekOffName = 'Sunday';

  if (typeof arg1 === 'number' && arg1 > 1000) {
    // Signature: calculateWeeklyOffs(year, month, weekOffName)
    year = arg1;
    month = parseInt(arg2, 10) || month;
    weekOffName = typeof arg3 === 'string' ? arg3 : String(arg3 || 'Sunday');
  } else if (typeof arg3 === 'number' && arg3 > 1000) {
    // Signature: calculateWeeklyOffs(weekOffName, month, year)
    weekOffName = typeof arg1 === 'string' ? arg1 : String(arg1 || 'Sunday');
    month = parseInt(arg2, 10) || month;
    year = arg3;
  } else {
    weekOffName = String(arg1 || arg3 || 'Sunday');
    month = parseInt(arg2, 10) || month;
  }

  const cleanName = String(weekOffName || 'Sunday').toLowerCase().trim();
  const targetDay = daysOfWeek.indexOf(cleanName);
  const validDay = targetDay !== -1 ? targetDay : 0; // Default to Sunday (0) if not matched

  const totalDays = new Date(year, month, 0).getDate();
  let count = 0;
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, month - 1, day);
    if (d.getDay() === validDay) count++;
  }
  return count;
}

module.exports = { calculateWeeklyOffs };