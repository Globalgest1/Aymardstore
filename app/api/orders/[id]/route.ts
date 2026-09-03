import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrderStatusInDb } from '@/lib/db';
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from '@/lib/admin-session';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const order = getOrderById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Commande introuvable.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Erreur lors de la récupération de la commande.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    if (!session.valid) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé : privilèges administrateur requis pour modifier le statut d’une commande.' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();

    const updated = updateOrderStatusInDb(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Commande introuvable.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Statut de la commande mis à jour avec succès.',
      order: updated
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Erreur lors de la mise à jour de la commande.' },
      { status: 500 }
    );
  }
}
