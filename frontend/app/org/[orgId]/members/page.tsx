'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { Loader } from '../../../components/ui/Loader';
import { Toast } from '../../../components/ui/Toast';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  addedAt: string;
}

interface ToastMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function OrganizationMembersPage() {
  const params = useParams();
  const { user } = useAuth();
  const { hasOrgAccess } = useOrganization();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');

  const orgId = params.orgId as string;

  // Fetch organization members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoading(true);

        // Get auth token
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch(
          `/api/organizations/members?orgId=${orgId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch organization members');
        }

        const data = await response.json();
        setMembers(data);
      } catch (error: any) {
        console.error('Error fetching organization members:', error);
        setToastMessage({
          type: 'error',
          message: error.message || 'Failed to load organization members',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (orgId) {
      fetchMembers();
    }
  }, [orgId]);

  // Add a new member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Get auth token
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // First, we need to find the user by email
      const userResponse = await fetch(
        `/api/users/by-email?email=${encodeURIComponent(newMemberEmail)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!userResponse.ok) {
        if (userResponse.status === 404) {
          throw new Error('User not found with this email');
        }
        throw new Error('Failed to find user');
      }

      const userData = await userResponse.json();

      // Now add the user to the organization
      const response = await fetch('/api/organizations/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orgId,
          userId: userData.uid,
          role: newMemberRole,
          permissions: [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add member');
      }

      // Refresh the members list
      const membersResponse = await fetch(
        `/api/organizations/members?orgId=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setMembers(membersData);
      }

      setToastMessage({
        type: 'success',
        message: 'Member added successfully',
      });

      // Reset form
      setNewMemberEmail('');
      setNewMemberRole('member');
      setShowAddMemberForm(false);
    } catch (error: any) {
      console.error('Error adding member:', error);
      setToastMessage({
        type: 'error',
        message: error.message || 'Failed to add member',
      });
    }
  };

  // Update a member's role
  const handleUpdateMember = async (memberId: string) => {
    try {
      // Get auth token
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`/api/organizations/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: editRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update member');
      }

      // Update the member in the local state
      setMembers(
        members.map((member) =>
          member.id === memberId ? { ...member, role: editRole } : member
        )
      );

      setToastMessage({
        type: 'success',
        message: 'Member updated successfully',
      });

      // Reset editing state
      setEditingMemberId(null);
      setEditRole('');
    } catch (error: any) {
      console.error('Error updating member:', error);
      setToastMessage({
        type: 'error',
        message: error.message || 'Failed to update member',
      });
    }
  };

  // Remove a member
  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      // Get auth token
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`/api/organizations/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove member');
      }

      // Remove the member from the local state
      setMembers(members.filter((member) => member.id !== memberId));

      setToastMessage({
        type: 'success',
        message: 'Member removed successfully',
      });
    } catch (error: any) {
      console.error('Error removing member:', error);
      setToastMessage({
        type: 'error',
        message: error.message || 'Failed to remove member',
      });
    }
  };

  // Start editing a member
  const startEditing = (member: Member) => {
    setEditingMemberId(member.id);
    setEditRole(member.role);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingMemberId(null);
    setEditRole('');
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader text="Loading organization members..." />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-deep-moss pb-4 mb-6 md:mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-black text-deep-moss">
            Organization Members
          </h1>
          <button
            onClick={() => setShowAddMemberForm(!showAddMemberForm)}
            className="flex items-center gap-2 px-4 py-2 bg-forest-green text-ivory font-bold border-2 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Plus size={20} />
            <span>Add Member</span>
          </button>
        </div>

        {showAddMemberForm && (
          <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal mb-6">
            <h2 className="text-xl font-bold mb-4 text-deep-moss">
              Add New Member
            </h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-deep-moss font-medium mb-1"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="w-full p-2 border-2 border-deep-moss focus:outline-none focus:ring-2 focus:ring-forest-green"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="role"
                  className="block text-deep-moss font-medium mb-1"
                >
                  Role
                </label>
                <select
                  id="role"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full p-2 border-2 border-deep-moss focus:outline-none focus:ring-2 focus:ring-forest-green"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-forest-green text-ivory font-bold border-2 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Add Member
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMemberForm(false)}
                  className="px-4 py-2 bg-ivory text-deep-moss font-bold border-2 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
          <h2 className="text-xl font-bold mb-4 text-deep-moss">
            Current Members
          </h2>

          {members.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-deep-moss text-ivory">
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Role</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b border-deep-moss">
                      <td className="p-2">{member.name}</td>
                      <td className="p-2">{member.email}</td>
                      <td className="p-2">
                        {editingMemberId === member.id ? (
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="p-1 border border-deep-moss"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                            <option value="owner">Owner</option>
                          </select>
                        ) : (
                          <span className="capitalize">{member.role}</span>
                        )}
                      </td>
                      <td className="p-2">
                        {editingMemberId === member.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateMember(member.id)}
                              className="text-green-600 hover:text-green-800"
                              title="Save"
                            >
                              <Check size={20} />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="text-red-600 hover:text-red-800"
                              title="Cancel"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditing(member)}
                              className="text-forest-green hover:text-deep-moss"
                              title="Edit"
                            >
                              <Edit size={20} />
                            </button>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Remove"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">No members found</p>
          )}
        </div>
      </div>

      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
          duration={5000}
        />
      )}
    </div>
  );
}
