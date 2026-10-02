const { parentPort, workerData } = require('node:worker_threads');
const XLSX = require('xlsx');
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const aliases = {
 agentName:['agentname','agent'], firstName:['firstname','user','username'], dob:['dob','dateofbirth'], address:['address'], phoneNumber:['phonenumber','phone'], state:['state'], zipCode:['zipcode','zip','postalcode'], email:['email'], gender:['gender'], userType:['usertype'], accountName:['accountname','account'], categoryName:['categoryname','category_name','policycategory','lob'], companyName:['companyname','company_name','policycarrier','carrier'], policyNumber:['policynumber'], policyStartDate:['policystartdate','startdate'], policyEndDate:['policyenddate','enddate']
};
try {
 const book = XLSX.readFile(workerData.path, { cellDates:true });
 const rows = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { defval:null });
 const records = rows.map((row, index) => {
  const keys = new Map(Object.entries(row).map(([k,v]) => [norm(k),v]));
  const out = {};
  for (const [field,names] of Object.entries(aliases)) {
   const value = names.map(norm).map(k => keys.get(k)).find(v => v !== undefined && v !== null && String(v).trim());
   if (value !== undefined) out[field] = value;
  }
  for (const field of ['dob','policyStartDate','policyEndDate']) if (out[field] != null) { const d = new Date(out[field]); if (!Number.isNaN(d.getTime())) out[field] = d; else delete out[field]; }
  if (!out.firstName && !out.email && !out.policyNumber) throw new Error('Row ' + (index+2) + ': missing user identity and policy number');
  return out;
 });
 parentPort.postMessage({records});
} catch (e) { parentPort.postMessage({error:e.message}); }
