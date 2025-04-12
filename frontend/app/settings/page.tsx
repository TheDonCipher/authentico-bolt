'use client';
import React from 'react';
import SidebarNavigation from '../organization-dashboard/components/SidebarNavigation';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
const Settings = () => {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    walletAddress: '',
    role: '0',

  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [account, setAccount] = React.useState<string | null>(null);
  const [isWalletConnected, setIsWalletConnected] = React.useState(false);

  const [name, setName] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState<string | null>(null)
  const [password, setPassword] = React.useState<string | null>(null)

  const [role, setRole] = React.useState<string | null>(null)
  useEffect(() => {
    const initializeWallet = async () => {
      console.log('------window.ethereum-----', window.ethereum);
      await window.ethereum.enable();

      const provider = new ethers.providers.Web3Provider(window.ethereum);

      await provider.send('eth_requestAccounts', []);
      console.log('------provider-----', provider);
      console.log('---fetching network details----');
      const network = await provider.getNetwork();
      if (!network.ensAddress) {
        console.warn('Network does not support ENS');
      }

      const signer = provider.getSigner();
      console.log('------signer-----', signer);
      const account = await signer.getAddress();
      console.log('------account-----', account);

      setAccount(account);
      setFormData((prev) => ({ ...prev, walletAddress: account }));

      setIsWalletConnected(true);
    };

    initializeWallet();
  }, []);

  const handleSetName = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    console.log('Name changed:', value);

    setName(value);
    console.log('Name set in state:', name);
    setFormData((prev) => ({ ...prev, name: value }));
    console.log
  }

  const handleSetEmail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    console.log('Email changed:', value);

    setEmail(value);
    console.log('Email set in state:', email);
    setFormData((prev) => ({ ...prev, email: value }));
  }
  const handleSetPassword = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    console.log('Password changed:', value);

    setPassword(value);
    console.log('Password set in state:', password);
    setFormData((prev) => ({ ...prev, password: value }));
  }

  const [showPassword, setShowPassword] = React.useState(false);
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Form submitted:', formData);
    console.log('Account:', account);
    console.log('Name:', name);
    console.log('Email:', email);

    setFormData({ name: name, email: email, password: password, walletAddress: account, role: '0' });

    console.log("data set in formdat object ", formData)
    setLoading(true);
    setError(null);
    setSuccess(null);



    if (error) {
      setError('Please fix the errors above.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    setFormData({ name: name, email: email, password: password, walletAddress: account, role: '0' });


    console.log('Form data:', formData);
    console.log('Submitting form...');
    console.log('Submitting form data:', formData);

    try {
      const response = await fetch('http://localhost:666/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      console.log('Response:', response);
      console.log('Response body:', await response.json());

      if (!response.ok) {
        throw new Error('Failed to sign up. Please try again.');
      }

      const data = await response.json();
      setSuccess('Sign-up successful! Please check your email for verification.');
      setFormData({ name: '', email: '', password: '', walletAddress: '', role: '0' });


    } catch (error) {
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="relative flex min-h-screen bg-[#F5F5F0]">
      <SidebarNavigation />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-black mb-8 border-b-4 border-[#4A5043] pb-4 text-[#2C3639]">
            Settings
          </h1>

          <div className="grid grid-cols-1 gap-8">
            <section className="bg-[#E6E5DD] border-4 border-[#4A5043] p-6 shadow-brutal">
              <h2 className="text-2xl font-black mb-6 text-[#2C3639]">
                Organization Details
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block font-bold mb-2 text-[#2C3639]">
                    Organization Name
                  </label>
                  <input
                    id='name'
                    name='name'
                    placeholder="Enter your organization name"
                    onChange={(e) => handleSetName(e)}
                    required
                    type="text"
                    className="w-full p-3 border-2 border-[#4A5043] bg-[#F5F5F0]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-2 text-[#2C3639]">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    onChange={(e) => handleSetEmail(e)}

                    required
                    className="w-full p-3 border-2 border-[#4A5043] bg-[#F5F5F0]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-2 text-[#2C3639]">
                    Webhook URL
                  </label>
                  <input

                    type="text"
                    placeholder="Enter your webhook URL"
                    name='webhook'
                    id='webhook'
                    required
                    onChange={(e) => handleSetPassword(e)}
                    className="w-full p-3 border-2 border-[#4A5043] bg-[#F5F5F0]"
                  />
                </div>
                <button onClick={handleSubmit} type="submit" className="bg-[#4A5043] text-white px-6 py-3 font-bold hover:bg-[#5A6053]">
                  Save Changes
                </button>
              </div>
            </section>

            <section className="bg-[#E6E5DD] border-4 border-[#4A5043] p-6 shadow-brutal">
              <h2 className="text-2xl font-black mb-6 text-[#2C3639]">
                Security Settings
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border-2 border-[#4A5043] bg-[#F5F5F0]">
                  <div>
                    <p className="font-bold text-[#2C3639]">
                      Two-Factor Authentication
                    </p>
                    <p className="text-sm text-[#4A5043]">
                      Add an extra layer of security
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-[#4A6741]/20 text-[#4A6741] border-2 border-[#4A6741]">
                    Enable
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 border-2 border-[#4A5043] bg-[#F5F5F0]">
                  <div>
                    <p className="font-bold text-[#2C3639]">Session Timeout</p>
                    <p className="text-sm text-[#4A5043]">
                      Automatically log out after inactivity
                    </p>
                  </div>
                  <label htmlFor="session-timeout" className="block font-bold text-[#2C3639]">
                    Session Timeout Duration
                  </label>
                  <select
                    id="session-timeout"
                    className="p-2 border-2 border-[#4A5043] bg-[#F5F5F0]"
                  >
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>4 hours</option>
                  </select>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};



export default Settings;

// function useEffect(effect: () => void, deps: any[]) {
//   React.useEffect(effect, deps);
// }


