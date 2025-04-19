import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/auth-middleware';
import { AuditLogService } from '../../../../lib/services/AuditLogService';

export async function GET(request: NextRequest) {
  try {
    // Verify the authentication token
    const authResult = await verifyAuth(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Get user ID from token
    const uid = authResult.decodedToken.uid;

    // Get admin wallet address from environment variable
    const adminWalletAddress =
      process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS ||
      '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c';

    // Get wallet address from token
    const tokenWalletAddress =
      authResult.decodedToken.walletAddress ||
      authResult.decodedToken.wallet_address ||
      authResult.decodedToken.wallet;

    // Check if user is admin by wallet address or admin flag
    let isAdmin = authResult.decodedToken.admin === true;

    // If not, check if the wallet address matches the admin wallet address
    if (!isAdmin && tokenWalletAddress) {
      isAdmin =
        tokenWalletAddress.toLowerCase() === adminWalletAddress.toLowerCase();
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Get all audit logs
    const auditLogs = await AuditLogService.getAllAuditLogs();

    return NextResponse.json(auditLogs);
  } catch (error: any) {
    console.error('Error getting audit logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get audit logs' },
      { status: 500 }
    );
  }
}
