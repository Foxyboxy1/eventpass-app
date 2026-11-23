import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database storage directory
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'event_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-Memory Database Structure
let db = {
  settings: {
    eventName: "إيفنت الجامعة - نظام العروض والعزومة",
    venueName: "المكان",
    targetReferralsForDrink: 5, // 5 friends needed for 1 free drink
    maxFreeDrinksPerHost: 1,    // Maximum 1 free drink per host to prevent abuse
    discountValue: "10%",
    adminPin: "1234"
  },
  students: {},
  orders: []
};

// Load existing DB
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      const loaded = JSON.parse(data);
      db = {
        settings: { ...db.settings, ...(loaded.settings || {}) },
        students: loaded.students || {},
        orders: loaded.orders || []
      };
      // Clean up any legacy hardcoded entries
      delete db.students["202304499"];
      console.log(`[DB] Database loaded: ${Object.keys(db.students).length} students, ${db.orders.length} orders.`);
    } else {
      saveDatabase();
      console.log('[DB] Created clean database file.');
    }
  } catch (err) {
    console.error('[DB] Error loading database:', err);
  }
}

function saveDatabase() {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[DB] Error saving database:', err);
  }
}

loadDatabase();

function getLocalNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// 1. Lookup Student or Host by ID
app.get('/api/lookup/:studentId', (req, res) => {
  const studentId = String(req.params.studentId || '').trim();
  if (!studentId) {
    return res.status(400).json({ error: 'يرجى إدخال رقم الـ ID' });
  }

  const student = db.students[studentId];
  if (student) {
    return res.json({
      found: true,
      student
    });
  }

  return res.json({
    found: false
  });
});

