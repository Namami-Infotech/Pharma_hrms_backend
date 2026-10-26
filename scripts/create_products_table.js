const pool = require('../src/config/db');

async function createProductsTable() {
  try {
    console.log('Creating products table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_code VARCHAR(50) UNIQUE,
        name VARCHAR(255) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        packaging VARCHAR(100) NOT NULL,
        price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        hsn VARCHAR(20) DEFAULT '3004',
        category VARCHAR(100) DEFAULT 'General',
        composition TEXT,
        description TEXT,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        Tenent_Id INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant (Tenent_Id),
        INDEX idx_status (status),
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('products table created or already exists.');

    // Check existing count
    const [existing] = await pool.query('SELECT COUNT(*) as cnt FROM products');
    if (existing[0].cnt === 0) {
      console.log('Seeding sample pharmaceutical products for Aberdure Pharma...');
      const seedItems = [
        {
          code: 'AP-PRD-001',
          name: 'Paracetamol 650mg Tablets',
          unit: 'Strip',
          packaging: '10x10 Tablets',
          price: 180.00,
          hsn: '3004',
          category: 'Analgesics / Antipyretics',
          composition: 'Paracetamol IP 650mg',
          description: 'Effective relief for fever and mild to moderate pain'
        },
        {
          code: 'AP-PRD-002',
          name: 'Amoxicillin & Potassium Clavulanate 625mg',
          unit: 'Strip',
          packaging: '10x10 Strips',
          price: 420.00,
          hsn: '3004',
          category: 'Antibiotics',
          composition: 'Amoxicillin Trihydrate 500mg + Potassium Clavulanate 125mg',
          description: 'Broad-spectrum antibiotic for bacterial infections'
        },
        {
          code: 'AP-PRD-003',
          name: 'Azithromycin 500mg Tablets',
          unit: 'Strip',
          packaging: '3x10 Tablets',
          price: 320.00,
          hsn: '3004',
          category: 'Antibiotics',
          composition: 'Azithromycin IP 500mg',
          description: 'Antibiotic for respiratory, skin, and ear infections'
        },
        {
          code: 'AP-PRD-004',
          name: 'Pantoprazole DSR Capsules',
          unit: 'Strip',
          packaging: '10x10 Capsules',
          price: 260.00,
          hsn: '3004',
          category: 'Gastrointestinal',
          composition: 'Pantoprazole Sodium 40mg + Domperidone 30mg SR',
          description: 'Gastro-resistant capsules for GERD and acidity'
        },
        {
          code: 'AP-PRD-005',
          name: 'Cough Syrup (Levocetirizine + Ambroxol)',
          unit: 'Bottle',
          packaging: '100ml Bottle',
          price: 115.00,
          hsn: '3004',
          category: 'Respiratory',
          composition: 'Levocetirizine 2.5mg + Ambroxol HCl 30mg + Guaiphenesin 50mg / 5ml',
          description: 'Relief from wet cough and chest congestion'
        },
        {
          code: 'AP-PRD-006',
          name: 'Diclofenac Sodium Gel 1%',
          unit: 'Tube',
          packaging: '30g Tube',
          price: 95.00,
          hsn: '3004',
          category: 'Topical Pain Relief',
          composition: 'Diclofenac Diethylamine 1.16% w/w + Linseed Oil + Methyl Salicylate',
          description: 'Fast acting pain relief gel for joints and muscular sprains'
        },
        {
          code: 'AP-PRD-007',
          name: 'Multivitamin & Zinc Softgel Capsules',
          unit: 'Box',
          packaging: '3x10 Softgels',
          price: 210.00,
          hsn: '3004',
          category: 'Nutraceuticals / Supplements',
          composition: 'Multivitamin + Multimineral + Zinc Sulphate + Ginseng',
          description: 'Daily immunity booster and vitality supplement'
        },
        {
          code: 'AP-PRD-008',
          name: 'Ceftriaxone 1g Injection',
          unit: 'Vial',
          packaging: 'Vial with WFI (1x1)',
          price: 145.00,
          hsn: '3004',
          category: 'Injections',
          composition: 'Sterile Ceftriaxone Sodium IP eq. to Anhydrous Ceftriaxone 1000mg',
          description: 'Potent cephalosporin antibiotic for severe bacterial infections'
        }
      ];

      for (const item of seedItems) {
        await pool.query(
          `INSERT INTO products (product_code, name, unit, packaging, price, hsn, category, composition, description, status, Tenent_Id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', 1)`,
          [item.code, item.name, item.unit, item.packaging, item.price, item.hsn, item.category, item.composition, item.description]
        );
      }
      console.log('Seeded 8 initial pharmaceutical products.');
    } else {
      console.log(`products table already has ${existing[0].cnt} records.`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error creating products table:', err);
    process.exit(1);
  }
}

createProductsTable();
