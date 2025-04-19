'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useActiveAccount } from 'thirdweb/react';
import Link from 'next/link';
import { getAuthToken } from '../../../lib/token-util';

export default function AuthDebugPage() {
  const { user, loading, error, activeContext, isAdmin } = useAuth();
  const { activeOrgId, userOrganizations, isLoadingOrgs } = useOrganization();
  const account = useActiveAccount();
  
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  
  // Check session info
  const checkSession = async () => {
    try {
      setSessionLoading(true);
      setSessionError(null);
      
      const response = await fetch('/api/auth/check-session');
      const data = await response.json();
      
      setSessionInfo(data);
    } catch (error: any) {
      console.error('Error checking session:', error);
      setSessionError(error.message || 'Failed to check session');
    } finally {
      setSessionLoading(false);
    }
  };
  
  // Check token info
  const checkToken = async () => {
    try {
      setTokenLoading(true);
      setTokenError(null);
      
      const token = await getAuthToken();
      if (!token) {
        setTokenError('No token available');
        return;
      }
      
      const response = await fetch('/api/auth/validate', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      setTokenInfo(data);
    } catch (error: any) {
      console.error('Error checking token:', error);
      setTokenError(error.message || 'Failed to check token');
    } finally {
      setTokenLoading(false);
    }
  };
  
  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);
  
  return (
    <div className="min-h-screen bg-ivory p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-deep-moss">Authentication Debug</h1>
        
        <div className="mb-8">
          <Link 
            href="/"
            className="px-4 py-2 bg-forest-green text-ivory border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all"
          >
            Back to Home
          </Link>
        </div>
        
        {/* Context Info */}
        <div className="bg-soft-sage border-2 border-deep-moss p-4 mb-8">
          <h2 className="text-xl font-bold mb-4 text-deep-moss">Auth Context</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>Error:</strong> {error || 'None'}</p>
              <p><strong>Active Context:</strong> {activeContext || 'None'}</p>
              <p><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
            </div>
            
            <div>
              <p><strong>User:</strong> {user ? 'Authenticated' : 'Not Authenticated'}</p>
              {user && (
                <>
                  <p><strong>UID:</strong> {user.uid}</p>
                  <p><strong>User Type:</strong> {user.userType}</p>
                  <p><strong>Name:</strong> {user.name}</p>
                  <p><strong>Wallet:</strong> {user.walletAddress}</p>
                  {user.organizationName && (
                    <p><strong>Organization Name:</strong> {user.organizationName}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Organization Info */}
        <div className="bg-soft-sage border-2 border-deep-moss p-4 mb-8">
          <h2 className="text-xl font-bold mb-4 text-deep-moss">Organization Context</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Loading Orgs:</strong> {isLoadingOrgs ? 'Yes' : 'No'}</p>
              <p><strong>Active Org ID:</strong> {activeOrgId || 'None'}</p>
              <p><strong>Organizations Count:</strong> {userOrganizations.length}</p>
            </div>
            
            <div>
              {userOrganizations.length > 0 ? (
                <div>
                  <p><strong>Organizations:</strong></p>
                  <ul className="list-disc pl-5">
                    {userOrganizations.map((org) => (
                      <li key={org.orgId}>
                        {org.orgName} ({org.role}) - {org.orgId}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>No organizations</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Wallet Info */}
        <div className="bg-soft-sage border-2 border-deep-moss p-4 mb-8">
          <h2 className="text-xl font-bold mb-4 text-deep-moss">Wallet Info</h2>
          
          <div>
            <p><strong>Connected:</strong> {account ? 'Yes' : 'No'}</p>
            {account && (
              <>
                <p><strong>Address:</strong> {account.address}</p>
                <p><strong>Chain ID:</strong> {account.chainId}</p>
              </>
            )}
          </div>
        </div>
        
        {/* Session Info */}
        <div className="bg-soft-sage border-2 border-deep-moss p-4 mb-8">
          <h2 className="text-xl font-bold mb-4 text-deep-moss">Session Info</h2>
          
          <div className="mb-4">
            <button
              onClick={checkSession}
              disabled={sessionLoading}
              className="px-4 py-2 bg-forest-green text-ivory border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all disabled:opacity-50"
            >
              {sessionLoading ? 'Checking...' : 'Check Session'}
            </button>
          </div>
          
          {sessionError && (
            <div className="bg-burnt-sienna bg-opacity-20 p-4 mb-4 border-2 border-deep-moss">
              <p className="text-deep-moss">{sessionError}</p>
            </div>
          )}
          
          {sessionInfo && (
            <div className="bg-white p-4 border-2 border-deep-moss overflow-auto">
              <pre className="whitespace-pre-wrap">{JSON.stringify(sessionInfo, null, 2)}</pre>
            </div>
          )}
        </div>
        
        {/* Token Info */}
        <div className="bg-soft-sage border-2 border-deep-moss p-4 mb-8">
          <h2 className="text-xl font-bold mb-4 text-deep-moss">Token Info</h2>
          
          <div className="mb-4">
            <button
              onClick={checkToken}
              disabled={tokenLoading}
              className="px-4 py-2 bg-forest-green text-ivory border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all disabled:opacity-50"
            >
              {tokenLoading ? 'Checking...' : 'Check Token'}
            </button>
          </div>
          
          {tokenError && (
            <div className="bg-burnt-sienna bg-opacity-20 p-4 mb-4 border-2 border-deep-moss">
              <p className="text-deep-moss">{tokenError}</p>
            </div>
          )}
          
          {tokenInfo && (
            <div className="bg-white p-4 border-2 border-deep-moss overflow-auto">
              <pre className="whitespace-pre-wrap">{JSON.stringify(tokenInfo, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
