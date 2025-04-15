# Document Verification System: Implementation Plan (NextJS/Firebase/Thirdweb Stack)

This document outlines the implementation strategy for a secure document verification website using blockchain technology, tailored for the existing monorepo structure containing NextJS (App Router), Firebase, Thirdweb, Pinata, and an Express backend.

**Project Root:** `c:/Users/Japan/OneDrive/Documents/GitHub/authentico-bolt`

## Core Concept

*   **Off-Chain Storage (IPFS via Pinata):** Encrypt documents (AES-256) in the backend before uploading to IPFS via Pinata.
*   **On-Chain Anchoring:** Record a SHA-256 hash of the *original* document and key metadata (uploader wallet, org wallet, type, encrypted CID) on the blockchain (e.g., Sepolia, Localhost).
*   **Verification Record:** Store verification status (Verified/Rejected) on-chain, linked to the document record.
*   **User Experience (Thirdweb Embedded Wallets):** Use Thirdweb SDK in the frontend for user wallet connection (social/email).
*   **Organization Experience:** Verified organizations use wallets for on-chain actions (verification).
*   **Application Database (Firebase Firestore):** Store user profiles, organization details, document metadata (linking CIDs, TxHashes, NFT IDs), and application state. Use `firestore.rules` in the project root for security.
*   **Backend:** Node.js/Express app in the `backend/` directory handles API logic, encryption, Pinata uploads, and blockchain interactions via a sponsor wallet.

## Architecture Principles

*   **Modularity:** Structure the backend codebase into distinct modules (e.g., `EncryptionService`, `StorageService`, `BlockchainService`, `NotificationService`) to encapsulate specific functionalities. This promotes separation of concerns and allows for easier updates or technology swaps (e.g., changing KMS provider or IPFS pinning service).
*   **Asynchronicity:** Favor asynchronous operations, especially for blockchain interactions and potentially large file processing, to keep API responses fast and improve user experience. Utilize background jobs or listeners where appropriate.
*   **Security First:** Implement security best practices at every layer: secure key management (KMS), strict Firestore rules, input validation, authenticated endpoints, protection against common web vulnerabilities.
*   **Robustness:** Incorporate detailed logging, error handling, and retry mechanisms for external service calls.

## User Flow & Implementation Strategy

### Phase 0: Organization Onboarding & Verification

*(Ensures only legitimate organizations are selectable by users)*

1.  **Organization Application Form (NextJS Frontend)**
    *   **Location:** Create `frontend/app/apply/organization/page.tsx`.
    *   **Functionality:** Form to collect Org Name, Contact Email, Website, etc.
    *   **Implementation:** NextJS page with form component (e.g., using components from `frontend/app/components/ui/`).
2.  **Store Application (Firebase Firestore & Backend)**
    *   **Collection:** `organizationApplications`.
    *   **Functionality:** Frontend form submits to a new backend API endpoint (`POST /api/org-applications` - create in `backend/routes/orgApplicationRoutes.js` and mount in `backend/index.js`). Backend writes application data to Firestore with `status: "pending"`.
    *   **Document Structure:** `{ orgName: "...", contactEmail: "...", ..., status: "pending", submittedAt: Timestamp }`.
    *   **Security Rules:** Update root `firestore.rules` to allow authenticated writes to `organizationApplications`, restrict reads to admin roles.
3.  **Admin Review Process (Manual / Admin Dashboard)**
    *   **Functionality:** Admins review `pending` applications (via Firebase Console or a future admin UI).
    *   **Implementation (Future):** Protected NextJS route (`frontend/app/admin/applications/page.tsx`).
4.  **Approval & Account Setup (Backend Logic / Manual)**
    *   **Trigger:** Manual admin action.
    *   **Functionality (Manual/Scripted):**
        *   Admin creates Firebase Auth user for `contactEmail`.
        *   Admin creates/updates document in `Users` collection: `{ email: "...", role: "organization", isVerified: true, orgName: "...", ..., thirdwebWalletAddress: null, firebaseUid: authUid }`. Set custom claims using `firebase-admin`.
        *   Update `organizationApplications` status.
        *   Send confirmation email.
