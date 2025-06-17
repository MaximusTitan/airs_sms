# Email Batching and Rate Limiting Implementation

## Overview
Updated the email sending API routes to handle Resend's rate limits and batching capabilities according to their specifications:

### Resend Specifications:
- **Rate Limit**: 2 requests per second (default)
- **Batch Endpoint**: Up to 100 emails per API request
- **Recipients per Email**: Maximum 50 recipients per individual email
- **Idempotency**: Supported with idempotency keys

### Implementation Details:

#### 1. Email Sending Strategy:
- **≤50 recipients**: Single email with all recipients in BCC (blind carbon copy) for privacy
- **>50 recipients**: Use batch endpoint with chunks of 50 recipients per email (BCC)
- **Rate limiting**: 500ms delay between batch requests (stays under 2 req/sec)
- **Idempotency**: Unique keys for each email/batch to prevent duplicates
- **Privacy**: All recipients are hidden from each other using BCC

#### 2. Database Updates:
- Added `partially_sent` status for emails that partially succeeded
- Updated TypeScript types to include new status
- Enhanced error handling and status tracking

#### 3. UI Enhancements:
- Updated email composer to show batch information in success messages
- Added "Partial" status card in email dashboard
- Enhanced status icons and colors for partially sent emails
- Better feedback for partial successes vs complete failures

#### 4. Files Updated:
- `/app/api/emails/send/route.ts` - Main email sending logic with batching
- `/app/api/groups/bulk-email/route.ts` - Group bulk email with batching
- `/components/emails/email-composer.tsx` - Enhanced UI feedback
- `/components/emails/emails-list.tsx` - New status handling
- `/lib/types/database.ts` - Added partially_sent status type
- `/database/schema.sql` - Updated status constraint
- `/database/migrations/add_partially_sent_status.sql` - Migration file

#### 5. Benefits:
- **Scalability**: Can send thousands of emails efficiently
- **Reliability**: Handles partial failures gracefully
- **Rate Limit Compliance**: Stays within Resend's limits
- **Privacy & Security**: Recipients cannot see each other's email addresses (BCC)
- **User Experience**: Clear feedback on send status
- **Data Integrity**: Proper tracking of all send attempts

#### 6. Usage:
Users can now click "Send Email" or "Send Bulk Email" and the system will:
1. Automatically batch large recipient lists
2. Handle rate limiting transparently
3. Provide detailed feedback on success/partial success/failure
4. Store accurate status information in the database

This implementation ensures reliable, scalable email sending that respects Resend's API limits while providing excellent user experience and maintaining recipient privacy through BCC.
