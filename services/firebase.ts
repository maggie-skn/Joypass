// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5gpoOrMqUfgQIDNwInFRw4HKsNGugmWA",
  authDomain: "joypass-fe213.firebaseapp.com",
  projectId: "joypass-fe213",
  storageBucket: "joypass-fe213.firebasestorage.app",
  messagingSenderId: "229095181914",
  appId: "1:229095181914:web:396a67a4047d92dc0a9263"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

// 集合參考 (Collection reference)
export const WISHES_COLLECTION = 'wishes';

// 服務功能：與 Firestore 互動
export const wishService = {
  // 訂閱即時更新
  subscribe: (callback: (items: any[]) => void) => {
    // 預設以 createdAt 降序排列
    const q = query(collection(db, WISHES_COLLECTION), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(items);
    });
  },

  // 新增一個願望
  add: async (item: any) => {
    // Firestore 會自動生成 ID
    await addDoc(collection(db, WISHES_COLLECTION), item);
  },

  // 更新一個願望
  update: async (id: string, data: any) => {
    const docRef = doc(db, WISHES_COLLECTION, id);
    await updateDoc(docRef, data);
  },

  // 刪除一個願望
  delete: async (id: string) => {
    const docRef = doc(db, WISHES_COLLECTION, id);
    await deleteDoc(docRef);
  },
  
  // 批量更新，用於排序 (假設 App.tsx 中有用到)
  batchUpdateOrder: async (updates: {id: string, order: number}[]) => {
    for (const update of updates) {
      const docRef = doc(db, WISHES_COLLECTION, update.id);
      await updateDoc(docRef, { order: update.order });
    }
  }
};