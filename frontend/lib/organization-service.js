import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * Get organization details
 * @param {string} orgId - Organization ID
 * @returns {Promise<Object>} - Organization data
 */
const getOrganizationDetails = async (orgId) => {
  try {
    const orgDoc = await getDoc(doc(db, 'users', orgId));
    if (!orgDoc.exists()) {
      throw new Error('Organization not found');
    }
    return { id: orgDoc.id, ...orgDoc.data() };
  } catch (error) {
    console.error('Error fetching organization details:', error);
    throw error;
  }
};

/**
 * Get organizations where user is a member
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of organizations
 */
const getUserOrganizations = async (userId) => {
  try {
    // Query for organization memberships
    const membershipsQuery = query(
      collection(db, 'organizationMembers'),
      where('userId', '==', userId)
    );
    
    const membershipsSnapshot = await getDocs(membershipsQuery);
    const memberships = [];
    
    // Process each membership
    for (const doc of membershipsSnapshot.docs) {
      const membershipData = doc.data();
      
      // Get organization details
      try {
        const orgDoc = await getDoc(doc(db, 'users', membershipData.orgId));
        if (orgDoc.exists()) {
          const orgData = orgDoc.data();
          memberships.push({
            id: doc.id,
            orgId: membershipData.orgId,
            orgName: orgData.name || 'Unknown Organization',
            role: membershipData.role || 'member',
            permissions: membershipData.permissions || [],
            ...membershipData,
          });
        }
      } catch (error) {
        console.error(`Error fetching org details for ${membershipData.orgId}:`, error);
      }
    }
    
    return memberships;
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    throw error;
  }
};

/**
 * Add a user to an organization
 * @param {string} orgId - Organization ID
 * @param {string} userId - User ID
 * @param {string} role - User role in the organization
 * @param {Array} permissions - User permissions in the organization
 * @returns {Promise<Object>} - Result object
 */
const addOrganizationMember = async (orgId, userId, role = 'member', permissions = []) => {
  try {
    // Check if user is already a member
    const existingMemberQuery = query(
      collection(db, 'organizationMembers'),
      where('orgId', '==', orgId),
      where('userId', '==', userId)
    );
    
    const existingMemberSnapshot = await getDocs(existingMemberQuery);
    if (!existingMemberSnapshot.empty) {
      throw new Error('User is already a member of this organization');
    }
    
    // Add user to organization
    const membershipData = {
      orgId,
      userId,
      role,
      permissions,
      addedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'organizationMembers'), membershipData);
    
    return {
      success: true,
      membershipId: docRef.id,
      message: 'User added to organization successfully',
    };
  } catch (error) {
    console.error('Error adding organization member:', error);
    throw error;
  }
};

/**
 * Update a user's role or permissions in an organization
 * @param {string} membershipId - Membership document ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} - Result object
 */
const updateOrganizationMember = async (membershipId, updates) => {
  try {
    const membershipRef = doc(db, 'organizationMembers', membershipId);
    
    // Check if membership exists
    const membershipDoc = await getDoc(membershipRef);
    if (!membershipDoc.exists()) {
      throw new Error('Membership not found');
    }
    
    // Update membership
    await updateDoc(membershipRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    
    return {
      success: true,
      message: 'Membership updated successfully',
    };
  } catch (error) {
    console.error('Error updating organization member:', error);
    throw error;
  }
};

/**
 * Remove a user from an organization
 * @param {string} membershipId - Membership document ID
 * @returns {Promise<Object>} - Result object
 */
const removeOrganizationMember = async (membershipId) => {
  try {
    const membershipRef = doc(db, 'organizationMembers', membershipId);
    
    // Check if membership exists
    const membershipDoc = await getDoc(membershipRef);
    if (!membershipDoc.exists()) {
      throw new Error('Membership not found');
    }
    
    // Delete membership
    await deleteDoc(membershipRef);
    
    return {
      success: true,
      message: 'User removed from organization successfully',
    };
  } catch (error) {
    console.error('Error removing organization member:', error);
    throw error;
  }
};

/**
 * Check if a user has access to an organization
 * @param {string} userId - User ID
 * @param {string} orgId - Organization ID
 * @returns {Promise<boolean>} - Whether the user has access
 */
const checkOrganizationAccess = async (userId, orgId) => {
  try {
    // Check if user is the organization owner
    const orgDoc = await getDoc(doc(db, 'users', orgId));
    if (orgDoc.exists() && orgDoc.data().ownerUid === userId) {
      return true;
    }
    
    // Check if user is a member
    const membershipQuery = query(
      collection(db, 'organizationMembers'),
      where('orgId', '==', orgId),
      where('userId', '==', userId)
    );
    
    const membershipSnapshot = await getDocs(membershipQuery);
    return !membershipSnapshot.empty;
  } catch (error) {
    console.error('Error checking organization access:', error);
    return false;
  }
};

export {
  getOrganizationDetails,
  getUserOrganizations,
  addOrganizationMember,
  updateOrganizationMember,
  removeOrganizationMember,
  checkOrganizationAccess,
};
