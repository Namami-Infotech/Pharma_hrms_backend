function getDayDiffInclusive(fromDateStr, toDateStr) {
  const from = new Date(fromDateStr);
  const to = new Date(toDateStr);
  const diffTime = Math.abs(to - from);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

module.exports = { getDayDiffInclusive };
