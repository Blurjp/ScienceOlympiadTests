'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';

const SUPPORT_EMAIL = 'support@aitrove.ai';

const SUBJECTS = [
  'General question',
  'Bug report',
  'Feature request',
  'Billing / subscription',
  'Content feedback',
  'Other',
];

type Status = 'idle' | 'sending' | 'sent' | 'fallback' | 'error';

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [fallbackBody, setFallbackBody] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: SUBJECTS[0],
    message: '',
    company: '', // honeypot - hidden from real users
  });

  const update = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    `[Science Olympiad Tests] ${form.subject}`
  )}&body=${encodeURIComponent(fallbackBody)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('sent');
        return;
      }

      // Server can't send email (or failed) - offer the user's own email client
      const bodyText = `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`;
      setFallbackBody(bodyText);
      setStatus(response.status === 503 || data.emailNotConfigured ? 'fallback' : 'error');
      setErrorMessage(data.error || 'Something went wrong. Please try again.');
    } catch {
      setFallbackBody(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
      setStatus('error');
      setErrorMessage('Network error - please try again or email us directly.');
    }
  };

  if (status === 'sent') {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          <h3 className="mt-4 text-xl font-semibold text-gray-900">Message sent!</h3>
          <p className="mt-2 text-gray-600">
            Thanks for reaching out. We&apos;ll get back to you at the email you provided,
            usually within 1-2 business days.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          <CardTitle>Send us a message</CardTitle>
        </div>
        <CardDescription>
          Questions, bug reports, feature ideas, or billing issues - we read everything.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(status === 'fallback' || status === 'error') && (
          <div className="mb-4 p-3 rounded-md border border-amber-200 bg-amber-50 flex gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p>{errorMessage}</p>
              <p className="mt-1">
                You can also email us directly at{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium underline">
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot - hidden from users, catches bots */}
          <input
            type="text"
            name="company"
            value={form.company}
            onChange={update('company')}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="contact-name">Name</Label>
              <Input
                id="contact-name"
                value={form.name}
                onChange={update('name')}
                placeholder="Your name"
                maxLength={100}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contact-email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contact-email"
                type="email"
                required
                value={form.email}
                onChange={update('email')}
                placeholder="you@example.com"
                maxLength={254}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="contact-subject">Topic</Label>
            <select
              id="contact-subject"
              value={form.subject}
              onChange={update('subject')}
              className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="contact-message">
              Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="contact-message"
              required
              minLength={10}
              maxLength={5000}
              value={form.message}
              onChange={update('message')}
              placeholder="How can we help?"
              rows={6}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-500">{form.message.length}/5000 characters</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={status === 'sending'} className="gap-2">
              {status === 'sending' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
            {status === 'fallback' && (
              <a href={mailtoHref}>
                <Button type="button" variant="outline" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Open in your email client
                </Button>
              </a>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
