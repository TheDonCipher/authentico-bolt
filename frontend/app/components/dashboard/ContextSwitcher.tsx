'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { ChevronDown, User, Building2, Check } from 'lucide-react';

export const ContextSwitcher: React.FC = () => {
  const { user, activeContext, setActiveContext } = useAuth();
  const { userOrganizations, isLoadingOrgs } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  if (!user) return null;

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const switchToIndividual = () => {
    setActiveContext('individual');
    if (user) {
      // Check if the user has an individual account
      if (user.userType === 'individual') {
        router.push(`/user/${user.uid}/dashboard`);
      } else {
        // Organization user without individual account
        router.push('/individual-dashboard'); // Redirect to demo page
        // Show toast or alert in the destination page
        sessionStorage.setItem('showIndividualAccountMessage', 'true');
      }
    } else {
      router.push('/individual-dashboard'); // Fallback to demo page
    }
    setIsOpen(false);
  };

  const switchToOrganization = (orgId: string) => {
    setActiveContext('organization', orgId);
    router.push(`/org/${orgId}/dashboard`);
    setIsOpen(false);
  };

  // Determine current context name
  const getCurrentContextName = () => {
    if (activeContext === 'individual') {
      return 'Individual Account';
    } else if (activeContext === 'organization') {
      const org = userOrganizations.find((org) => org.orgId === user.uid);
      return org ? org.orgName : 'Organization Account';
    }
    return 'Select Account';
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-soft-sage border-2 border-deep-moss shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all text-sm sm:text-base touch-target"
        aria-label="Switch account context"
        aria-expanded={isOpen}
      >
        {activeContext === 'individual' ? (
          <User size={16} className="text-deep-moss sm:w-[18px] sm:h-[18px]" />
        ) : (
          <Building2
            size={16}
            className="text-deep-moss sm:w-[18px] sm:h-[18px]"
          />
        )}
        <span className="font-bold text-deep-moss truncate max-w-[100px] sm:max-w-[150px]">
          {getCurrentContextName()}
        </span>
        <ChevronDown
          size={14}
          className="text-deep-moss sm:w-4 sm:h-4 flex-shrink-0"
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-[calc(100vw-2rem)] sm:w-64 max-w-[300px] bg-white border-2 border-deep-moss shadow-brutal z-50 overflow-y-auto max-h-[80vh] sm:max-h-[50vh]">
          <div className="p-2">
            {/* Individual option - always available */}
            <button
              onClick={switchToIndividual}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-soft-sage transition-colors ${
                activeContext === 'individual' ? 'bg-soft-sage' : ''
              } touch-target`}
            >
              <User size={18} className="text-deep-moss flex-shrink-0" />
              <span className="font-medium text-deep-moss">
                Individual Account
              </span>
              {activeContext === 'individual' && (
                <Check
                  size={16}
                  className="ml-auto text-forest-green flex-shrink-0"
                />
              )}
            </button>

            {/* Organization options */}
            {userOrganizations.length > 0 && (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="px-3 py-1 text-xs text-gray-500 font-medium">
                  Your Organizations
                </div>

                {userOrganizations.map((org) => (
                  <button
                    key={org.orgId}
                    onClick={() => switchToOrganization(org.orgId)}
                    className={`flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-soft-sage transition-colors ${
                      activeContext === 'organization' && user.uid === org.orgId
                        ? 'bg-soft-sage'
                        : ''
                    } touch-target`}
                  >
                    <Building2
                      size={18}
                      className="text-deep-moss flex-shrink-0"
                    />
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-medium text-deep-moss truncate max-w-[150px] sm:max-w-[180px]">
                        {org.orgName}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {org.role}
                      </span>
                    </div>
                    {activeContext === 'organization' &&
                      user.uid === org.orgId && (
                        <Check
                          size={16}
                          className="ml-auto text-forest-green flex-shrink-0"
                        />
                      )}
                  </button>
                ))}
              </>
            )}

            {isLoadingOrgs && (
              <div className="px-3 py-2 text-sm text-gray-500 italic">
                Loading organizations...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
