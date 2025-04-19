'use client';

import React, { useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function FirestoreRulesDebugPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testType, setTestType] = useState<string>('');

  const runTest = async (type: string) => {
    setLoading(true);
    setError(null);
    setResults(null);
    setTestType(type);

    try {
      let result;

      switch (type) {
        case 'get-user':
          if (!user) throw new Error('No user logged in');
          result = await getDoc(doc(db, 'users', user.uid));
          setResults({
            exists: result.exists(),
            data: result.exists() ? result.data() : null,
          });
          break;

        case 'get-users':
          result = await getDocs(collection(db, 'users'));
          setResults({
            count: result.size,
            docs: result.docs.map(doc => ({
              id: doc.id,
              data: doc.data(),
            })),
          });
          break;

        case 'get-org-members':
          if (!user) throw new Error('No user logged in');
          result = await getDocs(
            query(
              collection(db, 'organizationMembers'),
              where('userId', '==', user.uid)
            )
          );
          setResults({
            count: result.size,
            docs: result.docs.map(doc => ({
              id: doc.id,
              data: doc.data(),
            })),
          });
          break;

        case 'get-org-by-id':
          if (!user?.uid) throw new Error('No user logged in');
          result = await getDocs(
            query(
              collection(db, 'users'),
              where('userType', '==', 'organization'),
              where('__name__', '==', user.uid)
            )
          );
          setResults({
            count: result.size,
            docs: result.docs.map(doc => ({
              id: doc.id,
              data: doc.data(),
            })),
          });
          break;

        default:
          throw new Error('Invalid test type');
      }
    } catch (err: any) {
      console.error('Test error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-deep-moss">Firestore Rules Debug</h1>
        
        <div className="mb-8">
          <Link 
            href="/debug/auth"
            className="px-4 py-2 bg-forest-green text-ivory border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all mr-4"
          >
            Auth Debug
          </Link>
          <Link 
            href="/"
            className="px-4 py-2 bg-forest-green text-ivory border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all"
          >
            Back to Home
          </Link>
        </div>
        
        {/* User Info */}
        <div className="bg-soft-sage border-2 border-deep-moss p-4 mb-8">
          <h2 className="text-xl font-bold mb-4 text-deep-moss">Current User</h2>
          
          {user ? (
            <div>
              <p><strong>UID:</strong> {user.uid}</p>
              <p><strong>User Type:</strong> {user.userType}</p>
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Wallet:</strong> {user.walletAddress}</p>
              {user.organizationName && (
                <p><strong>Organization Name:</strong> {user.organizationName}</p>
              )}
            </div>
          ) : (
            <p>No user authenticated</p>
          )}
        </div>
        
        {/* Test Buttons */}
        <div className="bg-soft-sage border-2 border-deep-moss p-4 mb-8">
          <h2 className="text-xl font-bold mb-4 text-deep-moss">Test Firestore Rules</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => runTest('get-user')}
              disabled={loading}
              className="px-4 py-2 bg-forest-green text-ivory border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all disabled:opacity-50"
            >
              Test: Get Current User
            </button>
            
            <button
              onClick={() => runTest('get-users')}
              disabled={loading}
              className="px-4 py-2 bg-forest-green text-ivory border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all disabled:opacity-50"
            >
              Test: Get All Users
            </button>
            
            <button
              onClick={() => runTest('get-org-members')}
              disabled={loading}
              className="px-4 py-2 bg-forest-green text-ivory border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all disabled:opacity-50"
            >
              Test: Get Organization Memberships
            </button>
            
            <button
              onClick={() => runTest('get-org-by-id')}
              disabled={loading}
              className="px-4 py-2 bg-forest-green text-ivory border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all disabled:opacity-50"
            >
              Test: Get Organization by ID
            </button>
          </div>
          
          {loading && (
            <div className="bg-ivory p-4 border-2 border-deep-moss mb-4">
              <p className="text-deep-moss">Running test...</p>
            </div>
          )}
          
          {error && (
            <div className="bg-burnt-sienna bg-opacity-20 p-4 border-2 border-deep-moss mb-4">
              <h3 className="font-bold mb-2">Error:</h3>
              <p className="text-deep-moss">{error}</p>
            </div>
          )}
          
          {results && (
            <div className="bg-white p-4 border-2 border-deep-moss overflow-auto">
              <h3 className="font-bold mb-2">Results for: {testType}</h3>
              <pre className="whitespace-pre-wrap">{JSON.stringify(results, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
