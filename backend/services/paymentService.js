const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create payment intent
const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency,
            metadata: metadata,
            automatic_payment_methods: {
                enabled: true
            }
        });

        return {
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        };
    } catch (error) {
        console.error('Stripe payment intent error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Confirm payment
const confirmPayment = async (paymentIntentId) => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        return {
            success: true,
            paymentIntent
        };
    } catch (error) {
        console.error('Stripe confirm payment error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Create refund
const createRefund = async (paymentIntentId, amount = null) => {
    try {
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: amount ? Math.round(amount * 100) : undefined
        });

        return {
            success: true,
            refund
        };
    } catch (error) {
        console.error('Stripe refund error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Verify webhook signature
const verifyWebhookSignature = (payload, signature, webhookSecret) => {
    try {
        const event = stripe.webhooks.constructEvent(
            payload,
            signature,
            webhookSecret || process.env.STRIPE_WEBHOOK_SECRET
        );
        return {
            success: true,
            event
        };
    } catch (error) {
        console.error('Webhook verification error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Handle Stripe webhook events
const handleWebhookEvent = async (event) => {
    const { type, data } = event;

    switch (type) {
        case 'payment_intent.succeeded':
            console.log('✅ Payment succeeded:', data.object.id);
            // Update order status here
            break;
        case 'payment_intent.payment_failed':
            console.log('❌ Payment failed:', data.object.id);
            // Update order status here
            break;
        case 'charge.refunded':
            console.log('↩️ Payment refunded:', data.object.id);
            // Update order status here
            break;
        default:
            console.log('Unhandled webhook event:', type);
    }

    return { success: true };
};

module.exports = {
    createPaymentIntent,
    confirmPayment,
    createRefund,
    verifyWebhookSignature,
    handleWebhookEvent
};