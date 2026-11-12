export const labels = { PENDING: 'Assigned', PICKED_UP: 'Picked Up', IN_TRANSIT: 'In Transit', OUT_FOR_DELIVERY: 'Out for Delivery', DELIVERED: 'Delivered', FAILED: 'Failed' };
export const transitions = { PENDING: ['PICKED_UP'], PICKED_UP: ['IN_TRANSIT'], IN_TRANSIT: ['OUT_FOR_DELIVERY'], OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'], DELIVERED: [], FAILED: [] };
export const reasons = ['Recipient not available', 'Wrong address', 'Refused by recipient', 'Phone not answering', 'Other'];
export const isComplete = status => ['DELIVERED', 'FAILED'].includes(status);
export function validateUpdate(delivery, update) {
  if (!transitions[delivery.status]?.includes(update.status)) throw new Error('This status change is not allowed. Refresh and try again.');
  if (update.version !== delivery.version) throw new Error('This delivery changed. Refresh before saving.');
  if (update.status === 'DELIVERED' && !update.recipientName?.trim() && !update.proofId) throw new Error('Add a recipient name or photo proof.');
  if (update.recipientName?.length > 120 || update.note?.length > 1000) throw new Error('Recipient names allow 120 characters; notes allow 1,000.');
  if (update.status === 'FAILED' && !reasons.includes(update.failureReason)) throw new Error('Select a failure reason.');
  if (update.status === 'FAILED' && update.failureReason === 'Other' && !update.note?.trim()) throw new Error('Describe the reason in the note.');
}