// 2. Submit an Order with Host Referral
app.post('/api/order-with-referral', (req, res) => {
  const { 
    customerId, 
    customerName, 
    customerPhone, 
    orderItem = 'مشروب', 
    hostId,
    hostNameIfNew,
    hostPhoneIfNew,
    staffName = 'كاشير'
  } = req.body;

  const cleanCustomerId = String(customerId || '').trim();
  const cleanCustomerName = String(customerName || '').trim();
  const cleanCustomerPhone = String(customerPhone || '').trim();
  const cleanHostId = String(hostId || '').trim();

  // Basic validations
  if (!cleanCustomerId) {
    return res.status(400).json({ error: 'يرجى إدخال رقم ID الطالب المشتري' });
  }
  if (!cleanCustomerName) {
    return res.status(400).json({ error: 'يرجى إدخال اسم الطالب المشتري لحفظ الداتا' });
  }
  if (!cleanCustomerPhone) {
    return res.status(400).json({ error: 'يرجى إدخال رقم موبايل الطالب المشتري' });
  }
  if (!cleanHostId) {
    return res.status(400).json({ error: 'يرجى إدخال ID صاحب العزومة (المُضيف)' });
  }

  // Prevent self-referral
  if (cleanCustomerId === cleanHostId) {
    return res.status(400).json({ error: 'لا يمكن للشخص الطلب على الـ ID الخاص به للاستفادة من خصم العزومة!' });
  }

  // Rule 1: Single Guest Discount Rule
  // Has this student already received a 10% referral discount under ANY host?
  let customer = db.students[cleanCustomerId];
  if (customer && customer.guestDiscountClaimed) {
    return res.status(409).json({
      error: `⚠️ الطالب (${customer.name}) استفاد بالفعل من خصم الـ ${db.settings.discountValue} سابقاً كمدعو من (${customer.claimedUnderHostName || customer.claimedUnderHostId})! لا يمكن أخذ الخصم كضيف مرة أخرى.`
    });
  }

  // Rule 2: Host handling
  let host = db.students[cleanHostId];
  if (!host) {
    host = {
      id: cleanHostId,
      name: String(hostNameIfNew || '').trim() || `صاحب عزومة (${cleanHostId})`,
      phone: String(hostPhoneIfNew || '').trim() || '',
      isHost: true,
      guestDiscountClaimed: false,
      claimedUnderHostId: null,
      claimedUnderHostName: null,
      claimedAt: null,
      referralsCount: 0,
      referralsList: [],
      freeDrinksEarned: 0,
      freeDrinksClaimed: 0,
      registeredAt: new Date().toISOString()
    };
    db.students[cleanHostId] = host;
  }

  // Check if customer was already referred by THIS host
  if (host.referralsList && host.referralsList.some(r => r.customerId === cleanCustomerId)) {
    return res.status(409).json({
      error: `⚠️ هذا الطالب مسجل بالفعل تحت نفس صاحب العزومة!`
    });
  }

  // Rule 3: Single Free Drink Max per Host
  // "بحيث ما يجيش صاحب العزومة وياخد فري درينك تاني"
  // Once host has already claimed 1 free drink, flag that they completed the offer
  const maxDrinks = db.settings.maxFreeDrinksPerHost || 1;
  const target = db.settings.targetReferralsForDrink || 5;

  // Save Customer data
  const now = new Date().toISOString();
  if (!customer) {
    customer = {
      id: cleanCustomerId,
      name: cleanCustomerName,
      phone: cleanCustomerPhone,
      isHost: false, // can become host in future!
      guestDiscountClaimed: true,
      claimedUnderHostId: cleanHostId,
      claimedUnderHostName: host.name,
      claimedAt: now,
      referralsCount: 0,
      referralsList: [],
      freeDrinksEarned: 0,
      freeDrinksClaimed: 0,
      registeredAt: now
    };
  } else {
    customer.name = cleanCustomerName;
    customer.phone = cleanCustomerPhone;
    customer.guestDiscountClaimed = true;
    customer.claimedUnderHostId = cleanHostId;
    customer.claimedUnderHostName = host.name;
    customer.claimedAt = now;
  }
  db.students[cleanCustomerId] = customer;

  // Update Host
  if (!host.referralsList) host.referralsList = [];
  host.referralsList.push({
    customerId: cleanCustomerId,
    customerName: cleanCustomerName,
    customerPhone: cleanCustomerPhone,
    orderItem,
    orderedAt: now
  });
  host.referralsCount = host.referralsList.length;
  host.isHost = true;

  // Calculate free drinks earned (capped at maxFreeDrinksPerHost = 1)
  const earnedRaw = Math.floor(host.referralsCount / target);
  host.freeDrinksEarned = Math.min(earnedRaw, maxDrinks);

  db.students[cleanHostId] = host;

  // Order log
  const orderId = `ORD-${Date.now().toString().slice(-6)}`;
  const orderRecord = {
    orderId,
    customerId: cleanCustomerId,
    customerName: cleanCustomerName,
    customerPhone: cleanCustomerPhone,
    orderItem,
    discountApplied: db.settings.discountValue || "10%",
    hostId: cleanHostId,
    hostName: host.name,
    orderedAt: now,
    staffName
  };
  db.orders.unshift(orderRecord);

  saveDatabase();

  const unclaimed = Math.max(0, (host.freeDrinksEarned || 0) - (host.freeDrinksClaimed || 0));
  const justUnlocked = host.referralsCount === target && host.freeDrinksClaimed === 0;

  return res.json({
    success: true,
    message: `تم تسجيل أوردر ${cleanCustomerName} بنجاح بخصم 10%!`,
    order: orderRecord,
    hostProgress: {
      hostId: cleanHostId,
      hostName: host.name,
      currentCount: host.referralsCount,
      targetCount: target,
      freeDrinksEarned: host.freeDrinksEarned,
      freeDrinksClaimed: host.freeDrinksClaimed,
      unclaimedDrinks: unclaimed,
      alreadyMaxedOut: host.freeDrinksClaimed >= maxDrinks,
      justUnlockedFreeDrink: justUnlocked
    }
  });
});

// 3. Redeem Free Drink for a Host
// Ensures maximum 1 free drink per host!
app.post('/api/redeem-free-drink', (req, res) => {
  const { hostId, staffName = 'كاشير' } = req.body;
  const cleanHostId = String(hostId || '').trim();

  const host = db.students[cleanHostId];
  if (!host) {
    return res.status(404).json({ error: 'المُضيف غير موجود في قاعدة البيانات' });
  }

  const maxDrinks = db.settings.maxFreeDrinksPerHost || 1;

  // Check if host already took their 1 free drink!
  if ((host.freeDrinksClaimed || 0) >= maxDrinks) {
    return res.status(400).json({ 
      error: `⚠️ صاحب العزومة (${host.name}) استلم بالفعل المشروب المجاني الخاص به سابقاً! لا يمكن استلام فري درينك مرة أخرى (الحد الأقصى مشروب واحد فقط).` 
    });
  }

  const target = db.settings.targetReferralsForDrink || 5;
  if ((host.referralsCount || 0) < target) {
    return res.status(400).json({ 
      error: `صاحب العزومة (${host.name}) لم يكمل الـ 5 أصدقاء المطلوبين بعد! (الحالي: ${host.referralsCount || 0} من 5)` 
    });
  }

  host.freeDrinksClaimed = (host.freeDrinksClaimed || 0) + 1;
  const now = new Date().toISOString();

  db.orders.unshift({
    orderId: `FREE-${Date.now().toString().slice(-6)}`,
    customerId: cleanHostId,
    customerName: host.name,
    customerPhone: host.phone,
    orderItem: 'مشروب مجاني لصاحب العزومة 🥤 (Free Drink Redeemed)',
    discountApplied: '100% Free',
    hostId: cleanHostId,
    hostName: host.name,
    orderedAt: now,
    staffName
  });

  saveDatabase();

  return res.json({
    success: true,
    message: `تم صرف المشروب المجاني لـ (${host.name}) بنجاح! 🥤 (تم استيفاء العرض بالكامل)`,
    host: {
      id: host.id,
      name: host.name,
      freeDrinksClaimed: host.freeDrinksClaimed,
      remainingUnclaimed: 0
    }
  });
});

