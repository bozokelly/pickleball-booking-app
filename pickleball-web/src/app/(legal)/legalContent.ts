export type LegalSection = {
  title: string;
  body: string[];
};

export const lastUpdated = '22 June 2026';
export const contactEmail = 'support@bookadink.com';

export const termsSections: LegalSection[] = [
  {
    title: '1. Accepting these terms',
    body: [
      'By creating an account, signing in, booking a game, joining a club, or otherwise using Bookadink, you agree to these Terms of Service.',
      'If you use Bookadink on behalf of a club, venue, or organisation, you confirm that you are authorised to manage that club presence on Bookadink.',
    ],
  },
  {
    title: '2. Accounts and profile information',
    body: [
      'You are responsible for keeping your account details accurate and for keeping your sign-in credentials secure.',
      'Profile information, including your name, contact details, avatar, skill level, and DUPR information where supplied, may be shown to clubs, organisers, and other players where needed for bookings, memberships, chat, attendance, or game administration.',
    ],
  },
  {
    title: '3. Club-created games, events, and memberships',
    body: [
      'Clubs and authorised club admins may create games, sessions, events, membership tiers, waitlists, club posts, images, and rules for their communities.',
      'Club admins are responsible for keeping their game details, venue details, conduct rules, membership settings, pricing, and cancellation policy information accurate.',
    ],
  },
  {
    title: '4. Bookings, waitlists, cancellations, and credits',
    body: [
      'When you book a game, you agree to the game details shown at the time of booking, including price, time, venue, format, waitlist status, and any club cancellation terms.',
      'Some clubs use Bookadink-managed cancellation windows and credits. Other clubs may use their own club-managed cancellation policy. Where a club-managed policy applies, the club is responsible for applying that policy.',
      'Credits may be issued for eligible cancellations, waitlist replacements, or admin actions. Credits are generally tied to the relevant club and may not be cash unless Bookadink or the club states otherwise.',
    ],
  },
  {
    title: '5. Paid bookings and Stripe',
    body: [
      'Paid bookings and eligible club subscription payments are processed through Stripe. Bookadink may receive payment status, amount, currency, booking, subscription, and customer metadata needed to confirm payments and reconcile bookings.',
      'Bookadink does not directly store your full card number, CVC, or raw payment credentials. Stripe handles card and payment method details under Stripe terms and policies.',
    ],
  },
  {
    title: '6. User conduct',
    body: [
      'Use Bookadink respectfully and lawfully. Do not harass other users, impersonate another person, post unlawful content, interfere with bookings, misuse club admin tools, or attempt to access systems or data you are not authorised to use.',
      'Bookadink may restrict, suspend, or remove access where needed to protect users, clubs, payments, platform integrity, or legal obligations.',
    ],
  },
  {
    title: '7. Chat, posts, comments, and images',
    body: [
      'You are responsible for content you upload or post, including club chat messages, posts, comments, images, session results, and shared media.',
      'You confirm you have the rights and permissions needed to post your content. Bookadink may remove content or limit access if it appears unsafe, unlawful, abusive, misleading, infringing, or inconsistent with club or platform rules.',
    ],
  },
  {
    title: '8. DUPR and rating information',
    body: [
      'Bookadink may display DUPR or other rating information you provide or that is available to the app. Ratings are shown to help organise games and are not guaranteed to be current, complete, or independently verified by Bookadink.',
    ],
  },
  {
    title: '9. Availability and changes',
    body: [
      'Bookadink is provided on an as-available basis. We may update, pause, limit, or remove features during launch, beta, maintenance, security work, or as the product evolves.',
      'We do not guarantee uninterrupted availability, that every booking or notification will be error-free, or that every club or venue will remain available.',
    ],
  },
  {
    title: '10. Limitation of liability',
    body: [
      'To the extent permitted by law, Bookadink is not liable for indirect loss, lost profits, missed games, club decisions, venue issues, player conduct, payment provider outages, or data loss arising from use of the app.',
      'Nothing in these terms limits rights that cannot be excluded under Australian Consumer Law or other applicable laws.',
    ],
  },
  {
    title: '11. Changes to these terms',
    body: [
      'We may update these terms from time to time. The latest version will show a new Last updated date. Continued use of Bookadink after an update means you accept the updated terms.',
    ],
  },
  {
    title: '12. Contact',
    body: [`Questions about these terms can be sent to ${contactEmail}.`],
  },
];

