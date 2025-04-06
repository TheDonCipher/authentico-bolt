import React from 'react';
import { PinataSDK } from 'pinata'
import AuthenticoContractAbi from 'public/contractsData/AuthenticoContract.json';
import AuthenticoContractAddress from 'public/contractsData/AuthenticoContract-address.json';
import { ethers } from 'ethers';
const pinata = new PinataSDK({
  pinataJwt: "PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlZjc2ZTIzNy00YTBmLTQ0ODQtYjcxOC01YjBkZmE1YjRlNGIiLCJlbWFpbCI6ImJvcm4yY29kZTI2NUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiOTA4YTY1NWRhY2ZmOTBlNGVhN2QiLCJzY29wZWRLZXlTZWNyZXQiOiJmZDBlMjU2ZTY1YTRjNGQ0Y2ZjNmRjYTFhMTQzZDg4MGYyYTVhZmE4MTEzNmVmZDU1NTlhMmNhZGUzZmNlN2I1IiwiZXhwIjoxNzcxNzcxMTY3fQ.a88wzEUwAl5W80kF9XyFZe47UsYj6oPbWBGK3yteouM",
  pinataGateway: 'pink-capitalist-rook-863.mypinata.cloud',
})

interface Document {
  documentId: number;
  documentType: string;
  status: string;
  publicAddress: string;
  metadataHash: string;
  urlPicture: string;
  verifier: string;
}

interface Props {
  documents: Document[];
}

export default function DocumentTable({
  documents,
}: {
  documents: Document[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-4 border-[#4A5043] bg-[#F5F5F0]">
            <th className="px-4 py-3 text-left font-black text-[#2C3639]">
              Document
            </th>
            <th className="px-4 py-3 text-left font-black text-[#2C3639]">
              Status
            </th>
            <th className="px-4 py-3 text-left font-black text-[#2C3639]">
              Holder
            </th>
            <th className="px-4 py-3 text-left font-black text-[#2C3639]">
              Metadata Hash
            </th>
            <th className="px-4 py-3 text-left font-black text-[#2C3639]">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr
              key={doc.documentId}
              className="border-b-2 border-[#4A5043] hover:bg-[#F5F5F0]"
            >
              <td className="px-4 py-4 font-medium text-[#2C3639]">
                {doc.documentType}
              </td>
              <td className="px-4 py-4">
                <span
                  className={`px-3 py-1 text-sm font-bold border-2 border-[#4A5043]
                  ${doc.status == '1'
                      ? 'bg-[#E8EFE6] text-[#4A6741]'
                      : doc.status == '0'
                        ? 'bg-[#F2EBE3] text-[#8B7355]'
                        : 'bg-[#F5E6E8] text-[#A65D57]'
                    }`}
                >
                  {doc.status == '0'
                    ? 'Pending'
                    : doc.status == '1'
                      ? 'Verified'
                      : 'Rejected'}
                </span>
              </td>
              <td className="px-4 py-4 text-[#2C3639]">
                {doc.publicAddress.slice(0, 3)}... {doc.publicAddress.slice(-3)}
              </td>
              <td className="px-4 py-4 text-[#2C3639]">
                <button
                  type='button'
                  onClick={() => {
                    const gatewayUrl = `https://pink-capitalist-rook-863.mypinata.cloud/ipfs/${doc.urlPicture}`;
                    const fallbackUrl = `https://ipfs.io/ipfs/${doc.urlPicture}`;
                    window.open(fallbackUrl, '_blank').onerror = () => {
                      window.open(fallbackUrl, '_blank');
                    };
                  }}
                  className="bg-[#4A5043] text-white px-4 py-2 font-bold hover:bg-[#5C6354] transition-colors border-2 border-[#4A5043]"
                >
                  View Metadata
                </button>
              </td>
              <td className="px-4 py-4">
                <button
                  type='button'
                  onClick={async () => {
                    console.log('------window.ethereum-----', window.ethereum);
                    await window.ethereum.enable();

                    const provider = new ethers.providers.Web3Provider(window.ethereum);
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

                    const verifyDoc = await AuthenticoContract.verifyDocument(doc.documentId);
                    console.log('Document verified:', verifyDoc);
                    const tx = await verifyDoc.wait();
                    console.log('Transaction:', tx);
                    const txHash = tx.transactionHash;
                    console.log('Transaction hash:', txHash);
                    const docNewStatus = await AuthenticoContract.getDocumentDetailsByID(doc.documentId);
                    console.log('Document status:', docNewStatus.status.toString());

                  }}
                  className="bg-[#4A5043] text-white px-4 py-2 font-bold hover:bg-[#5C6354] transition-colors border-2 border-[#4A5043]">
                  Approve
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}