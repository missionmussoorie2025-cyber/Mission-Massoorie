import { useEffect, useRef, useState } from 'react';
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  doc, 
  setDoc, 
  onSnapshot, 
  FirebaseUser,
  handleFirestoreError,
  OperationType 
} from './firebase';
import { AppState } from '../types';

export function useFirebaseSync(
  state: AppState,
  setState: React.Dispatch<React.SetStateAction<AppState>>,
  isLoaded: boolean
) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const isRemoteUpdateRef = useRef(false);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Listen for Auth State changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-Time Remote Firestore Listener (Pull changes live from other devices)
  useEffect(() => {
    if (!isAuthReady || !currentUser || !isLoaded) return;

    const progressDocRef = doc(db, 'users', currentUser.uid, 'data', 'progress');

    const unsubscribeSnapshot = onSnapshot(
      progressDocRef,
      (docSnap) => {
        // Skip local write echoes to prevent reverting unchecked topics
        if (docSnap.metadata.hasPendingWrites) {
          return;
        }

        if (docSnap.exists()) {
          const remoteData = docSnap.data();
          isRemoteUpdateRef.current = true;

          setState((prev) => ({
            ...prev,
            x: remoteData.x !== undefined ? remoteData.x : prev.x,
            d: remoteData.d !== undefined ? remoteData.d : prev.d,
            r: remoteData.r !== undefined ? remoteData.r : prev.r,
            starred: remoteData.starred !== undefined ? remoteData.starred : prev.starred,
            notes: remoteData.notes !== undefined ? remoteData.notes : prev.notes,
            topicMinutes: remoteData.topicMinutes !== undefined ? remoteData.topicMinutes : prev.topicMinutes,
            mockScores: remoteData.mockScores !== undefined ? remoteData.mockScores : prev.mockScores,
            studySessions: remoteData.studySessions !== undefined ? remoteData.studySessions : prev.studySessions,
            targetsConfig: remoteData.targetsConfig !== undefined ? remoteData.targetsConfig : prev.targetsConfig,
            dailyTargets: remoteData.dailyTargets !== undefined ? remoteData.dailyTargets : prev.dailyTargets,
            userProfile: remoteData.userProfile !== undefined ? remoteData.userProfile : prev.userProfile
          }));

          setLastSyncTime(new Date().toLocaleTimeString());
          setTimeout(() => {
            isRemoteUpdateRef.current = false;
          }, 300);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}/data/progress`);
      }
    );

    return () => unsubscribeSnapshot();
  }, [isAuthReady, currentUser, isLoaded]);

  // 3. Debounced Outgoing Sync to Firestore (Push local changes live to cloud)
  useEffect(() => {
    if (!isAuthReady || !currentUser || !isLoaded) return;
    if (isRemoteUpdateRef.current) return;

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        const progressDocRef = doc(db, 'users', currentUser.uid, 'data', 'progress');
        const profileDocRef = doc(db, 'users', currentUser.uid);

        const progressPayload = {
          userId: currentUser.uid,
          updatedAt: new Date().toISOString(),
          x: state.x || {},
          d: state.d || {},
          r: state.r || {},
          starred: state.starred || {},
          notes: state.notes || {},
          topicMinutes: state.topicMinutes || {},
          mockScores: state.mockScores || {},
          studySessions: state.studySessions || [],
          targetsConfig: state.targetsConfig || {},
          dailyTargets: state.dailyTargets || null,
          userProfile: state.userProfile || null
        };

        const profilePayload = {
          userId: currentUser.uid,
          fullName: state.userProfile?.fullName || currentUser.displayName || 'Aspirant',
          username: state.userProfile?.username || 'aspirant_2027',
          aspirantId: state.userProfile?.aspirantId || 'MM-2027',
          email: currentUser.email || '',
          updatedAt: new Date().toISOString()
        };

        // Overwrite full document (without merge: true) so unchecking/deleting keys updates Firestore cleanly
        await setDoc(progressDocRef, progressPayload);
        await setDoc(profileDocRef, profilePayload, { merge: true });

        setLastSyncTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Failed to push live update to Firestore', err);
      } finally {
        setIsSyncing(false);
      }
    }, 500);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [state, isAuthReady, currentUser, isLoaded]);

  return {
    currentUser,
    isAuthReady,
    isSyncing,
    lastSyncTime
  };
}
