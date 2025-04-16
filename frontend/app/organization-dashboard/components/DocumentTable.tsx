import React from 'react';
import { getDocumentTypeName } from '../../constants/documentTypes';
import { ethers } from 'ethers';
import AuthenticoContractAbi from 'public/contractsData/AuthenticoContract.json';
import AuthenticoContractAddress from 'public/contractsData/AuthenticoContract-address.json';

interface Document {
  documentId: number;
  documentType: string;
  status: string;
  publicAddress: string;
  metadataHash: string;
  urlPicture: string;
  verifier: string;
}

export default function DocumentTable({
  documents,
}: {
  documents: Document[];
}) {
  return (
    <div className="overflow-x-auto">
      {/* Desktop Table - Hidden on small screens */}
      <table className="w-full border-collapse hidden md:table">
        <thead>
          <tr className="border-b-4 border-deep-moss bg-ivory">
            <th className="px-4 py-3 text-left font-black text-deep-moss">
              Document
            </th>
            <th className="px-4 py-3 text-left font-black text-deep-moss">
              Status
            </th>
            <th className="px-4 py-3 text-left font-black text-deep-moss">
              Holder
            </th>
            <th className="px-4 py-3 text-left font-black text-deep-moss">
              Metadata
            </th>
            <th className="px-4 py-3 text-left font-black text-deep-moss">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr
              key={doc.documentId}
              className="border-b-2 border-deep-moss hover:bg-soft-sage"
            >
              <td className="px-4 py-4 font-medium text-deep-moss">
                {getDocumentTypeName(doc.documentType)}
              </td>
              <td className="px-4 py-4">
                <span
                  className={`px-3 py-1 text-sm font-bold border-2 border-deep-moss
                  ${
                    doc.status == '1'
                      ? 'bg-soft-sage text-forest-green'
                      : doc.status == '0'
                      ? 'bg-sunflower bg-opacity-20 text-deep-moss'
                      : 'bg-burnt-sienna bg-opacity-20 text-deep-moss'
                  }`}
                >
                  {doc.status == '0'
                    ? 'Pending'
                    : doc.status == '1'
                    ? 'Verified'
                    : 'Rejected'}
                </span>
              </td>
              <td className="px-4 py-4 text-deep-moss">
                {doc.publicAddress.slice(0, 3)}... {doc.publicAddress.slice(-3)}
              </td>
              <td className="px-4 py-4 text-deep-moss">
                <button
                  type="button"
                  onClick={() => {
                    const gateway =
                      process.env.NEXT_PUBLIC_GATEWAY_URL ||
                      'fuchsia-fantastic-python-686.mypinata.cloud';
                    const gatewayUrl = `https://${gateway}/ipfs/${doc.urlPicture}`;
                    const fallbackUrl = `https://ipfs.io/ipfs/${doc.urlPicture}`;
                    window.open(gatewayUrl, '_blank').onerror = () => {
                      window.open(fallbackUrl, '_blank');
                    };
                  }}
                  className="bg-forest-green text-ivory px-3 py-1 text-sm font-bold hover:bg-deep-moss transition-colors border-2 border-deep-moss"
                >
                  View
                </button>
              </td>
              <td className="px-4 py-4">
                <button
                  type="button"
                  onClick={async () => {
                    console.log('------window.ethereum-----', window.ethereum);
                    await window.ethereum.enable();

                    const provider = new ethers.providers.Web3Provider(
                      window.ethereum
                    );
                    console.log('------provider-----', provider);
                    await provider.send('eth_requestAccounts', []);
                    const signer = provider.getSigner();
                    console.log('------signer-----', signer);
                    const account = await signer.getAddress();
                    console.log('------account-----', account);

                    const AuthenticoContract = new ethers.Contract(
                      AuthenticoContractAddress.address,
                      AuthenticoContractAbi.abi,
                      signer
                    );

                    const verifyDoc = await AuthenticoContract.verifyDocument(
                      doc.documentId
                    );
                    console.log('Document verified:', verifyDoc);
                    const tx = await verifyDoc.wait();
                    console.log('Transaction:', tx);
                    const txHash = tx.transactionHash;
                    console.log('Transaction hash:', txHash);
                    const docNewStatus =
                      await AuthenticoContract.getDocumentDetailsByID(
                        doc.documentId
                      );
                    console.log(
                      'Document status:',
                      docNewStatus.status.toString()
                    );
                  }}
                  className="bg-forest-green text-ivory px-3 py-1 text-sm font-bold hover:bg-deep-moss transition-colors border-2 border-deep-moss"
                >
                  Approve
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile Card View - Only visible on small screens */}
      <div className="md:hidden space-y-4">
        {documents.map((doc) => (
          <div
            key={doc.documentId}
            className="bg-ivory p-4 border-2 border-deep-moss shadow-brutal"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-deep-moss">
                {getDocumentTypeName(doc.documentType)}
              </h3>
              <span
                className={`px-2 py-1 text-xs font-bold border-2 border-deep-moss
                ${
                  doc.status == '1'
                    ? 'bg-soft-sage text-forest-green'
                    : doc.status == '0'
                    ? 'bg-sunflower bg-opacity-20 text-deep-moss'
                    : 'bg-burnt-sienna bg-opacity-20 text-deep-moss'
                }`}
              >
                {doc.status == '0'
                  ? 'Pending'
                  : doc.status == '1'
                  ? 'Verified'
                  : 'Rejected'}
              </span>
            </div>

            <div className="text-sm mb-3">
              <p className="text-gray-600 mb-1">Holder:</p>
              <p className="font-medium text-deep-moss">
                {doc.publicAddress.slice(0, 3)}... {doc.publicAddress.slice(-3)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  const gateway =
                    process.env.NEXT_PUBLIC_GATEWAY_URL ||
                    'fuchsia-fantastic-python-686.mypinata.cloud';
                  const gatewayUrl = `https://${gateway}/ipfs/${doc.urlPicture}`;
                  const fallbackUrl = `https://ipfs.io/ipfs/${doc.urlPicture}`;
                  window.open(gatewayUrl, '_blank').onerror = () => {
                    window.open(fallbackUrl, '_blank');
                  };
                }}
                className="bg-forest-green text-ivory px-3 py-1 text-sm font-bold hover:bg-deep-moss transition-colors border-2 border-deep-moss flex-1"
              >
                View Metadata
              </button>

              <button
                type="button"
                onClick={async () => {
                  console.log('------window.ethereum-----', window.ethereum);
                  await window.ethereum.enable();

                  const provider = new ethers.providers.Web3Provider(
                    window.ethereum
                  );
                  console.log('------provider-----', provider);
                  await provider.send('eth_requestAccounts', []);
                  const signer = provider.getSigner();
                  console.log('------signer-----', signer);
                  const account = await signer.getAddress();
                  console.log('------account-----', account);

                  const AuthenticoContract = new ethers.Contract(
                    AuthenticoContractAddress.address,
                    AuthenticoContractAbi.abi,
                    signer
                  );

                  const verifyDoc = await AuthenticoContract.verifyDocument(
                    doc.documentId
                  );
                  console.log('Document verified:', verifyDoc);
                  const tx = await verifyDoc.wait();
                  console.log('Transaction:', tx);
                  const txHash = tx.transactionHash;
                  console.log('Transaction hash:', txHash);
                  const docNewStatus =
                    await AuthenticoContract.getDocumentDetailsByID(
                      doc.documentId
                    );
                  console.log(
                    'Document status:',
                    docNewStatus.status.toString()
                  );
                }}
                className="bg-forest-green text-ivory px-3 py-1 text-sm font-bold hover:bg-deep-moss transition-colors border-2 border-deep-moss flex-1"
              >
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {documents.length === 0 && (
        <div className="text-center py-8 bg-soft-sage bg-opacity-50 border-2 border-deep-moss">
          <p className="text-deep-moss font-bold">No documents found</p>
          <p className="text-gray-600 text-sm mt-2">
            Documents will appear here once they are submitted for verification.
          </p>
        </div>
      )}
    </div>
  );
}
