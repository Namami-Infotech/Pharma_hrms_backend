const path = require('path');
const fs = require('fs');

const OFFICE_LAT = null;
const OFFICE_LON = null;

function calculateDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function parseDateOrTime(input) {
  if (!input) return null;
  if (input instanceof Date && !isNaN(input.getTime())) return input;
  const str = input.toString().trim();
  let d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
    const timeVal = str.length === 5 ? str + ':00' : str;
    d = new Date(`1970-01-01T${timeVal}`);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function formatTimeAMPM(dateInput) {
  if (!dateInput) return 'N/A';
  const d = parseDateOrTime(dateInput);
  if (!d) return 'N/A';
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  const hoursStr = hours < 10 ? '0' + hours : hours;
  return `${hoursStr}:${minutesStr} ${ampm}`;
}

function formatDateDDMMYYYY(dateInput) {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function calculateWorkingHours(startDate, endDate) {
  if (!startDate || !endDate) return 'N/A';

  // If both have full dates with valid timestamps (e.g. "2026-10-17 09:30:00" and "2026-10-17 18:30:00")
  if (String(startDate).includes('-') && String(endDate).includes('-')) {
    const startFull = new Date(startDate);
    const endFull = new Date(endDate);
    if (!isNaN(startFull.getTime()) && !isNaN(endFull.getTime())) {
      const diffMs = endFull.getTime() - startFull.getTime();
      if (diffMs >= 0 && diffMs <= 48 * 3600 * 1000) {
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return hours > 0 ? `${hours} hrs, ${minutes} mins` : `${minutes} mins`;
      }
    }
  }

  // If one or both is a time-only string (e.g. "09:30:00" from MySQL TIME column)
  let startTimeStr = startDate.toString().trim();
  if (startTimeStr.includes(' ')) startTimeStr = startTimeStr.split(' ')[1];
  else if (startTimeStr.includes('T')) startTimeStr = startTimeStr.split('T')[1].slice(0, 8);

  let endTimeStr = endDate.toString().trim();
  if (endTimeStr.includes(' ')) endTimeStr = endTimeStr.split(' ')[1];
  else if (endTimeStr.includes('T')) endTimeStr = endTimeStr.split('T')[1].slice(0, 8);

  const start = parseDateOrTime(startTimeStr);
  const end = parseDateOrTime(endTimeStr);
  if (!start || !end) return 'N/A';
  let diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) {
    diffMs += 24 * 60 * 60 * 1000;
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `${hours} hrs, ${minutes} mins` : `${minutes} mins`;
}

function saveBase64Image(base64Image, subfolder = 'attendance') {
  if (!base64Image || typeof base64Image !== 'string') return null;

  if (base64Image.startsWith('http://') || base64Image.startsWith('https://')) {
    return base64Image;
  }

  let imageType = 'png';
  let base64Data = base64Image;

  const matches = base64Image.match(/^data:image\/(\w+);base64,/);
  if (matches) {
    imageType = matches[1];
    base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  }

  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const uploadDir = path.join(__dirname, `../../../uploads/${subfolder}`);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const imageName = `${Date.now()}_${Math.floor(100 + Math.random() * 900)}.${imageType}`;
    const filePath = path.join(uploadDir, imageName);
    fs.writeFileSync(filePath, buffer);

    return `https://namami-infotech.com/SAFEGUARD/src/${subfolder}/uploads/${imageName}`;
  } catch (err) {
    console.error('Error in saveBase64Image:', err);
    return null;
  }
}

module.exports = {
  OFFICE_LAT,
  OFFICE_LON,
  calculateDistance,
  formatTimeAMPM,
  formatDateDDMMYYYY,
  calculateWorkingHours,
  saveBase64Image
};
