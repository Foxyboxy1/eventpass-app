import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, doc, getDoc, setDoc, 
  collection, getDocs, addDoc 
} from 'firebase/firestore';
import { firebaseConfig } from '../firebaseConfig';

let dbFirestore = null;

try {
  if (firebaseConfig && firebaseConfig.projectId) {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    dbFirestore = getFirestore(app);
    console.log('[Cloud DB] Firebase Firestore connected successfully to project:', firebaseConfig.projectId);
  }
} catch (e) {
  console.warn('[Cloud DB] Firebase initialization error:', e);
}

export const isFirebaseActive = () => Boolean(dbFirestore);

// 1. Lookup a student by ID
export async function lookupStudent(studentId) {
  const cleanId = String(studentId || '').trim();
  if (!cleanId) return { found: false };

  if (dbFirestore) {
    try {
      const docRef = doc(dbFirestore, 'students', cleanId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { found: true, student: snap.data() };
      }
      return { found: false };
    } catch (err) {
      console.error('[Firebase Lookup Error]', err);
    }
  }

  // Fallback to local /api
  try {
    const res = await fetch(`/api/lookup/${encodeURIComponent(cleanId)}`);
    return await res.json();
  } catch (err) {
    console.error('[API Lookup Error]', err);
    return { found: false };
  }
}

// 2. Submit Order with Referral
export async function submitOrderWithReferral(orderData) {
  const { customerId, customerName, customerPhone, orderItem, hostId, hostNameIfNew, staffName } = orderData;
  const cleanCustomerId = String(customerId).trim();
  const cleanHostId = String(hostId).trim();

  if (dbFirestore) {
    // 1. Check if customer already claimed guest discount
    const custRef = doc(dbFirestore, 'students', cleanCustomerId);
    const custSnap = await getDoc(custRef);
    if (custSnap.exists() && custSnap.data().guestDiscountClaimed) {
      const prev = custSnap.data();
      throw new Error(`⚠️ الطالب (${prev.name}) استفاد بالفعل من خصم الـ 10% سابقاً كمدعو من (${prev.claimedUnderHostName || prev.claimedUnderHostId})! لا يمكن أخذ الخصم كضيف مرة أخرى.`);
    }

    // 2. Check Host
    const hostRef = doc(dbFirestore, 'students', cleanHostId);
    const hostSnap = await getDoc(hostRef);
    let host = hostSnap.exists() ? hostSnap.data() : {
      id: cleanHostId,
      name: hostNameIfNew?.trim() || `صاحب عزومة (${cleanHostId})`,
      phone: '',
      isHost: true,
      guestDiscountClaimed: false,
      referralsCount: 0,
      referralsList: [],
      freeDrinksEarned: 0,
      freeDrinksClaimed: 0,
      registeredAt: new Date().toISOString()
    };

    const now = new Date().toISOString();
    const customerObj = {
      id: cleanCustomerId,
      name: customerName.trim(),
      phone: customerPhone.trim(),
      isHost: custSnap.exists() ? (custSnap.data().isHost || false) : false,
      guestDiscountClaimed: true,
      claimedUnderHostId: cleanHostId,
      claimedUnderHostName: host.name,
      claimedAt: now,
      registeredAt: custSnap.exists() ? custSnap.data().registeredAt : now
    };

    // Update Host referrals
    if (!host.referralsList) host.referralsList = [];
    host.referralsList.push({
      customerId: cleanCustomerId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      orderItem,
      orderedAt: now
    });
    host.referralsCount = host.referralsList.length;
    host.isHost = true;
    host.freeDrinksEarned = host.referralsCount >= 5 ? 1 : 0; // Max 1 free drink

    // Save Customer and Host to Firestore
    await setDoc(custRef, customerObj, { merge: true });
    await setDoc(hostRef, host, { merge: true });

    // Save Order Log
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const orderRecord = {
      orderId,
      customerId: cleanCustomerId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      orderItem,
      discountApplied: "10%",
      hostId: cleanHostId,
      hostName: host.name,
      orderedAt: now,
      staffName: staffName || 'كاشير'
    };
    await addDoc(collection(dbFirestore, 'orders'), orderRecord);

    const justUnlocked = host.referralsCount === 5 && host.freeDrinksClaimed === 0;

    return {
      success: true,
      message: `تم تسجيل أوردر ${customerName} بنجاح بخصم 10%!`,
      order: orderRecord,
      hostProgress: {
        hostId: cleanHostId,
        hostName: host.name,
        currentCount: host.referralsCount,
        targetCount: 5,
        freeDrinksEarned: host.freeDrinksEarned,
        freeDrinksClaimed: host.freeDrinksClaimed,
        unclaimedDrinks: Math.max(0, host.freeDrinksEarned - host.freeDrinksClaimed),
        justUnlockedFreeDrink: justUnlocked
      }
    };
  }

  // Fallback to local /api
  const res = await fetch('/api/order-with-referral', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'حدث خطأ في التسجيل');
  return data;
}