5.  **Organization Wallet Association (Frontend & Backend)**
    *   **Functionality:** Capture org wallet address on login via Thirdweb.
    *   **Implementation:** Frontend (`frontend/app/organization-dashboard/page.tsx` or login) uses `useActiveAccount()`, sends address to backend (`PUT /api/users/update-wallet` in `backend/routes/userRoutes.js`?) to update `Users` document.

### Phase 1: User Registration & Document Upload

1.  **Individual User Registration/Login (Thirdweb & Firebase)**
    *   **Functionality:** Use Thirdweb ConnectButton. Ensure backend flow (`POST /api/auth/register` or `/api/users/update-wallet`) captures/updates `thirdwebWalletAddress` in the `Users` Firestore document.
    *   **Implementation:** Modify frontend auth components (`frontend/app/components/auth/`) and relevant backend routes.
2.  **Document Upload Interface (NextJS Frontend)**
    *   **Location:** `frontend/app/individual-dashboard/page.tsx`.
    *   **Functionality:**
        *   File input, doc name, doc type, searchable org select (fetch from `GET /api/organizations/verified`).
        *   **File Size Handling:** Implement client-side checks for max file size. For larger files (>10MB, TBD), consider chunked uploads or pre-signed URLs (future enhancement).
        *   **UI Feedback:** Display clear, real-time status: "Encrypting...", "Uploading...", "Submitting to Blockchain...", "Awaiting Confirmation...", "Verified", "Rejected". Use toasts (`hooks/use-toast.ts`) for success/error messages. Provide actionable error info.
    *   **Implementation:** Update form, add org fetching (`axios`), implement status display logic.
3.  **Backend Processing & Off-Chain Storage (Express Backend & Pinata)**
    *   **Endpoint:** `POST /api/documents/upload` (in `backend/routes/documentRoutes.js`).
    *   **Functionality:**
        *   Auth middleware (`backend/authMiddleware.js`).
        *   Receive `multipart/form-data`. **Input Validation:** Validate all inputs (file type/size, string lengths, org ID format).
        *   **File Size Handling:** If implementing chunking/pre-signed URLs, adapt logic here. Otherwise, handle direct upload buffer.
        *   Fetch `userWalletAddress` from Firestore `Users`.
        *   **Calculate Hash:** SHA-256 hash of original file buffer.
        *   **Encrypt:**
            *   **Key Management:** Integrate with KMS (e.g., Google KMS, AWS KMS). Generate a data encryption key (DEK). Encrypt the DEK with a Customer Master Key (CMK) in KMS. Store the *encrypted* DEK in Firestore.
            *   Encrypt file buffer using the *plaintext* DEK.
        *   **Store Encrypted File (Pinata):** Use `pinata-web3` SDK. Implement **retry mechanism** with exponential backoff for transient errors.
        *   **Store Metadata (Firestore):** Create `documents` record: `{ ownerUid, verifyingOrgId, documentType, originalDocHash, encryptedIpfsCid, encryptedDek: storedEncryptedDek, status: "Pending Blockchain Submission", createdAt, userWalletAddress }`.
        *   **Logging:** Log key steps with structured data (e.g., `{ step: 'pinata_upload_success', docId: ..., cid: ... }`).
        *   **Trigger Async Anchoring:** Push job to a queue (e.g., Google Cloud Tasks, BullMQ if using Redis/persistent store) or trigger a separate Cloud Function containing the Firestore `docId`.
    *   **Implementation:** Create `EncryptionService` (using KMS SDK), `StorageService` (using Pinata SDK), `QueueService`. Update API route logic. Add logging library (e.g., Winston).
