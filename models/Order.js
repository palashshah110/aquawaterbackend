const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
      },
      email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
      },
      phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
      },
    },
    shippingAddress: {
      address: {
        type: String,
        required: [true, 'Address is required'],
      },
      city: {
        type: String,
        required: [true, 'City is required'],
      },
      state: {
        type: String,
        required: [true, 'State is required'],
      },
      pincode: {
        type: String,
        required: [true, 'Pincode is required'],
      },
    },
    product: {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
      image: {
        type: String,
      },
    },
    payment: {
      razorpayOrderId: {
        type: String,
      },
      razorpayPaymentId: {
        type: String,
      },
      razorpaySignature: {
        type: String,
      },
      method: {
        type: String,
        enum: ['razorpay', 'cod'],
        default: 'razorpay',
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending',
      },
    },
    subtotal: {
      type: Number,
      required: true,
    },
    shippingCharge: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    trackingNumber: {
      type: String,
    },
    notes: {
      type: String,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Generate order ID before saving
orderSchema.pre('save', async function () {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `SF${Date.now().toString().slice(-6)}${(count + 1).toString().padStart(4, '0')}`;
  }
});

// Index for searching orders
orderSchema.index({ orderId: 1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
