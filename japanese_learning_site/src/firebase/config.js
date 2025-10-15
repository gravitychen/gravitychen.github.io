import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD3eNw4DqIunj5E_FQi-ZWDE_01w8Evgyw",
  authDomain: "japanese-learning-sync.firebaseapp.com",
  projectId: "japanese-learning-sync",
  storageBucket: "japanese-learning-sync.firebasestorage.app",
  messagingSenderId: "346775181745",
  appId: "1:346775181745:web:8528fbdd5375aae8de4590",
  measurementId: "G-TBCLYWLS74"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 初始化服务
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
