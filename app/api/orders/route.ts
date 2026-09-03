import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, getOrdersByCustomer, createOrderInDb } from '@/lib/db';
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from '@/lib/admin-session';
import { Order } from '@/lib/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get('email');

    // Check if requester is authenticated as Admin
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const adminSession = await verifyAdminSessionToken(token);

    if (adminSession.valid) {
      if (emailParam) {
        const customerOrders = getOrdersByCustomer(emailParam);
        return NextResponse.json({ success: true, count: customerOrders.length, orders: customerOrders });
      }
      const allOrders = getAllOrders();
      return NextResponse.json({ success: true, count: allOrders.length, orders: allOrders });
    }

    // Non-admin: requires email param to view own orders
    if (!emailParam) {
      return NextResponse.json(
        { success: false, error: 'Email requis pour consulter les commandes.' },
        { status: 400 }
      );
    }

    const customerOrders = getOrdersByCustomer(emailParam);
    return NextResponse.json({ success: true, count: customerOrders.length, orders: customerOrders });
  } catch (err: any) {
    console.error('[API Orders GET Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Erreur lors de la récupération des commandes.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      items, 
      total, 
      currency = 'EUR', 
      customerEmail, 
      shippingAddress, 
      paymentMethod = 'COD', 
      paymentStatus = 'UNPAID',
      discountApplied = 0,
      promoCodeUsed = null,
      trackingNumber = null,
      carrierName = null,
      carrierPhone = null
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Le panier de commande est vide.' },
        { status: 400 }
      );
    }

    if (!customerEmail || typeof customerEmail !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email client manquant ou invalide.' },
        { status: 400 }
      );
    }

    const orderNumber = body.orderNumber || `AYM-${Math.floor(100000 + Math.random() * 900000)}`;
    const id = body.id || `ord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const orderData: Order = {
      id,
      orderNumber,
      date: new Date().toISOString(),
      customerEmail: customerEmail.toLowerCase().trim(),
      total: Number(total),
      currency: currency as 'EUR' | 'FCFA',
      discountApplied: Number(discountApplied) || undefined,
      promoCodeUsed: promoCodeUsed || undefined,
      status: 'PENDING',
      paymentStatus: paymentStatus as any,
      paymentMethod,
      shippingAddress: shippingAddress || {
        fullName: 'Client Aymard Store',
        street: '',
        city: 'Cotonou',
        zipCode: '00000',
        country: 'Bénin',
        phone: ''
      },
      items,
      trackingNumber: trackingNumber || undefined,
      carrierName: carrierName || 'Coursier Express Aymard',
      carrierPhone: carrierPhone || '+229 01 97 36 29 06',
      trackingStep: 1,
      trackingStatusText: 'Commande enregistrée dans la base nationale sécurisée',
    };

    const createdOrder = createOrderInDb(orderData);

    return NextResponse.json({
      success: true,
      message: 'Commande enregistrée avec succès dans la base relationnelle.',
      order: createdOrder
    }, { status: 201 });

  } catch (err: any) {
    console.error('[API Orders POST Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Erreur lors de la création de la commande.' },
      { status: 500 }
    );
  }
}