// 4. Overall Stats & Host Rankings
app.get('/api/stats', (req, res) => {
  const allStudents = Object.values(db.students || {});
  const totalStudents = allStudents.length;
  const totalOrders = db.orders.length;
  
  const hosts = allStudents
    .filter(s => s.isHost && s.referralsCount > 0)
    .sort((a, b) => b.referralsCount - a.referralsCount);

  const totalFreeDrinksEarned = allStudents.reduce((acc, s) => acc + (s.freeDrinksEarned || 0), 0);
  const totalFreeDrinksClaimed = allStudents.reduce((acc, s) => acc + (s.freeDrinksClaimed || 0), 0);
  const totalDiscountsGiven = allStudents.filter(s => s.guestDiscountClaimed).length;

  return res.json({
    totalStudents,
    totalOrders,
    totalDiscountsGiven,
    totalFreeDrinksEarned,
    totalFreeDrinksClaimed,
    hosts,
    recentOrders: db.orders.slice(0, 15),
    settings: db.settings,
    serverIp: getLocalNetworkIp(),
    port: PORT
  });
});

// 5. Search Students & Host History
app.get('/api/records', (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase();
  let list = Object.values(db.students || {});

  if (search) {
    list = list.filter(item => 
      item.id.toLowerCase().includes(search) || 
      (item.name && item.name.toLowerCase().includes(search)) ||
      (item.phone && item.phone.toLowerCase().includes(search))
    );
  }

  list.sort((a, b) => (b.referralsCount || 0) - (a.referralsCount || 0));

  return res.json({
    total: list.length,
    records: list
  });
});

// 6. Export Full Excel CSV (CRM Data)
app.get('/api/export-csv', (req, res) => {
  const list = Object.values(db.students || {});
  list.sort((a, b) => new Date(a.registeredAt) - new Date(b.registeredAt));

  let csv = '\uFEFFرقم الـ ID,الاسم بالكامل,رقم الموبايل,استفاد من خصم 10% ضيف,اسم العازم (صاحب الدعوة),ID العازم,عدد الأشخاص اللي عزمهم,مشروب مجاني مستحق,مشروب مجاني تم صرفه,تاريخ ووقت التسجيل\n';

  list.forEach(item => {
    const timeFormatted = item.registeredAt ? new Date(item.registeredAt).toLocaleString('ar-EG') : '-';
    const row = [
      `"${item.id}"`,
      `"${item.name || '-'}"`,
      `"${item.phone || '-'}"`,
      `"${item.guestDiscountClaimed ? 'نعم (10%)' : 'لا'}"`,
      `"${item.claimedUnderHostName || '-'}"`,
      `"${item.claimedUnderHostId || '-'}"`,
      `"${item.referralsCount || 0}"`,
      `"${item.freeDrinksEarned || 0}"`,
      `"${item.freeDrinksClaimed || 0}"`,
      `"${timeFormatted}"`
    ];
    csv += row.join(',') + '\n';
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="students_crm_${Date.now()}.csv"`);
  res.send(csv);
});

// 7. Reset DB (Clear for event start)
app.post('/api/reset', (req, res) => {
  const { pin } = req.body;
  if (pin !== db.settings.adminPin) {
    return res.status(403).json({ error: 'رمز الحماية (PIN) غير صحيح!' });
  }

  db.students = {};
  db.orders = [];
  saveDatabase();

  res.json({ success: true, message: 'تم تصفير جميع البيانات بنجاح، قاعدة البيانات جاهزة ونظيفة للبدء!' });
});

// Serve frontend build in production
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`🚀 خادم إيفنت العروض ونظام العزومة يعمل بنجاح!`);
  console.log(`📍 محلياً: http://localhost:${PORT}`);
  console.log(`📱 من الموبايل على شبكة الـ Wi-Fi: http://${getLocalNetworkIp()}:${PORT}`);
  console.log(`===============================================`);
});
