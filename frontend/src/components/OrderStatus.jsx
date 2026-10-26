import React from 'react';
import { Clock, CheckCircle2, ChefHat, Sparkles, XCircle, DollarSign, AlertCircle } from 'lucide-react';

export function OrderStatusBadge({ status }) {
  switch (status) {
    case 'PLACED':
      return (
        <span className="badge badge-info">
          <Clock size={12} /> Placed
        </span>
      );
    case 'ACCEPTED':
      return (
        <span className="badge badge-info">
          <CheckCircle2 size={12} /> Accepted
        </span>
      );
    case 'PREPARING':
      return (
        <span className="badge badge-warning">
          <ChefHat size={12} /> Preparing
        </span>
      );
    case 'READY':
      return (
        <span className="badge badge-success">
          <Sparkles size={12} /> Ready for Pickup
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="badge badge-neutral">
          <CheckCircle2 size={12} /> Completed
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="badge badge-danger">
          <XCircle size={12} /> Cancelled
        </span>
      );
    default:
      return <span className="badge badge-neutral">{status}</span>;
  }
}

export function PaymentStatusBadge({ paymentStatus }) {
  if (paymentStatus === 'PAID') {
    return (
      <span className="badge badge-success">
        <DollarSign size={12} /> Cash Paid
      </span>
    );
  }
  return (
    <span className="badge badge-warning">
      <AlertCircle size={12} /> Cash Unpaid (Pay at Counter)
    </span>
  );
}
