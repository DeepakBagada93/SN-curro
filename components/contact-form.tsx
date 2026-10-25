"use client";

import { useState } from "react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("billing");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 p-6 text-center space-y-2">
        <span className="text-3xl">✓</span>
        <h3 className="font-semibold text-sm text-foreground">Message Received!</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Thank you for reaching out, <strong>{name}</strong>. Our support team has logged your inquiry and will respond to <strong>{email}</strong> within 24 business hours.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setMessage("");
          }}
          className="btn btn-outline btn-sm text-xs mt-3"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div>
        <label className="label" htmlFor="contact-name">Your Full Name</label>
        <input
          id="contact-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rahul Sharma"
          className="input"
        />
      </div>

      <div>
        <label className="label" htmlFor="contact-email">Email Address</label>
        <input
          id="contact-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@agency.com"
          className="input"
        />
      </div>

      <div>
        <label className="label" htmlFor="contact-phone">Phone / WhatsApp Number</label>
        <input
          id="contact-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          className="input"
        />
      </div>

      <div>
        <label className="label" htmlFor="contact-subject">Topic / Query Type</label>
        <select
          id="contact-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="input"
        >
          <option value="billing">Billing, Pricing or Payment (Cashfree)</option>
          <option value="support">Technical Support & Claim Ledger</option>
          <option value="enterprise">Agency / Custom Enterprise Plan</option>
          <option value="other">General Inquiry / Feedback</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="contact-msg">Your Message</label>
        <textarea
          id="contact-msg"
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us how we can help..."
          className="input resize-none"
        />
      </div>

      <button
        type="submit"
        className="btn btn-accent w-full text-xs font-semibold !py-2.5"
      >
        Send Message →
      </button>
    </form>
  );
}
