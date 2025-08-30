import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { AddAddressSuccess, AddBookmarkSuccess, AddRecentSuccess, RemoveBoookmarkSuccess, getUserDataSuccess } from "../slices/UserSlice"
import { Auth, db } from "@/firebase/firebase.config";
import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";


export const VerifyUser = async (dispatch) => {
    try {
        console.log("Starting Google authentication...");
        console.log("Auth object:", Auth);
        
        const res = await signInWithPopup(Auth, new GoogleAuthProvider().setCustomParameters({
            prompt: "select_account"
        }));
        
        console.log("Google auth successful:", res);
        const { user } = res;
        
        if (user) {
            console.log("User data:", user);
            console.log("Creating/updating user in Firestore...");
            
            try {
                const check = await getDoc(doc(db, "users", user.uid));
                
                if (!check.exists()) {
                    console.log("Creating new user document...");
                    await setDoc(doc(db, "users", user.uid), { 
                        address: [], 
                        bookmarks: [], 
                        recent: [], 
                        uid: user.uid, 
                        displayName: user.displayName, 
                        phoneNumber: user.phoneNumber, 
                        email: user.email, 
                        photoURL: user.photoURL,
                        interests: [],
                        location: 'Unknown'
                    });
                    dispatch(getUserDataSuccess(user));
                    console.log("New user created successfully");
                } else {
                    console.log("Updating existing user...");
                    await updateDoc(doc(db, "users", user.uid), { 
                        displayName: user.displayName, 
                        email: user.email, 
                        photoURL: user.photoURL 
                    });
                    dispatch(getUserDataSuccess(user));
                    console.log("User updated successfully");
                }
            } catch (firestoreError) {
                console.error("Firestore operation failed:", firestoreError);
                // Still dispatch user data even if Firestore fails
                dispatch(getUserDataSuccess(user));
            }
        }
    } catch (error) {
        console.error("Google authentication error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
    }
}



export const VerifyEmail = async (dispatch, email, password, customToast) => {
    try {
        const res = await signInWithEmailAndPassword(Auth, email, password)
        const { user } = res;
        if (user) {
            dispatch(getUserDataSuccess(user))
            customToast("success", "Logged in successfully", "")
        }
    } catch (error) {
        customToast("error", "something went wrong", error.message)
    }
}


export const CreateUserEmail = async (name, email, password, phone, CustomToast, onClose, dispatch) => {
    try {
        const res = await createUserWithEmailAndPassword(Auth, email, password);
        const { user } = res
        if (user) {
            // Update Firebase Auth profile with display name
            await updateProfile(user, {
                displayName: name
            });
            
            const updatedUser = { ...user, displayName: name, phoneNumber: phone }
            try {
                await setDoc(doc(db, "users", user.uid), { address: [], bookmarks: [], recent: [], uid: user.uid, displayName: name, phoneNumber: phone, email: user.email, photoURL: user.photoURL });
                dispatch(getUserDataSuccess(updatedUser))
                CustomToast("account created successfully", "", "success");
                onClose();

            } catch (error) {
                console.log("update_Error", error)
            }
        }
    } catch (error) {
        CustomToast("something went wrong", error.message, "error");
    }
}

export const getInitalUser = async (id, dispatch) => {
    try {
        const res = await getDoc(doc(db, "users", id));
        dispatch(getUserDataSuccess(res.data()));
        console.log(res.data())
    } catch (error) {
        console.log(error)
    }
}

export const getMobileInitialUser = async (dispatch, user) => {
    const q = query(
        collection(db, "users"),
        where("phoneNumber", "==", user.phoneNumber.substring(3))
    );
    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.size < 1) {
            console.log(querySnapshot.empty());
        } else {
            querySnapshot.forEach((doc) => {
                dispatch(getUserDataSuccess(doc.data()));
            });
        }
    } catch (error) {
        console.log(error);
    }
}


export const AddFavouriteReq = async (id, restraunt, handleBooked, dispatch) => {
    try {
        const res = await getDoc(doc(db, "users", id));
        if (res.exists()) {
            await updateDoc(doc(db, "users", id), { bookmarks: arrayUnion(restraunt) });
            dispatch(AddBookmarkSuccess(restraunt))
            handleBooked()
        }
    } catch (error) {
        console.log(error)
    }
}

export const RemoveFavouriteReq = async (id, restraunt, handleRemoved, dispatch) => {
    try {
        const res = await getDoc(doc(db, "users", id));
        if (res.exists()) {
            await updateDoc(doc(db, "users", id), { bookmarks: arrayRemove(restraunt) });
            dispatch(RemoveBoookmarkSuccess(restraunt))
            handleRemoved();
        }
    } catch (error) {
        console.log(error);
    }
}

export const AddRecentReq = async (id, restraunt, dispatch) => {
    try {
        const res = await getDoc(doc(db, "users", id));
        if (res.exists()) {
            const checkArray = res.data().recent.filter((rest) => rest.id === restraunt.id)
            if (checkArray.length === 0) {
                dispatch(AddRecentSuccess(restraunt))
                await updateDoc(doc(db, "users", id), { recent: arrayUnion(restraunt) });
            }
        }
    } catch (error) {
        console.log(error)
    }
}

export const AddAddressReq = async (id, add, dispatch, handleSuccess) => {
    try {
        const res = await getDoc(doc(db, "users", id));
        if (res.exists()) {
            await updateDoc(doc(db, "users", id), { address: arrayUnion(add) });
            dispatch(AddAddressSuccess(add))
            handleSuccess()
        }
    } catch (error) {
        console.log(error)
    }
}



export const UpdateUserDetails = async (dispatch, details, id, Done) => {
    try {
        // Update Firestore document
        await updateDoc(doc(db, "users", id), details);
        
        // If displayName is being updated, also update Firebase Auth profile
        if (details.displayName && Auth.currentUser) {
            await updateProfile(Auth.currentUser, {
                displayName: details.displayName
            });
        }
        
        const res = await getDoc(doc(db, "users", id));
        dispatch(getUserDataSuccess(res.data()))
        Done()
    } catch (error) {
        console.log(error)
    }
}