require('dotenv').config();
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');
const { Worker } = require('node:worker_threads');
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { Agent, User, Account, Lob, Carrier, Policy, ScheduledMessage } = require('./models');
const app = express();
app.use(express.json());
const upload = multer({ storage:multer.memoryStorage(), limits:{fileSize:20*1024*1024}, fileFilter:(_r,f,cb)=>cb(null,/\.(xlsx|csv)$/i.test(f.originalname)) });
function parseFile(buffer, filename) {
 const file = path.join(os.tmpdir(), 'policy-' + process.pid + '-' + Date.now() + path.extname(filename));
 return fs.writeFile(file, buffer).then(() => new Promise((resolve,reject) => {
  const worker = new Worker(path.join(__dirname,'import-worker.js'), {workerData:{path:file}});
  worker.once('message', m => m.error ? reject(new Error(m.error)) : resolve(m.records));
  worker.once('error', reject);
  worker.once('exit', code => { if(code) reject(new Error('Worker exited: '+code)); });
 })).finally(() => fs.unlink(file).catch(()=>{}));
}
async function upsert(Model, key, data) { return Model.findOneAndUpdate(key, {$set:data}, {upsert:true,new:true,setDefaultsOnInsert:true}); }
async function importRow(r) {
 const agent = r.agentName ? await upsert(Agent,{agentName:r.agentName},{agentName:r.agentName}) : null;
 const account = r.accountName ? await upsert(Account,{accountName:r.accountName},{accountName:r.accountName}) : null;
 const lob = r.categoryName ? await upsert(Lob,{categoryName:r.categoryName},{categoryName:r.categoryName}) : null;
 const carrier = r.companyName ? await upsert(Carrier,{companyName:r.companyName},{companyName:r.companyName}) : null;
 const user = await upsert(User,r.email ? {email:r.email} : {firstName:r.firstName},{...Object.fromEntries(Object.entries(r).filter(([k])=>['firstName','dob','address','phoneNumber','state','zipCode','email','gender','userType'].includes(k))),...(agent?{agentId:agent._id}:{}),...(account?{accountId:account._id}:{})});
 if(r.policyNumber) await upsert(Policy,{policyNumber:String(r.policyNumber)},{policyNumber:String(r.policyNumber),policyStartDate:r.policyStartDate,policyEndDate:r.policyEndDate,...(lob?{policyCategoryId:lob._id}:{}),...(carrier?{companyId:carrier._id}:{}),userId:user._id});
}
app.get('/health',(_req,res)=>res.json({status:'ok'}));
app.post('/api/upload',upload.single('file'),async(req,res,next)=>{try{if(!req.file)return res.status(400).json({error:'Send .xlsx or .csv as multipart field "file".'});const records=await parseFile(req.file.buffer,req.file.originalname);for(const row of records)await importRow(row);res.status(201).json({imported:records.length});}catch(e){next(e);}});
app.get('/api/policies/search',async(req,res,next)=>{try{const username=String(req.query.username||'').trim();if(!username)return res.status(400).json({error:'username is required'});const users=await User.find({firstName:new RegExp('^'+username.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$','i')});const policies=await Policy.find({userId:{$in:users.map(u=>u._id)}}).populate('policyCategoryId').populate('companyId').populate('userId');res.json({username,count:policies.length,policies});}catch(e){next(e);}});
app.get('/api/policies/by-user',async(_req,res,next)=>{try{res.json(await Policy.aggregate([{$group:{_id:'$userId',policyCount:{$sum:1},policies:{$push:'$$ROOT'}}},{$lookup:{from:'users',localField:'_id',foreignField:'_id',as:'user'}},{$unwind:{path:'$user',preserveNullAndEmptyArrays:true}},{$project:{_id:0,user:1,policyCount:1,policies:1}}]));}catch(e){next(e);}});
app.post('/api/messages',async(req,res,next)=>{try{const {message,day,time}=req.body||{};if(typeof message!=='string'||!message.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(day||'')||!/^\d{2}:\d{2}$/.test(time||''))return res.status(400).json({error:'message, day (YYYY-MM-DD), and time (HH:mm) are required'});const scheduledAt=new Date(day+'T'+time+':00');if(Number.isNaN(scheduledAt.getTime()))return res.status(400).json({error:'Invalid date/time'});res.status(201).json(await ScheduledMessage.create({message:message.trim(),scheduledAt}));}catch(e){next(e);}});
// A persisted due-message queue; deliveredAt records when the requested time arrived.
setInterval(async()=>{if(mongoose.connection.readyState===1)try{await ScheduledMessage.updateMany({scheduledAt:{$lte:new Date()},deliveredAt:null},{$set:{deliveredAt:new Date()}});}catch(e){console.error(e.message);}},1000).unref();
// Exit on sustained threshold sample; PM2/systemd/container restart policy performs restart.
let previous=os.cpus().map(c=>({...c.times}));
setInterval(()=>{let idle=0,total=0;os.cpus().forEach((cpu,i)=>{const old=previous[i],now=cpu.times;const di=now.idle-old.idle,dt=Object.keys(now).reduce((n,k)=>n+now[k]-old[k],0);idle+=di;total+=dt;previous[i]={...now};});const percent=total?100*(1-idle/total):0;if(percent>=Number(process.env.CPU_LIMIT_PERCENT||70)){console.error('CPU '+percent.toFixed(1)+'% exceeded limit; exiting for supervisor restart');process.exit(1);}},Number(process.env.CPU_CHECK_INTERVAL_MS||5000)).unref();
app.use((err,_req,res,_next)=>{console.error(err);res.status(err instanceof multer.MulterError?400:500).json({error:err.message||'Internal error'});});
const port=Number(process.env.PORT||3000); mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/policy_assessment').then(()=>app.listen(port,()=>console.log('Listening on '+port))).catch(e=>{console.error(e);process.exit(1);});

