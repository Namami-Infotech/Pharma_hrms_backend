const db = require('../../config/db');

const getDoctorSpeciality = async (req, res) => {
    const response = {
        success: false,
        message: '',
        data: []
    };

    try {
        const [rows] = await db.query(`
      SELECT 
        id,
        SpecialityName,
        Description,
        Status,
        CreatedAt
      FROM specialist
      WHERE Status = 1
      ORDER BY SpecialityName ASC
    `);

        response.success = true;
        response.message = 'Doctor specialities fetched successfully.';
        response.data = rows;

        return res.json(response);
    } catch (err) {
        console.error('Error in getDoctorSpeciality:', err);

        response.message = 'Failed to retrieve doctor specialities.';

        return res.status(500).json(response);
    }
};

module.exports = getDoctorSpeciality;