import { db } from '../config/firebaseConfig';
import {
    collection,
    doc,
    getDoc,
    updateDoc,
    query,
    where,
    getDocs,
    orderBy,
    limit
} from 'firebase/firestore';

export interface ConsultationRecord {
    code: string;
    patientData: any;
    status: 'waiting' | 'completed' | 'critical' | 'cancelled';
    obId?: string;
    obName?: string;
    riskResult?: any;
    createdAt: string;
    assessedAt?: string;
    expiresIn: number;
}

/**
 * Claims a guest consultation code for a specific doctor.
 * Updates the record with the doctor's ID and Name.
 */
export const claimGuest = async (
    code: string,
    doctorId: string,
    doctorName: string
): Promise<{ success: boolean; data?: ConsultationRecord; error?: string }> => {
    try {
        const consultationRef = doc(db, 'consultations', code);
        const snapshot = await getDoc(consultationRef);

        if (!snapshot.exists()) {
            return { success: false, error: 'invalid-code' };
        }

        const data = snapshot.data() as ConsultationRecord;

        // Check availability
        if (data.status !== 'waiting' && data.obId && data.obId !== doctorId) {
            return { success: false, error: 'already-claimed' };
        }

        // Claim it
        await updateDoc(consultationRef, {
            obId: doctorId,
            obName: doctorName,
            status: 'waiting' // explicit confirmation
        });

        return { success: true, data: { ...data, obId: doctorId, obName: doctorName } };

    } catch (error: any) {
        console.error("Claim Error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Fetches the waiting queue for a specific doctor.
 * Returns patients already claimed by this doctor but not yet completed.
 */
export const fetchDoctorQueue = async (doctorId: string): Promise<ConsultationRecord[]> => {
    try {
        const q = query(
            collection(db, 'consultations'),
            where('obId', '==', doctorId),
            where('status', '==', 'waiting')
            // Note: Compound queries with orderBy might require an index. 
            // If so, remove orderBy until index is created or just client-side sort.
        );

        const querySnapshot = await getDocs(q);
        const results: ConsultationRecord[] = [];
        querySnapshot.forEach((doc) => {
            results.push(doc.data() as ConsultationRecord);
        });

        // Sort by newest first (client side to avoid index requirement for now)
        return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    } catch (error) {
        console.error("Fetch Queue Error:", error);
        return [];
    }
};

/**
 * Fetches the completed history for a specific doctor.
 */
export const fetchDoctorHistory = async (doctorId: string): Promise<ConsultationRecord[]> => {
    try {
        // 'in' query allows matching multiple statuses
        const q = query(
            collection(db, 'consultations'),
            where('obId', '==', doctorId),
            where('status', 'in', ['completed', 'critical'])
        );

        const querySnapshot = await getDocs(q);
        const results: ConsultationRecord[] = [];
        querySnapshot.forEach((doc) => {
            results.push(doc.data() as ConsultationRecord);
        });

        // Sort by assessed time descending
        return results.sort((a, b) => {
            const timeA = a.assessedAt || a.createdAt;
            const timeB = b.assessedAt || b.createdAt;
            return new Date(timeB).getTime() - new Date(timeA).getTime();
        });

    } catch (error) {
        console.error("Fetch History Error:", error);
        return [];
    }
};