4.  **Asynchronous Blockchain Anchoring (Backend Worker/Cloud Function)**
    *   **Trigger:** Job queue message or Firestore trigger (`onCreate` for `documents` collection, or on status update).
    *   **Functionality:**
        *   Fetch document data from Firestore using `docId`.
        *   Fetch organization wallet address from Firestore `Users` using `verifyingOrgId`.
        *   Update Firestore status to `"Submitting to Blockchain"`.
        *   Call `registerDocument(hash, userAddr, orgAddr, type, cid)` using backend sponsor wallet (`ethers.js` signer from `backend/config.js`). Implement **retry mechanism**.
        *   On successful transaction *submission* (Tx sent, have TxHash): Update Firestore status to `"Pending Blockchain Confirmation"`, store `transactionHash`.
        *   **Trigger Confirmation Listener/Job:** Add job/event to specifically wait for this `transactionHash`.
    *   **Implementation:** Create the worker/function. Use `ethers.js`. Update Firestore. Add logging.
5.  **Blockchain Confirmation Listener (Backend Worker/Cloud Function)**
    *   **Trigger:** Event from blockchain event listener service (e.g., Alchemy/Infura webhooks, dedicated listener) OR scheduled job polling transaction status using `transactionHash`.
    *   **Functionality:**
        *   On confirmation: Parse logs for `DocumentRegistered` event (if it emits `tokenId`) or determine `tokenId` via other means (e.g., contract view function). Update Firestore `documents` record: set `tokenId`, update `status: "Pending Verification"`.
        *   On failure: Update Firestore status to `"Blockchain Failed"`.
        *   **Notify Frontend:** Trigger a notification (e.g., via Firebase Realtime DB update, Firestore listener on frontend, or WebSocket push) indicating status change.
    *   **Implementation:** Set up listener/polling mechanism. Update Firestore. Implement frontend notification listener (e.g., using Firestore `onSnapshot` in dashboard).
6.  **Error Handling & Logging**
    *   **Throughout Backend:** Implement `try...catch` blocks for external calls (KMS, Pinata, Firestore, Blockchain).
    *   **Structured Logging:** Use a library like Winston to log errors and key events with context (request ID, user ID, doc ID, step).
    *   **Retry Logic:** Implement exponential backoff for transient network/service errors when calling Pinata and sending blockchain transactions.
    *   **Status Updates:** Ensure Firestore `status` field accurately reflects failures (e.g., `"Pinata Upload Failed"`, `"Encryption Failed"`, `"Blockchain Failed"`).

### Phase 2: Verification Process

*(Logic remains separate)*

1.  **User Dashboard (NextJS Frontend)**
    *   **Functionality:** Fetch documents from Firestore. Display status, including detailed error messages if status indicates failure. Listen for real-time status updates.
    *   **Implementation:** Use Firestore `onSnapshot` for real-time updates. Map status codes to user-friendly messages.
2.  **Verification Request & Notification (Backend)**
    *   **Trigger:** Automatic on status `"Pending Verification"`.
    *   **Functionality:** Send notification (Email/In-App) to org.
    *   **Implementation:** Cloud Function trigger or logic within Confirmation Listener (Step 1.5).
3.  **Organization Dashboard & Queue (NextJS Frontend)**
    *   **Location:** `frontend/app/organization-dashboard/page.tsx`.
    *   **Functionality:** Query Firestore for documents assigned to org with status `"Pending Verification"`.
4.  **Document Review & Verification/Rejection (NextJS & Backend)**
    *   **Endpoint:** `GET /api/documents/:docId/secure-details`, `POST /api/documents/:docId/verify`.
    *   **Functionality:**
        *   Securely fetch encrypted DEK from Firestore, request decryption via KMS using authorized org credentials/role.
        *   Fetch encrypted file from Pinata.
        *   Decrypt file *server-side*.
        *   Securely stream/display to org reviewer.
        *   Receive Verify/Reject action.
    *   **Implementation:** Requires KMS integration for decryption. Robust AuthZ checks.