// 3. Redeem Free Drink
export async function redeemFreeDrink(hostId) {
  const cleanHostId = String(hostId).trim();

  if (dbFirestore) {
    const hostRef = doc(dbFirestore, 'students', cleanHostId);
    const hostSnap = await getDoc(hostRef);
    if (!hostSnap.exists()) throw new Error('صاحب العزومة غير مسجل');

    const host = hostSnap.data();
    if ((host.freeDrinksClaimed || 0) >= 1) {
      throw new Error('⚠️ تم صرف المشروب المجاني لهذا المُضيف مسبقاً (الحد الأقصى للعرض: مشروب واحد فقط)');
    }
    if ((host.referralsCount || 0) < 5) {
      throw new Error('لم يكتمل الـ 5 أصدقاء المطلوبين بعد (الحالي: ' + (host.referralsCount || 0) + ' من 5)');
    }

    host.freeDrinksClaimed = 1;
    await setDoc(hostRef, host, { merge: true });

    return {
      success: true,
      message: `تم صرف المشروب المجاني لـ (${host.name}) بنجاح! 🥤 (استوفى العرض بالكامل)`
    };
  }

  const res = await fetch('/api/redeem-free-drink', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostId: cleanHostId, staffName: 'كاشير' })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'تعذر الصرف');
  return data;
}

// 4. Fetch Stats & Hosts list
export async function fetchStats() {
  if (dbFirestore) {
    try {
      const snap = await getDocs(collection(dbFirestore, 'students'));
      const allStudents = snap.docs.map(d => d.data());
      const hosts = allStudents
        .filter(s => s.isHost && s.referralsCount > 0)
        .sort((a, b) => b.referralsCount - a.referralsCount);

      return {
        totalStudents: allStudents.length,
        totalOrders: allStudents.reduce((acc, s) => acc + (s.referralsCount || 0), 0),
        totalFreeDrinksEarned: allStudents.filter(s => (s.freeDrinksEarned || 0) > 0).length,
        totalFreeDrinksClaimed: allStudents.filter(s => (s.freeDrinksClaimed || 0) > 0).length,
        totalDiscountsGiven: allStudents.filter(s => s.guestDiscountClaimed).length,
        hosts,
        isCloud: true
      };
    } catch (e) {
      console.error(e);
    }
  }

  const res = await fetch('/api/stats');
  return await res.json();
}

// 5. Fetch Records / Search
export async function fetchRecords(query = '') {
  const cleanQ = query.trim().toLowerCase();

  if (dbFirestore) {
    try {
      const snap = await getDocs(collection(dbFirestore, 'students'));
      let list = snap.docs.map(d => d.data());
      if (cleanQ) {
        list = list.filter(item => 
          item.id?.toLowerCase().includes(cleanQ) || 
          item.name?.toLowerCase().includes(cleanQ) || 
          item.phone?.toLowerCase().includes(cleanQ)
        );
      }
      list.sort((a, b) => (b.referralsCount || 0) - (a.referralsCount || 0));
      return { total: list.length, records: list };
    } catch (e) {
      console.error(e);
    }
  }

  const res = await fetch(`/api/records?search=${encodeURIComponent(cleanQ)}`);
  return await res.json();
}

// 6. Direct Client-side CSV Download (Works anywhere on Vercel without backend!)
export async function exportCsvClientSide() {
  let list = [];
  if (dbFirestore) {
    const snap = await getDocs(collection(dbFirestore, 'students'));
    list = snap.docs.map(d => d.data());
  } else {
    const res = await fetch('/api/records');
    const data = await res.json();
    list = data.records || [];
  }

  list.sort((a, b) => new Date(a.registeredAt || 0) - new Date(b.registeredAt || 0));

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

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `eventpass_crm_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
