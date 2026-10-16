const path = require('path');
const fs = require('fs');

const OFFICE_LAT = 29.954646;
const OFFICE_LON = 78.0749902;

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

function formatTimeAMPM(dateInput) {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';
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
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  if (isNaN(diffMs) || diffMs < 0) return 'N/A';

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `${hours} hrs, ${minutes} mins` : `${minutes} mins`;
}

function saveBase64Image(base64Image, subfolder = 'attendance') {
  if (!base64Image || typeof base64Image !== 'string') return null;

  const matches = base64Image.match(/^data:image\/(\w+);base64,/);
  if (!matches) return null;

  const imageType = matches[1];
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const uploadDir = path.join(__dirname, `../../../uploads/${subfolder}`);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const imageName = `${Date.now()}_${Math.floor(100 + Math.random() * 900)}.${imageType}`;
  const filePath = path.join(uploadDir, imageName);
  fs.writeFileSync(filePath, buffer);

  return `https://namami-infotech.com/SAFEGUARD/src/${subfolder}/uploads/${imageName}`;
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
