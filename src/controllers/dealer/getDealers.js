const db = require('../../config/db');

const getDealers = async (req, res) => {
  const response = { success: false, message: '', data: [], fields: [] };

  try {
    // 1. Fetch dynamic checkpoints
    const [checkpoints] = await db.query(
      `SELECT c.Id, c.Description, c.TypeId, t.Description AS TypeName, c.Options, c.Mandatory
       FROM Checkpoints c
       LEFT JOIN Type t ON c.TypeId = t.Id
       WHERE c.Active = 1
       ORDER BY c.Id ASC`
    );

    const chkMap = {};
    checkpoints.forEach(chk => {
      chkMap[chk.Id] = chk.Description;
    });

    // 2. Fetch Transaction-based dealers (MenuId = 1)
    const [hdrRows] = await db.query(
      `SELECT TH.SRNo AS DealerID, TH.ActivityId, TH.CreatedAt 
       FROM TransactionHDR TH 
       WHERE TH.MenuId = 1
       ORDER BY TH.Id DESC`
    );

    const activityDealerMap = new Map();

    for (const row of hdrRows) {
      const activityId = row.ActivityId;

      const [latRows] = await db.query(
        `SELECT LatLong FROM TransactionDTL 
         WHERE ActivityId = ? AND LatLong IS NOT NULL AND LatLong != '' 
         LIMIT 1`,
        [activityId]
      );
      const latLong = latRows && latRows.length > 0 ? latRows[0].LatLong : '';

      const [dtlRows] = await db.query(
        `SELECT ChkId, Value FROM TransactionDTL WHERE ActivityId = ?`,
        [activityId]
      );

      const dealer = {
        DealerID: row.DealerID || row.ActivityId,
        ActivityId: activityId,
        LatLong: latLong,
        CreatedAt: row.CreatedAt
      };

      for (const dtl of dtlRows) {
        const fieldName = chkMap[dtl.ChkId] || `Field_${dtl.ChkId}`;
        dealer[fieldName] = dtl.Value;
        dealer[`chk_${dtl.ChkId}`] = dtl.Value;
      }

      // Ensure all checkpoint fields exist in the dealer object
      for (const chk of checkpoints) {
        if (dealer[chk.Description] === undefined) {
          dealer[chk.Description] = '';
        }
      }

      // Also set standard fallback properties for legacy component compatibility
      dealer.CompanyName = dealer['Company Name'] || dealer.CompanyName || '';
      dealer.Address = dealer['Address'] || dealer.Address || '';
      dealer.DealerName = dealer['Dealer Name'] || dealer.DealerName || dealer.CompanyName;
      dealer.ContactInfo = dealer['Contact Info'] || dealer.ContactInfo || '';
      dealer.MailId = dealer['Mail Id'] || dealer.MailId || '';
      dealer.Remarks = dealer['Remarks'] || dealer.Remarks || '';

      // Build structured dynamic values list for easy frontend rendering
      const dynamicValues = checkpoints.map(chk => {
        const foundDtl = dtlRows.find(d => d.ChkId === chk.Id);
        return {
          chkId: chk.Id,
          description: chk.Description,
          typeId: chk.TypeId,
          typeName: chk.TypeName,
          options: chk.Options,
          mandatory: chk.Mandatory,
          value: foundDtl ? foundDtl.Value : (dealer[chk.Description] || '')
        };
      });
      dealer.dynamicValues = dynamicValues;

      if (row.DealerID) {
        activityDealerMap.set(Number(row.DealerID), dealer);
      } else {
        activityDealerMap.set(activityId, dealer);
      }
    }

    // 3. Also fetch directly from Dealers table for complete backward compatibility
    const [dealerTableRows] = await db.query(
      `SELECT * FROM Dealers ORDER BY DealerID DESC`
    );

    for (const dRow of dealerTableRows) {
      const dId = Number(dRow.DealerID);
      const existing = activityDealerMap.get(dId);

      if (existing) {
        // Merge DB record with dynamic transaction values
        existing.CompanyName = existing.CompanyName || dRow.CompanyName || '';
        existing.Address = existing.Address || dRow.Address || '';
        existing.DealerName = existing.DealerName || dRow.DealerName || '';
        existing.ContactInfo = existing.ContactInfo || dRow.ContactInfo || '';
        existing.MailId = existing.MailId || dRow.MailId || '';
        existing.Remarks = existing.Remarks || dRow.Remarks || '';
        existing.LatLong = existing.LatLong || dRow.LatLong || '';
        existing.AddedByEmpId = dRow.AddedByEmpId || '';
        existing.CreatedAt = existing.CreatedAt || dRow.CreateDate || '';
        existing.CreateDate = existing.CreatedAt;

        // Update dynamicValues values if missing
        if (existing.dynamicValues) {
          existing.dynamicValues.forEach(dv => {
            if (!dv.value) {
              const descLower = dv.description.toLowerCase();
              if (descLower.includes('company')) dv.value = existing.CompanyName;
              else if (descLower.includes('address')) dv.value = existing.Address;
              else if (descLower.includes('dealer')) dv.value = existing.DealerName;
              else if (descLower.includes('contact') || descLower.includes('phone')) dv.value = existing.ContactInfo;
              else if (descLower.includes('mail') || descLower.includes('email')) dv.value = existing.MailId;
              else if (descLower.includes('remark')) dv.value = existing.Remarks;
            }
          });
        }
      } else {
        // Dealer exists only in Dealers table
        const dealer = {
          DealerID: dRow.DealerID,
          DealerName: dRow.DealerName || '',
          Address: dRow.Address || '',
          ContactInfo: dRow.ContactInfo || '',
          LatLong: dRow.LatLong || '',
          CompanyName: dRow.CompanyName || '',
          MailId: dRow.MailId || '',
          Remarks: dRow.Remarks || '',
          AddedByEmpId: dRow.AddedByEmpId || '',
          CreatedAt: dRow.CreateDate,
          CreateDate: dRow.CreateDate
        };

        // Map standard columns to matching checkpoint field names
        dealer['Company Name'] = dRow.CompanyName || '';
        dealer['Address'] = dRow.Address || '';
        dealer['Dealer Name'] = dRow.DealerName || '';
        dealer['Contact Info'] = dRow.ContactInfo || '';
        dealer['Mail Id'] = dRow.MailId || '';
        dealer['Remarks'] = dRow.Remarks || '';

        dealer.dynamicValues = checkpoints.map(chk => {
          let val = '';
          const descLower = chk.Description.toLowerCase();
          if (descLower.includes('company')) val = dRow.CompanyName || '';
          else if (descLower.includes('address')) val = dRow.Address || '';
          else if (descLower.includes('dealer')) val = dRow.DealerName || '';
          else if (descLower.includes('contact') || descLower.includes('phone')) val = dRow.ContactInfo || '';
          else if (descLower.includes('mail') || descLower.includes('email')) val = dRow.MailId || '';
          else if (descLower.includes('remark')) val = dRow.Remarks || '';

          return {
            chkId: chk.Id,
            description: chk.Description,
            typeId: chk.TypeId,
            typeName: chk.TypeName,
            options: chk.Options,
            mandatory: chk.Mandatory,
            value: val
          };
        });

        for (const chk of checkpoints) {
          if (dealer[chk.Description] === undefined) {
            dealer[chk.Description] = '';
          }
        }

        activityDealerMap.set(dId, dealer);
      }
    }

    const result = Array.from(activityDealerMap.values()).sort((a, b) => {
      const idA = parseInt(a.DealerID || a.ActivityId || 0, 10);
      const idB = parseInt(b.DealerID || b.ActivityId || 0, 10);
      if (!isNaN(idA) && !isNaN(idB) && idA !== idB) {
        return idB - idA;
      }
      return new Date(b.CreatedAt || b.CreateDate || 0) - new Date(a.CreatedAt || a.CreateDate || 0);
    });

    response.success = true;
    response.message = 'Dealers fetched successfully.';
    response.data = result;
    response.fields = checkpoints;
    return res.json(response);
  } catch (err) {
    console.error('Error in getDealers:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = getDealers;
