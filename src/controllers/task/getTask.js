const db = require('../../config/db');

const getTask = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const rmEmpId = req.query.empid ? req.query.empid.toString().trim() : null;

  if (!rmEmpId) {
    response.message = 'RM Employee ID (empid) parameter is required';
    return res.json(response);
  }

  try {
    const [verifyRows] = await db.query(
      'SELECT COUNT(*) as rmCount FROM Employees WHERE RM = ?',
      [rmEmpId]
    );

    const rmCount = verifyRows[0].rmCount;

    if (rmCount === 0) {
      response.message = 'No employees found under this Reporting Manager';
      response.data = {
        Leaves: [],
        ExpenseDetails: [],
        TravelExpenses: [],
        Regularisation: []
      };
      return res.json(response);
    }

    const pendingTasks = {};

    // Leaves
    const [leaves] = await db.query(
      `SELECT L.*, E.Name, E.EmpId as EmployeeId
       FROM Leaves L
       JOIN Employees E ON L.EmpId = E.EmpId
       WHERE L.Status = "Pending" AND E.RM = ?`,
      [rmEmpId]
    );
    pendingTasks.Leaves = leaves;

    // ExpenseDetails
    const [expenses] = await db.query(
      `SELECT ED.*, E.Name, E.EmpId as EmployeeId
       FROM ExpenseDetails ED
       JOIN Employees E ON ED.empId = E.EmpId
       WHERE (ED.Status IS NULL OR ED.Status = "Pending") AND E.RM = ?`,
      [rmEmpId]
    );
    pendingTasks.ExpenseDetails = expenses;

    // TravelExpenses
    const [travel] = await db.query(
      `SELECT T.*, E.Name, E.EmpId as EmployeeId
       FROM TravelExpenses T
       JOIN Employees E ON T.EmpId = E.EmpId
       WHERE T.Status = "Pending" AND E.RM = ?`,
      [rmEmpId]
    );
    pendingTasks.TravelExpenses = travel;

    // Regularisation
    const [regularisation] = await db.query(
      `SELECT R.*, E.Name, E.EmpId as EmployeeId
       FROM Regularisation R
       JOIN Employees E ON R.EmpId = E.EmpId
       WHERE R.Status = "Pending" AND E.RM = ?`,
      [rmEmpId]
    );
    pendingTasks.Regularisation = regularisation;

    response.success = true;
    response.message = `Pending tasks retrieved successfully for employees under RM: ${rmEmpId}`;
    response.data = pendingTasks;
    response.reporting_manager_id = rmEmpId;

    return res.json(response);
  } catch (err) {
    console.error('Error in getTask:', err);
    response.message = `Error retrieving pending tasks: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 2. Task Action (src/task/task_action.php);

module.exports = getTask;
