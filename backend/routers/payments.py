"""
routers/payments.py
────────────────────
Stripe payment integration — subscription checkout + webhook handler.

Endpoints:
  POST /api/payments/checkout         → Create Stripe checkout session (protected)
  POST /api/payments/webhook          → Handle Stripe events (public, Stripe-signed)
  GET  /api/payments/subscription     → Get user's current plan (protected)

Interview talking points:
  1. Checkout Session: we never handle card details — Stripe's hosted page does.
     This means we're NOT PCI compliant scope — huge win for a small team.
  2. Webhooks: Stripe POSTs events to us asynchronously. We MUST verify the
     webhook signature or anyone could fake a "payment succeeded" event.
  3. Idempotency: Stripe can send the same webhook multiple times. Always check
     if you've already processed an event before acting on it.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
import stripe
import os

from core.database import get_db
from core.security import decode_token
from models.user import User, PlanType
from schemas.user import CheckoutRequest, CheckoutResponse, SubscriptionStatus

router = APIRouter(prefix="/api/payments", tags=["Payments"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

# Your Stripe Price IDs — create these in Stripe Dashboard → Products
PRICE_IDS = {
    "pro":        os.getenv("STRIPE_PRO_PRICE_ID",        "price_pro_placeholder"),
    "enterprise": os.getenv("STRIPE_ENTERPRISE_PRICE_ID", "price_enterprise_placeholder"),
}


@router.post("/checkout", response_model=CheckoutResponse)
def create_checkout_session(
    body: CheckoutRequest,
    token_data: dict = Depends(decode_token),
    db: Session = Depends(get_db),
):
    """
    Creates a Stripe Checkout Session and returns the hosted payment URL.

    Flow: User clicks "Upgrade" → we create session → redirect to Stripe →
    user pays → Stripe redirects back → Stripe sends webhook → we update DB.
    """
    if not stripe.api_key:
        raise HTTPException(status_code=503, detail="Stripe not configured. Add STRIPE_SECRET_KEY to .env")

    if body.plan not in PRICE_IDS:
        raise HTTPException(status_code=400, detail=f"Invalid plan. Choose: {list(PRICE_IDS.keys())}")

    user = db.query(User).filter(User.id == int(token_data["sub"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        # Create or retrieve Stripe customer
        # Interview tip: Always create a Stripe Customer object and save the ID.
        # This lets you manage subscriptions, refunds, and billing history.
        if not user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.name,
                metadata={"user_id": str(user.id)}
            )
            user.stripe_customer_id = customer.id
            db.commit()

        session = stripe.checkout.Session.create(
            customer=user.stripe_customer_id,
            payment_method_types=["card"],
            line_items=[{"price": PRICE_IDS[body.plan], "quantity": 1}],
            mode="subscription",
            success_url=os.getenv("FRONTEND_URL", "http://localhost:3000") + "/dashboard?upgraded=true",
            cancel_url=os.getenv("FRONTEND_URL",  "http://localhost:3000") + "/pricing",
            metadata={"user_id": str(user.id), "plan": body.plan},
        )

        return CheckoutResponse(checkout_url=session.url)

    except stripe.StripeError as e:
        raise HTTPException(status_code=502, detail=f"Stripe error: {e.user_message}")


@router.post("/webhook", status_code=200)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    db: Session = Depends(get_db),
):
    """
    Stripe sends signed POST requests here on payment events.

    CRITICAL: Always verify the signature. Without this, anyone could POST
    a fake "payment succeeded" event and get a free subscription.

    Interview tip: This is the most important security detail in Stripe integration.
    Interviewers will ask about it — always mention signature verification.
    """
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, webhook_secret)
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature — possible fraud attempt.")

    # Handle subscription activated / renewed
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("metadata", {}).get("user_id")
        plan    = session.get("metadata", {}).get("plan", "pro")

        if user_id:
            user = db.query(User).filter(User.id == int(user_id)).first()
            if user:
                user.plan = PlanType(plan)
                user.stripe_subscription_id = session.get("subscription")
                db.commit()

    # Handle subscription cancelled
    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        user = db.query(User).filter(
            User.stripe_subscription_id == subscription["id"]
        ).first()
        if user:
            user.plan = PlanType.free
            user.stripe_subscription_id = None
            db.commit()

    return {"received": True}


@router.get("/subscription", response_model=SubscriptionStatus)
def get_subscription(
    token_data: dict = Depends(decode_token),
    db: Session = Depends(get_db),
):
    """Returns the current user's subscription plan."""
    user = db.query(User).filter(User.id == int(token_data["sub"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return SubscriptionStatus(
        plan=user.plan.value,
        stripe_customer_id=user.stripe_customer_id,
        stripe_subscription_id=user.stripe_subscription_id,
    )
