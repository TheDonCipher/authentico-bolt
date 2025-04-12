'use client';

declare global {
  interface Window {
    ethereum: any;
  }
}



import React, { useState, useEffect } from 'react';
import SidebarNavigation from './components/SidebarNavigation';
import DocumentTable from './components/DocumentTable';
import AuthenticoContractAbi from 'public/contractsData/AuthenticoContract.json';
import AuthenticoContractAddress from 'public/contractsData/AuthenticoContract-address.json';

import { ethers } from 'ethers';
const OrganizationDashboard = () => {
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Search input value:', event.target.value);
  };
  const [documents, setDocuments] = useState([]);

  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);




  useEffect(() => {
    const connectWallet = async () => {
      if (window.ethereum) {
        try {
          console.log('------window.ethereum-----', window.ethereum);
          await window.ethereum.enable();

          const provider = new ethers.providers.Web3Provider(window.ethereum);
          console.log('------provider-----', provider);
          await provider.send('eth_requestAccounts', []);
          const signer = provider.getSigner();
          console.log('------signer-----', signer);
          const account = await signer.getAddress();
          console.log('------account-----', account);

          setProvider(provider);
          setSigner(signer);
          setAccount(account);

          const AuthenticoContract = new ethers.Contract(
            AuthenticoContractAddress.address,
            AuthenticoContractAbi.abi,
            signer
          );

          const name = await AuthenticoContract.name();
          console.log('name', name);
          const symbol = await AuthenticoContract.symbol();
          console.log('symbol', symbol);

          console.log('---fetching network details----');
          const network = await provider.getNetwork();
          if (!network.ensAddress) {
            console.warn('Network does not support ENS');
          }

          console.log('=-----start fetching documents=-----');
          const fetchedDocs = [];
          try {
            for (let i = 1; i < 3; i++) {
              const documentID = await AuthenticoContract.getDocumentDetailsByID(i);
              console.log('documentID document details', documentID);
              console.log("--each documentID document details--=======", i);
              console.log('documentID document details', documentID);
              console.log('documentID document url', documentID.documentType);

              // const documentID = await AuthenticoContract.getAllDocuments();
              console.log('documentID document name', documentID.name);
              console.log('documentID document url', documentID.documentType);
              console.log('documentID document metadataHash', documentID.metadataHash);
              console.log('documentID document  publicAddress', documentID.publicAddress);
              console.log('documentID document status', documentID.status);
              console.log('documentID document    urlPicture', documentID.urlPicture);
              console.log('documentID document    urlPicture', documentID.verifier);
              console.log('regulator accpunt ', account);

              if (documentID.verifier == account) {
                console.log('documentID document    urlPicture', documentID.verifier);
                fetchedDocs.push(documentID);

              }
            }
            setDocuments([...documents, ...fetchedDocs]);

          } catch (error) {
            console.error('Error fetching documents:', error);
          }


          console.log('=-----stop fetching documents=-----', fetchedDocs);
          console.log('=-----stop fetching documents=-----');
        } catch (error) {
          console.error(error);
        }
      } else {
        alert('MetaMask is not installed. Please install it to use this feature.');
      }
    };

    if (!signer) {
      connectWallet();
    } else {
      console.log("connect wallet");
    }
  }, [provider]);



  return (
    <div className="relative flex min-h-screen bg-[#F5F7F2]">
      <SidebarNavigation />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-black mb-8 border-b-4 border-[#556B2F] pb-4 text-[#2F4F4F]">
            Organization Dashboard
          </h1>

          <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#E8EDE1] p-6 border-4 border-[#556B2F] shadow-brutal">
                <h3 className="font-bold text-xl mb-2 text-[#2F4F4F]">
                  Total Documents
                </h3>
                <p className="text-4xl font-black text-[#556B2F]">2</p>
              </div>
              <div className="bg-[#E8EDE1] p-6 border-4 border-[#556B2F] shadow-brutal">
                <h3 className="font-bold text-xl mb-2 text-[#2F4F4F]">
                  Verified
                </h3>
                <p className="text-4xl font-black text-[#698B69]">1</p>
              </div>
              <div className="bg-[#E8EDE1] p-6 border-4 border-[#556B2F] shadow-brutal">
                <h3 className="font-bold text-xl mb-2 text-[#2F4F4F]">
                  Pending
                </h3>
                <p className="text-4xl font-black text-[#8B7355]">1</p>
              </div>
            </div>
          </section>

          <section className="bg-[#E8EDE1] border-4 border-[#556B2F] p-6 shadow-brutal">
            <h2 className="text-3xl font-black mb-6 text-[#2F4F4F]">
              Recent Documents
            </h2>
            <DocumentTable documents={documents} />
          </section>
        </div>
      </main>
    </div>
  );
};

export default OrganizationDashboard;
