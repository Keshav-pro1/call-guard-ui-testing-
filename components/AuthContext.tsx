
import React, { useContext, useState, useEffect, createContext, ReactNode } from "react";
import { auth, db } from "../services/firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

interface UserProfile {
    name?: string;
    phone?: string;
    branches?: string[];
    email?: string;
}

interface AuthContextType {
    currentUser: User | null;
    userProfile: UserProfile | null;
    selectedRegion: string | null;
    setSelectedRegion: (region: string) => void;
    signup: (email: string, password: string, name: string, phone: string, branches: string[]) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    googleLogin: () => Promise<User>;
    logout: () => Promise<void>;
    updateUserProfile: (uid: string, data: UserProfile) => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    async function signup(email: string, password: string, name: string, phone: string, branches: string[]) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user profile in Firestore
        const profileData = {
            name,
            phone,
            branches,
            email
        };
        await setDoc(doc(db, "users", user.uid), profileData);
        setUserProfile(profileData);

        // Set default region
        if (branches && branches.length > 0) {
            setSelectedRegion(branches[0]);
        }
    }

    function login(email: string, password: string) {
        return signInWithEmailAndPassword(auth, email, password)
            .then(() => Promise.resolve());
    }

    async function googleLogin(): Promise<User> {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        return result.user;
    }

    async function updateUserProfile(uid: string, data: UserProfile) {
        // Merge with existing or create new
        await setDoc(doc(db, "users", uid), data, { merge: true });
        setUserProfile(prev => ({ ...prev, ...data }));

        if (data.branches && data.branches.length > 0 && !selectedRegion) {
            setSelectedRegion(data.branches[0]);
        }
    }

    function logout() {
        setUserProfile(null);
        setSelectedRegion(null);
        return signOut(auth);
    }

    // Fetch user profile whenever auth state changes to a logged-in user
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    const docRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data() as UserProfile;
                        setUserProfile(data);
                        // Set default region if not already set
                        if (data.branches && data.branches.length > 0) {
                            setSelectedRegion(prev => prev || data.branches![0]);
                        }
                    } else {
                        console.log("No user profile found in Firestore");
                        setUserProfile(null);
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                }
            } else {
                setUserProfile(null);
                setSelectedRegion(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userProfile,
        selectedRegion,
        setSelectedRegion,
        signup,
        login,
        googleLogin,
        logout,
        updateUserProfile,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
