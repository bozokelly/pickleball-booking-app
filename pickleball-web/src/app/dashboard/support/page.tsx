'use client';

import { Card } from '@/components/ui';
import { HelpCircle, MessageSquare, FileText, Mail } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Support</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-6 hover:shadow-md transition-shadow">
          <HelpCircle className="h-8 w-8 text-primary mb-3" />
          <h3 className="text-lg font-semibold text-text-primary">FAQ</h3>
          <p className="text-sm text-text-secondary mt-1">Find answers to commonly asked questions about bookings, clubs, and payments.</p>
        </Card>

        <Card className="p-6 hover:shadow-md transition-shadow">
          <MessageSquare className="h-8 w-8 text-primary mb-3" />
          <h3 className="text-lg font-semibold text-text-primary">Contact Us</h3>
          <p className="text-sm text-text-secondary mt-1">Need help? Reach out to our team and we&apos;ll get back to you as soon as possible.</p>
          <a href="mailto:support@bookadink.com" className="text-sm text-primary hover:underline mt-2 inline-block">
            support@bookadink.com
          </a>
        </Card>

        <Card className="p-6 hover:shadow-md transition-shadow">
          <FileText className="h-8 w-8 text-primary mb-3" />
          <h3 className="text-lg font-semibold text-text-primary">Getting Started</h3>
          <p className="text-sm text-text-secondary mt-1">New to Book a Dink? Learn how to find clubs, join games, and manage your bookings.</p>
        </Card>

        <Card className="p-6 hover:shadow-md transition-shadow">
          <Mail className="h-8 w-8 text-primary mb-3" />
          <h3 className="text-lg font-semibold text-text-primary">Feedback</h3>
          <p className="text-sm text-text-secondary mt-1">Have a suggestion or feature request? We&apos;d love to hear from you.</p>
        </Card>
      </div>
    </div>
  );
}
