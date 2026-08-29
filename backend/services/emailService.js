const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send email
const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: `"E-Sparkle Jewelry" <${process.env.EMAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Email sending error:', error);
        throw new Error('Failed to send email');
    }
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
    const html = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h1 style="color: #d4af37; text-align: center;">Welcome to E-Sparkle! ✨</h1>
            <p>Dear ${user.name},</p>
            <p>Thank you for joining the E-Sparkle family! We're thrilled to have you with us.</p>
            <p>Start exploring our exquisite collection of premium jewelry:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}" style="display: inline-block; padding: 12px 30px; background: #d4af37; color: #000; text-decoration: none; border-radius: 5px;">
                    Shop Now
                </a>
            </div>
            <p style="font-size: 14px; color: #888;">Best regards,<br>E-Sparkle Team 💎</p>
        </div>
    `;

    return sendEmail({
        to: user.email,
        subject: 'Welcome to E-Sparkle Jewelry! ✨',
        html
    });
};

// Send order confirmation
const sendOrderConfirmation = async (order, user) => {
    const itemsHtml = order.items.map(item => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
        </tr>
    `).join('');

    const html = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h1 style="color: #d4af37; text-align: center;">Order Confirmation 📦</h1>
            <p>Dear ${user.name},</p>
            <p>Thank you for your order! Here are the details:</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>Status:</strong> ${order.status}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background: #d4af37; color: #000;">
                        <th style="padding: 10px; text-align: left;">Product</th>
                        <th style="padding: 10px; text-align: center;">Quantity</th>
                        <th style="padding: 10px; text-align: right;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                    <tr>
                        <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                        <td style="padding: 10px; text-align: right; font-weight: bold; color: #d4af37;">$${order.totalAmount.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <div style="margin: 20px 0;">
                <h3>Shipping Address</h3>
                <p>
                    ${order.shippingAddress.fullName}<br>
                    ${order.shippingAddress.address}<br>
                    ${order.shippingAddress.city}, ${order.shippingAddress.zipCode}<br>
                    ${order.shippingAddress.country}<br>
                    Phone: ${order.shippingAddress.phone}
                </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/orders/${order._id}" style="display: inline-block; padding: 12px 30px; background: #d4af37; color: #000; text-decoration: none; border-radius: 5px;">
                    View Order
                </a>
            </div>

            <p style="font-size: 14px; color: #888;">If you have any questions, feel free to contact us.</p>
            <p style="font-size: 14px; color: #888;">Best regards,<br>E-Sparkle Team 💎</p>
        </div>
    `;

    return sendEmail({
        to: user.email,
        subject: `Order Confirmation #${order.orderNumber}`,
        html
    });
};

// Send order status update
const sendOrderStatusUpdate = async (order, user) => {
    const html = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h1 style="color: #d4af37; text-align: center;">Order Status Update 📦</h1>
            <p>Dear ${user.name},</p>
            <p>Your order #${order.orderNumber} has been <strong>${order.status}</strong>.</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <p><strong>Total:</strong> $${order.totalAmount.toFixed(2)}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/orders/${order._id}" style="display: inline-block; padding: 12px 30px; background: #d4af37; color: #000; text-decoration: none; border-radius: 5px;">
                    View Order
                </a>
            </div>

            <p style="font-size: 14px; color: #888;">Best regards,<br>E-Sparkle Team 💎</p>
        </div>
    `;

    return sendEmail({
        to: user.email,
        subject: `Order #${order.orderNumber} - ${order.status}`,
        html
    });
};

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendOrderConfirmation,
    sendOrderStatusUpdate
};