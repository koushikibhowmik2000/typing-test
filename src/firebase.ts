import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Create or update user profile
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        streak: 0,
        maxStreak: 0,
        lastTestDate: null
      });
    }
    
    return user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

export const getUserProfile = (uid: string, callback: (profile: any) => void) => {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    }
  });
};

export const saveTestResult = async (uid: string, result: any) => {
  try {
    // Save the result
    await addDoc(collection(db, 'testResults'), {
      ...result,
      uid,
      timestamp: serverTimestamp()
    });

    // Update streak
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const today = new Date().toISOString().split('T')[0];
      const lastDate = userData.lastTestDate;
      
      let newStreak = userData.streak || 0;
      
      if (!lastDate) {
        newStreak = 1;
      } else {
        const last = new Date(lastDate);
        const current = new Date(today);
        const diffTime = Math.abs(current.getTime() - last.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
        // if diffDays === 0, streak stays same
      }

      await updateDoc(userRef, {
        lastTestDate: today,
        streak: newStreak,
        maxStreak: Math.max(newStreak, userData.maxStreak || 0)
      });
    }
  } catch (error) {
    console.error("Error saving test result:", error);
    throw error;
  }
};

export const getUserResults = (uid: string, callback: (results: any[]) => void) => {
  const q = query(
    collection(db, 'testResults'),
    where('uid', '==', uid),
    orderBy('timestamp', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(results);
  });
};