export const privacySections: LegalSection[] = [
  {
    title: '1. Information we collect',
    body: [
      'Bookadink may collect account and profile information, such as your name, email, phone number, avatar, skill level, DUPR rating, emergency contact, notification preferences, and club membership status.',
      'We collect booking, waitlist, attendance, credit, review, club membership, club admin, and payment metadata needed to operate games, clubs, memberships, credits, and subscriptions.',
      'We may collect content you create or upload, including club chat messages, posts, comments, images, session results, and reports.',
      'We may collect device, app, diagnostics, crash, network, and security information needed to keep Bookadink reliable and secure.',
    ],
  },
  {
    title: '2. Location and search behaviour',
    body: [
      'Bookadink may use your device location or a suburb search to show nearby clubs, venues, and games when you choose to use nearby discovery features.',
      'Bookadink does not save your suburb, postcode, or last-known location to disk or UserDefaults. If location is unavailable or not allowed, the app falls back to Search your area and lets you enter a suburb.',
      'Clubs and venues may store venue latitude, longitude, suburb, and address information in the database so players can find where games are held.',
    ],
  },
  {
    title: '3. Payments through Stripe',
    body: [
      'Stripe processes card and payment method details for paid bookings and eligible club subscription payments. Bookadink does not directly store full card numbers, CVCs, or raw payment credentials.',
      'Bookadink may store or receive Stripe-related metadata such as payment status, booking identifiers, customer identifiers, subscription status, price, currency, and timestamps so bookings and club billing can work.',
    ],
  },
  {
    title: '4. Supabase backend and storage',
    body: [
      'Bookadink uses Supabase for backend services including authentication, database records, realtime updates, edge functions, and storage.',
      'Images and other user-uploaded media may be stored in Supabase Storage and may be visible to clubs, members, or users depending on the feature and access rules.',
    ],
  },
  {
    title: '5. Notifications',
    body: [
      'If you enable notifications, Bookadink may use push tokens and notification preferences to send game reminders, booking updates, club chat alerts, membership updates, cancellation notices, waitlist promotions, achievements, and other app-related messages.',
      'You can manage notification preferences in the app and operating system settings. Some transactional or safety-related messages may still appear in-app.',
    ],
  },
  {
    title: '6. How we use information',
    body: [
      'We use information to create and manage accounts, operate bookings and waitlists, process credits, support payments, show nearby games, manage clubs and memberships, display ratings, send notifications, support chat, prevent misuse, debug issues, and improve Bookadink.',
    ],
  },
  {
    title: '7. Sharing with clubs and service providers',
    body: [
      'Bookadink shares relevant information with clubs and authorised club admins where needed for bookings, attendance, memberships, admin operations, club chat, cancellations, credits, safety, and support.',
      'We use service providers such as Supabase, Stripe, Apple, Google, Firebase, and other infrastructure providers where needed to run the app, process payments, send notifications, or maintain security.',
    ],
  },
  {
    title: '8. Retention and deletion',
    body: [
      'We keep information for as long as needed to provide Bookadink, meet legal or accounting obligations, resolve disputes, prevent abuse, and maintain reliable booking, payment, membership, and audit records.',
      `You can request access, correction, or deletion of your account information by contacting ${contactEmail}. Some records may need to be retained where required for legal, security, payment, audit, or club administration reasons.`,
    ],
  },
  {
    title: '9. Australian privacy context',
    body: [
      'Bookadink is operated for Australian users and clubs. We aim to handle personal information consistently with applicable Australian privacy principles and consumer protection obligations.',
      'If you are outside Australia, your information may still be processed using the providers and infrastructure needed to operate Bookadink.',
    ],
  },
  {
    title: '10. Contact',
    body: [`Questions or privacy requests can be sent to ${contactEmail}.`],
  },
];
