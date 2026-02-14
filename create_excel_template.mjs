import XLSX from 'xlsx';

// Create sample data for Excel template
const sampleData = [
  {
    'Client Code': 'CLI001',
    'Name': 'John Doe',
    'Email': 'john.doe@example.com',
    'Mobile': '9876543210',
    'DOB': '15-01-1990',
    'PAN No': 'ABCDE1234F',
    'Aadhaar No': '123456789012',
    'Address': '123 Main St, Apt 4B',
    'City': 'Mumbai',
    'Pincode': '400001',
    'Branch': 'Mumbai Branch',
    'Reference Code': '',
    'Opening Investment': '50000'
  },
  {
    'Client Code': 'CLI002',
    'Name': 'Jane Smith',
    'Email': 'jane.smith@company.com',
    'Mobile': '8765432109',
    'DOB': '22-05-1985',
    'PAN No': 'FGHIJ5678K',
    'Aadhaar No': '234567890123',
    'Address': '456 Oak Ave',
    'City': 'Delhi',
    'Pincode': '110001',
    'Branch': 'Delhi Branch',
    'Reference Code': 'CLI001',
    'Opening Investment': '75000'
  },
  {
    'Client Code': 'CLI003',
    'Name': 'Bob Johnson',
    'Email': '',
    'Mobile': '7654321098',
    'DOB': '10-12-1992',
    'PAN No': 'KLMNO9012P',
    'Aadhaar No': '345678901234',
    'Address': '789 Pine Rd',
    'City': 'Bangalore',
    'Pincode': '560001',
    'Branch': 'Bangalore Branch',
    'Reference Code': '',
    'Opening Investment': '25000'
  },
  {
    'Client Code': 'CLI004',
    'Name': 'Alice Brown',
    'Email': 'alice.brown@email.com',
    'Mobile': '',
    'DOB': '05-08-1988',
    'PAN No': 'QRSTU3456V',
    'Aadhaar No': '456789012345',
    'Address': '321 Elm St',
    'City': 'Chennai',
    'Pincode': '600001',
    'Branch': 'Chennai Branch',
    'Reference Code': 'CLI002',
    'Opening Investment': '100000'
  },
  {
    'Client Code': 'CLI005',
    'Name': 'Charlie Wilson',
    'Email': 'charlie@domain.org',
    'Mobile': '6543210987',
    'DOB': '18-03-1995',
    'PAN No': 'WXYZ7890A',
    'Aadhaar No': '567890123456',
    'Address': '654 Maple Dr',
    'City': 'Pune',
    'Pincode': '411001',
    'Branch': 'Pune Branch',
    'Reference Code': '',
    'Opening Investment': '30000'
  }
];

// Create workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(sampleData);

// Add the worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Client Upload Template');

// Write the file
XLSX.writeFile(wb, 'client_upload_template.xlsx');

console.log('Excel template created: client_upload_template.xlsx');