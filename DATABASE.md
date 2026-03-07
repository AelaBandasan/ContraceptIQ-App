# ContraceptIQ — Firebase Database Reference

## Authentication

Firebase Authentication (Email/Password) is used for OB/doctor accounts only.
Guests do not create accounts.

### Sign Up (OB)

Screen: `SignupforOB.tsx`

```
createUserWithEmailAndPassword(auth, email, password)
→ setDoc(db, "users", user.uid)
```

Fields written on sign-up:

| Field                | Type     | Value             |
|----------------------|----------|-------------------|
| `uid`                | string   | Firebase Auth UID |
| `fullName`           | string   | Doctor's full name |
| `email`              | string   | Login email       |
| `role`               | string   | `"OB"`            |
| `createdAt`          | ISO 8601 | Timestamp         |
| `verificationStatus` | string   | *(not set — defaults to unverified)* |

> After sign-up the account is **pending verification**. An admin must set
> `verificationStatus: "verified"` in the Firebase Console before the doctor can log in.

### Log In (OB)

Screen: `LoginforOB.tsx`

1. `signInWithEmailAndPassword(auth, email, password)`
2. `getDoc(db, "users", user.uid)` — reads the user document
3. If `verificationStatus === "verified"` → navigate to OB dashboard
4. Otherwise → navigate to `PendingVerification` screen

---

## Firestore Collections

### `users`

One document per OB doctor. Document ID = Firebase Auth UID.

```
users/
  {uid}/
    uid                : string   — Firebase Auth UID
    fullName           : string   — Doctor's display name
    email              : string   — Login email
    role               : "OB"
    createdAt          : string   — ISO 8601
    verificationStatus : "verified" | (absent = pending)
```

---

### `assessments`

One document per completed OB patient assessment.
Document ID = `{doctorId}_{timestamp_ms}` (unique per OB per session).

```
assessments/
  {doctorId}_{timestamp}/
    id              : string    — matches document ID
    doctorId        : string    — OB Firebase Auth UID
    doctorName      : string    — OB display name
    patientName     : string    — from form NAME field
    patientData     : object    — 9 V4 model features + NAME
                                  AGE, ETHNICITY, HOUSEHOLD_HEAD_SEX,
                                  SMOKE_CIGAR, PARITY, DESIRE_FOR_MORE_CHILDREN,
                                  CONTRACEPTIVE_METHOD, PATTERN_USE, HUSBAND_AGE
    mecResults      : object    — method key → MEC category 1–4
                                  e.g. { "CHC": 1, "DMPA": 3, "Implant": 1, ... }
    mecConditionIds : string[]  — selected WHO MEC condition IDs (up to 3)
    riskResults     : object    — per-method ML risk output
                                  { "Injectable": { riskLevel, probability,
                                    recommendation, confidence }, ... }
    clinicalNotes   : string    — OB free-text observations, referrals, follow-up
    status          : "completed" | "critical"
                                  completed = all methods LOW risk
                                  critical  = one or more methods HIGH risk
    createdAt       : string    — ISO 8601 creation timestamp
    pendingSync     : boolean   — true while not yet confirmed synced to Firestore
```

**Required Firestore index** (composite):
```
Collection : assessments
Fields     : doctorId ASC, createdAt DESC
```

---

### `mec_config`

Single document holding the WHO MEC condition table and method attributes.
Used for remote updates without redeploying the app.

```
mec_config/
  v1/
    conditions       : MecConditionEntry[]  — Full WHO MEC condition list
    methodAttributes : MethodAttributes[]   — Method preference attributes
    version          : string               — e.g. "1.0.0"
    updatedAt        : string               — ISO 8601 timestamp
```

**How it works:**
- On first run, the app auto-seeds this document from bundled data.
- The app caches this data in AsyncStorage for 24 hours.
- **The MEC tool works fully offline** — bundled data in `whoMecData.ts` is always the fallback.
- To push condition updates to all users, edit `mec_config/v1` in the Firebase Console.
  Changes propagate to all clients within 24 hours.

---

## Offline-First Save Strategy

All assessments are saved using an offline-first approach (`doctorService.ts`):

```
OB taps "Save & Finish"
  │
  ├─ 1. Write to AsyncStorage immediately      ← always works, no network needed
  │       key: @assessments_{doctorId}
  │
  ├─ 2. Try Firestore setDoc (async)
  │       success → mark pendingSync: false in local cache
  │       failure → add record ID to @sync_queue_{doctorId}
  │
  └─ 3. On next screen focus, flushSyncQueue()
            retries all queued record IDs automatically
```

History screen load order:
1. Load `@assessments_{doctorId}` from AsyncStorage → instant display (works offline)
2. If online, fetch from Firestore and merge with local cache

---

## Offline Behaviour Summary

| Feature                   | Online                          | Offline                        |
|---------------------------|---------------------------------|--------------------------------|
| Risk assessment (ONNX)    | On-device                       | On-device                      |
| WHO MEC tool              | Bundled + optional remote sync  | Bundled data                   |
| Save assessment           | AsyncStorage + Firestore        | AsyncStorage (queued for sync) |
| View patient history      | Firestore + local cache         | Local AsyncStorage cache       |
| OB login / sign-up        | Requires Firebase Auth          | Blocked                        |

---

## Firebase Console Quick Reference

**Project:** `contraceptiq-app`

### To verify a doctor account:
1. Firestore → `users` collection → open the doctor's UID document
2. Add/update field: `verificationStatus` → `"verified"`

### To update WHO MEC conditions:
1. Firestore → `mec_config` → `v1`
2. Edit the `conditions` array entries
3. Update `updatedAt` to current timestamp
4. All users pick up changes within 24 hours on next app open

### To create the required Firestore index:
1. Firebase Console → Firestore → Indexes → Composite → Create index
2. Collection: `assessments`
3. Fields: `doctorId` (Ascending), `createdAt` (Descending)
