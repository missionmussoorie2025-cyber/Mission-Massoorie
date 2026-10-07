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

  const lastReceivedPayloadRef = useRef<string>('');
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to extract cloud progress payload
  const createProgressPayload = (s: AppState, uid: string) => {
    return {
      userId: uid,
      updatedAt: s.d ? Object.values(s.d).sort().pop() || new Date().toISOString() : new Date().toISOString(),
      x: s.x || {},
      d: s.d || {},
      r: s.r || {},
      starred: s.starred || {},
      notes: s.notes || {},
      topicMinutes: s.topicMinutes || {},
      mockScores: s.mockScores || {},
      studySessions: s.studySessions || [],
      targetsConfig: s.targetsConfig || {},
      dailyTargets: s.dailyTargets || null,
      userProfile: s.userProfile || null
    };
  };

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

          const remotePayload = {
            userId: currentUser.uid,
            updatedAt: remoteData.updatedAt || '',
            x: remoteData.x || {},
            d: remoteData.d || {},
            r: remoteData.r || {},
            starred: remoteData.starred || {},
            notes: remoteData.notes || {},
            topicMinutes: remoteData.topicMinutes || {},
            mockScores: remoteData.mockScores || {},
            studySessions: remoteData.studySessions || [],
            targetsConfig: remoteData.targetsConfig || {},
            dailyTargets: remoteData.dailyTargets || null,
            userProfile: remoteData.userProfile || null
          };

          const remotePayloadStr = JSON.stringify(remotePayload);
          lastReceivedPayloadRef.current = remotePayloadStr;

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

    const progressPayload = createProgressPayload(state, currentUser.uid);
    const currentPayloadStr = JSON.stringify(progressPayload);

    // If state matches what we just received from Firestore, skip pushing it back
    if (currentPayloadStr === lastReceivedPayloadRef.current) {
      return;
    }

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        const progressDocRef = doc(db, 'users', currentUser.uid, 'data', 'progress');
        const profileDocRef = doc(db, 'users', currentUser.uid);

        const profilePayload = {
          userId: currentUser.uid,
          fullName: state.userProfile?.fullName || currentUser.displayName || 'Aspirant',
          username: state.userProfile?.username || 'aspirant_2027',
          aspirantId: state.userProfile?.aspirantId || 'MM-2027',
          email: currentUser.email || '',
          updatedAt: new Date().toISOString()
        };

        // Update signature before network call to prevent echoing
        lastReceivedPayloadRef.current = currentPayloadStr;

        // Overwrite full document (without merge) so deleted/unchecked keys are removed from Firestore
        await setDoc(progressDocRef, progressPayload);
        await setDoc(profileDocRef, profilePayload, { merge: true });

        setLastSyncTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Failed to push live update to Firestore', err);
      } finally {
        setIsSyncing(false);
      }
    }, 400);

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
