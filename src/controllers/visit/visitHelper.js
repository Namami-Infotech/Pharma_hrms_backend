const axios = require('axios');

async function getDrivingDistance(lat1, lon1, lat2, lon2) {
  const url = `http://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
  try {
    const res = await axios.get(url, { timeout: 4000 });
    if (res.data && res.data.routes && res.data.routes.length > 0) {
      return (res.data.routes[0].distance / 1000).toFixed(2);
    }
  } catch (err) {
    // Fallback to Haversine
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  }
  return 0;
}

module.exports = { getDrivingDistance };
