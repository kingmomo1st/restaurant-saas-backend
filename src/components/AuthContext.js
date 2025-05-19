import { createContext, useContext, useState, useEffect } from "react";
import {auth, signInWithEmailAndPassword,createUserWithEmailAndPassword, signOut, firestore} from "../firebase";
import { onAuthStateChanged, setPersistence, browserSessionPersistence} from "firebase/auth";
import {doc, setDoc, serverTimestamp} from "firebase/firestore";


const AuthContext= createContext();

export function AuthProvider({children}){
    const [user, setUser]= useState(null);
    const [loading, setLoading]= useState(true);
    const [isAdmin, setIsAdmin]= useState(false);



const updateUserWithClaims= async (firebaseUser)=> {
    if (firebaseUser){

        try {
            //Force refresh of the token
            await firebaseUser.getIdTokenResult(true);
            const idTokenResult= await firebaseUser.getIdTokenResult();

            console.log("User claims:", idTokenResult.claims);
            
            const adminStatus= !!idTokenResult.claims.admin;

            setIsAdmin(adminStatus);
            setUser({...firebaseUser, claims: idTokenResult.claims});

        } catch (error) {
            console.error("Error fetching user claims:", error)
            setIsAdmin(false);
            setUser(firebaseUser);   
        }
    } else{
        setUser(null);
        setIsAdmin(false);
    }

    setLoading(false);

    };


    useEffect(()=>{

        setPersistence(auth, browserSessionPersistence)
        .catch((error)=>{
            console.log("Error setting persistence:", error)
        });

        const unsubscribe= onAuthStateChanged(auth, (firebaseUser)=>{
            console.log("Firebase User State:", firebaseUser)
            updateUserWithClaims(firebaseUser)
        });

        return ()=> unsubscribe();
        }, []);


    useEffect(()=>{
        console.log("AuthContext Updated -> User:", user, "Loading:", loading);
    },[user,loading]);

    

    const login= async(email, password)=>{
        setLoading(true)
        try {
            await setPersistence(auth,browserSessionPersistence);
            const userCredential= await signInWithEmailAndPassword(auth,email,password);
            console.log("Login successful:", userCredential.user)
            await updateUserWithClaims(userCredential.user);
            

        } catch (error) {
            console.log('Login Error:', error)
            throw error;
            
        } finally {
            setLoading(false)
        }    
    };


    const register= async(email,password)=>{
        setLoading(true)
        try {
            const userCredential= await createUserWithEmailAndPassword(auth,email,password);
            console.log("Registration Successful:", userCredential.user)

            const newUserDoc= {
                uid: userCredential.user.uid,
                email:email,
                points:0,
                purchaseHistory: [],
                createdAt: serverTimestamp(),
            };
            await setDoc(doc(firestore, "users", userCredential.user.uid), newUserDoc);
            await updateUserWithClaims(userCredential.user);

            return userCredential;
            
            
        } catch (error) {
            console.log("Registration Error:", error)
            throw error;
            
        }finally {
            setLoading(false)
        }
        
    };

    const logout= async ()=>{
       setLoading(true)
       
       try {
        await signOut(auth)
        setUser(null)
        console.log("User logged out")
        
       } catch (error) {
        console.log("Logout Error:", error)
        throw error;
        
       }finally{
        setLoading(false)
       }
       
    };
    
    return(
        <AuthContext.Provider value={{ user,isAdmin,login, register,logout, loading}}>
            {!loading ? children:<p> Loading authentication...</p>}
        </AuthContext.Provider>
    );
}

export function useAuth(){
    return useContext(AuthContext);
}