5.  **Updating Status (Backend & Blockchain)**
    *   **Endpoint:** `POST /api/documents/:docId/verify`.
    *   **Functionality:**
        *   Update Firestore (`status`, `rejectionReason`, etc.).
        *   Call `updateVerificationStatus(...)` on contract. **Signing:** Requires secure org wallet signing mechanism (e.g., Thirdweb Engine, KMS signing).
        *   **Notify User:** Trigger frontend notification.
    *   **Implementation:** API route, contract interaction, Firestore update, notification trigger.

### Phase 3: Post-Verification & Sharing

1.  **User Feedback & Re-upload (NextJS Frontend)**
    *   **Location:** frontend/app/individual-dashboard/page.tsx.
    *   **Functionality:** Display final status from Firestore. Allow re-upload.
2.  **Sharing Verified Documents (NextJS Frontend)**
    *   **Functionality:** "Share" button generates link (/verify/[firestoreDocumentId]) and QR code.
    *   **Implementation:** Use Firestore document ID in the link. Client-side QR library.
3.  **Public Verification Page (NextJS Frontend)**
    *   **Route:** frontend/app/verify/[docId]/page.tsx.
    *   **Functionality:** Fetch public data from Firestore using docId. Display Type, Status, Org Name, Date, Hash, Tx Hash, CID. **NO document content.**
    *   **Implementation:** Dynamic route page, Firestore client SDK fetch.

## Technology Stack & File Mapping

*   **Frontend:** `frontend/`
    *   Pages/Dashboards: `frontend/app/.../page.tsx`
    *   Components: `frontend/app/components/`
    *   Contexts: `frontend/app/contexts/`
    *   Libs: `frontend/lib/` (Firebase client, Thirdweb client)
    *   Public Assets: `frontend/public/` (Contract ABIs)
*   **Backend:** `backend/`
    *   Server: `backend/index.js`
    *   Config: `backend/config.js`
    *   Middleware: `backend/authMiddleware.js`
    *   Routes: `backend/routes/` (e.g., `authRoutes.js`, `documentRoutes.js`, `orgRoutes.js`)
    *   Services: `backend/services/` (e.g., `EncryptionService.js`, `StorageService.js`, `BlockchainService.js`, `NotificationService.js`)
    *   Env: `backend/.env`
    *   Contract Data: `backend/contractsData/`
*   **Smart Contracts:** `smart_contracts/`
*   **Shared:** `hooks/`, `lib/` (Root level)
*   **Database Rules:** `firestore.rules` (Root level)

## Key Considerations Update

*   **Blockchain Confirmation:** **Changed to Option A (Backend Listener/Async Job)** for better scalability and UX. The `/upload` API returns quickly after triggering the async job.
*   **Key Management:** **Use KMS.** Integrate Google KMS or AWS KMS via their SDKs in the `EncryptionService`. Store *encrypted* DEKs in Firestore. Define IAM roles/permissions carefully.
*   **File Size:** Implement basic checks first. Defer chunking/pre-signed URLs unless large files are an immediate requirement.
*   **Error Handling/Logging:** Implement structured logging (e.g., Winston) and retry logic (e.g., using `async-retry`) in backend services.
*   **Modularity:** Structure backend code into services (`backend/services/`).
*   **Organization Wallet Signing:** This remains complex for the verification step. Initial implementation might use the backend sponsor wallet for `updateVerificationStatus` if org-specific signing is too complex immediately, but note this is less ideal from a decentralization/auditability perspective. Thirdweb Engine could be a future solution.
*   **Contract Artifacts:** Maintain process to copy ABI/address to `frontend/public/contractsData/` and `backend/contractsData/`.
*   **Frontend Notifications:** Implement mechanism for frontend to receive real-time status updates (Firestore `onSnapshot` is feasible).