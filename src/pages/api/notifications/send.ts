import type { APIRoute } from 'astro';
import { emailService, EmailType, EmailPriority } from '../../../lib/email/email-service';
import { notificationAutomationService, NotificationTrigger } from '../../../lib/email/notification-automation';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { 
      type, 
      trigger, 
      recipientEmail, 
      data = {}, 
      priority = EmailPriority.NORMAL,
      scheduleFor 
    } = body;

    // Validate required fields
    if (!recipientEmail) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Recipient email is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let result;

    if (trigger) {
      // Use notification automation system
      await notificationAutomationService.processNotification({
        trigger: trigger as NotificationTrigger,
        recipientEmail,
        data,
        priority,
        scheduleFor: scheduleFor ? new Date(scheduleFor) : undefined
      });
      
      result = { success: true, message: 'Notification processed' };
    } else if (type) {
      // Direct email sending
      const subject = data.subject || `Troy BBQ - ${type}`;
      
      result = await emailService.sendEmail({
        to: recipientEmail,
        subject,
        type: type as EmailType,
        priority,
        data
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Either type or trigger must be specified'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Notification API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};