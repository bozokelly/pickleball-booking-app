export type LegalSection = {
  title: string;
  body: string[];
};

export const lastUpdated = '22 June 2026';
export const contactEmail = 'support@bookadink.com';
export const accountDeletionPath = '/account-deletion';

export const termsSections: LegalSection[] = [
  {
    title: '1. Accepting these terms',
    body: [
      'By creating an account, signing in, booking a game, joining a club, managing a club, or otherwise using Bookadink, you agree to these Terms of Service.',
      'If you use Bookadink on behalf of a club, venue, business, or organisation, you confirm that you are authorised to manage that club presence and bind that organisation to these terms.',
    ],
  },
  {
    title: '2. Accounts and eligibility',
    body: [
      'You must be at least 16 years old to use Bookadink. If local law requires a higher age for online services, that higher age applies. Bookadink is not directed to children under 16.',
      'You are responsible for keeping your account details accurate, keeping your sign-in credentials secure, and telling us if you believe your account has been misused.',
      'Profile information, including your name, contact details, avatar, skill level, and DUPR information where supplied, may be shown to clubs, organisers, and other players where needed for bookings, memberships, chat, attendance, ratings, reviews, or game administration.',
    ],
  },
  {
    title: '3. What Bookadink provides',
    body: [
      'Bookadink provides software for discovering clubs and games, managing bookings, waitlists, memberships, payments, credits, notifications, club chat, posts, images, results, and related community features.',
      'Clubs, organisers, coaches, venues, and admins are independent from Bookadink unless we clearly state otherwise. Bookadink is not responsible for club decisions, player conduct, venue conditions, weather, parking, access, equipment, coaching quality, or the running of club-managed sessions.',
    ],
  },
  {
    title: '4. Club-created games, events, and memberships',
    body: [
      'Clubs and authorised club admins may create games, sessions, events, membership tiers, waitlists, posts, images, rules, and pricing for their communities.',
      'Club admins are responsible for keeping their game details, venue details, conduct rules, membership settings, pricing, Stripe Connect and payout information, and cancellation policy information accurate.',
      'Clubs may offer member pricing, priority booking, early access, membership tiers, or other benefits. Priority booking or membership does not guarantee a game spot unless the club clearly states otherwise.',
    ],
  },
  {
    title: '5. Bookings, waitlists, cancellations, and credits',
    body: [
      'When you book a game, you agree to the game details shown at the time of booking, including price, time, venue, format, capacity, waitlist status, and any club cancellation terms.',
      'A booking is only confirmed when the Bookadink app or backend marks it as confirmed. Waitlist placement does not guarantee a spot, and waitlist promotions or payment holds may expire.',
      'You are responsible for checking your booking status and notification settings. Notifications are helpful reminders, but delivery is not guaranteed.',
      'Some clubs use Bookadink-managed cancellation windows and credits. Other clubs use their own club-managed cancellation policy. Where a club-managed policy applies, the club is responsible for deciding and applying that policy unless Bookadink is legally required to act.',
      'Credits may be issued for eligible cancellations, waitlist replacements, or admin actions. Credits are generally tied to the relevant club, may be non-transferable, and are not redeemable for cash unless Bookadink or the club states otherwise.',
    ],
  },
  {
    title: '6. Paid bookings, subscriptions, and Stripe',
    body: [
      'Paid bookings and eligible club subscription payments may be processed by Stripe or Stripe Connect. Prices may vary by club, venue, game, membership tier, plan, and payment method.',
      'Bookadink does not directly store your full card number, CVC, or raw payment credentials. Stripe handles card and payment method details under Stripe terms and policies.',
      'Bookadink may receive payment status, amount, currency, booking, refund, subscription, customer, connected account, and reconciliation metadata needed to confirm payments, process credits, support disputes, and keep booking and club billing records accurate.',
      'Refunds and credits depend on the applicable game or club policy, payment state, and any rights you have under Australian Consumer Law or other applicable laws.',
    ],
  },
  {
    title: '7. Club subscription plans',
    body: [
      'Clubs may pay Bookadink for subscription plans. Plan limits may affect game limits, member limits, analytics, recurring games, delayed publishing, payments, support, or other features.',
      'Bookadink may update plans, pricing, and features from time to time with reasonable notice where required. Clubs are responsible for maintaining accurate billing, tax, Stripe Connect, payout, and admin information.',
    ],
  },
  {
    title: '8. User conduct',
    body: [
      'Use Bookadink respectfully and lawfully. Do not harass, abuse, discriminate, threaten, stalk, spam, defraud, impersonate another person, create fake accounts, share accounts to evade restrictions, post unlawful content, abuse payments, misuse club admin tools, or attempt to access systems or data you are not authorised to use.',
      'Do not create fake bookings, placeholder players, inflated attendance, duplicate accounts, review manipulation, rating manipulation, waitlist manipulation, credit manipulation, or repeated overlapping bookings that unfairly block other players.',
      'Do not promote competing or off-platform events inside another club chat, feed, or booking flow where that promotion is disruptive, misleading, spammy, or against club rules.',
      'Bookadink may restrict, suspend, or remove access where needed to protect users, clubs, venues, payments, platform integrity, or legal obligations.',
    ],
  },
  {
    title: '9. Platform integrity',
    body: [
      'Do not scrape, harvest, bulk export, reverse engineer, bypass access controls, use undocumented APIs, resell Bookadink data, interfere with security, overload the service, or use Bookadink content or data to train, tune, or inform AI or machine learning models without written permission.',
    ],
  },
  {
    title: '10. Chat, posts, comments, and images',
    body: [
      'You are responsible for content you upload or post, including club chat messages, posts, comments, replies, mentions, images, session results, reviews, reports, and shared media.',
      'Do not post content that is abusive, hateful, threatening, sexually explicit, exploitative, spam, unlawful, misleading, infringing, or intended to harass or harm another person.',
      'You keep ownership of your content, but grant Bookadink a limited permission to host, store, process, display, reproduce, moderate, and share it as needed to operate, support, secure, and improve the service.',
      'Users may report content, users, or behaviour to Bookadink or a club admin. Bookadink may remove content or limit access if it appears unsafe, unlawful, abusive, misleading, infringing, low-quality, inappropriate, or inconsistent with club or platform rules.',
    ],
  },
  {
    title: '11. DUPR and rating information',
    body: [
      'Bookadink may display DUPR or other rating information you provide, that clubs provide, or that is available to the app. Ratings may be user-entered, imported, third-party sourced, incomplete, delayed, or inaccurate.',
      'Ratings are shown to help organise games and are not guaranteed to be current, complete, independently verified, or suitable for every session format.',
    ],
  },
  {
    title: '12. Sports risk, venues, and safety',
    body: [
      'Pickleball and other physical activity involve inherent risks, including injury. You are responsible for deciding whether you are fit to play, inspecting venue conditions, using appropriate equipment, and following venue and club rules.',
      'Bookadink does not operate, inspect, supervise, or guarantee venues, players, clubs, coaches, organisers, weather conditions, parking, access, facilities, or real-world session safety unless we clearly state otherwise.',
    ],
  },
  {
    title: '13. Dormant or misused clubs',
    body: [
      'Bookadink may hide, pause, downgrade, mark inactive, restrict discovery, or remove clubs or listings that repeatedly publish misleading, empty, inactive, spammy, unsafe, infringing, or low-quality information, or that create risk for players, venues, payments, or the platform.',
    ],
  },
  {
    title: '14. Intellectual property',
    body: [
      'Bookadink owns its software, design, branding, code, platform data structures, and service content except for content owned by users, clubs, or third parties.',
      'You receive a limited, revocable, non-transferable right to use Bookadink according to these terms. You must not copy, modify, distribute, sell, or exploit Bookadink except as allowed by these terms or with written permission.',
    ],
  },
  {
    title: '15. Account deletion',
    body: [
      `You can request account deletion through the app where available or at ${accountDeletionPath}. Some records may be retained where legal, operational, security, tax, dispute, payment, chargeback, fraud-prevention, audit, club administration, or backup reasons require it.`,
    ],
  },
  {
    title: '16. Availability and beta changes',
    body: [
      'Bookadink is provided on an as-available basis. We may update, pause, limit, or remove features during launch, beta, maintenance, security work, or as the product evolves.',
      'We do not guarantee uninterrupted availability, perfect notifications, error-free bookings, permanent availability of clubs or games, or that every venue, payment provider, app store, or infrastructure provider will remain available.',
    ],
  },
  {
    title: '17. Apple, Google, and app stores',
    body: [
      'Apple, Google, and other app store providers are not parties to these terms and are not responsible for Bookadink support, content, bookings, clubs, payments, or claims except where their own terms say otherwise.',
    ],
  },
  {
    title: '18. Limitation of liability',
    body: [
      'To the extent permitted by law, Bookadink is not liable for indirect loss, lost profits, missed games, club decisions, venue issues, player conduct, injury, payment provider outages, app store outages, notification delays, or data loss arising from use of the service.',
      'Nothing in these terms limits rights that cannot be excluded under Australian Consumer Law or other applicable laws.',
    ],
  },
  {
    title: '19. Governing law',
    body: [
      'These terms are governed by the laws of Western Australia, Australia, unless applicable consumer protection laws require otherwise.',
    ],
  },
  {
    title: '20. Changes to these terms',
    body: [
      'We may update these terms from time to time. The latest version will show a new Last updated date. Continued use of Bookadink after an update means you accept the updated terms.',
    ],
  },
  {
    title: '21. Contact',
    body: [`Questions about these terms can be sent to ${contactEmail}.`],
  },
];

export const privacySections: LegalSection[] = [
  {
    title: '1. Who we are',
    body: [
      `Bookadink provides booking, club, membership, payment, notification, and community features for pickleball players and clubs. Privacy questions can be sent to ${contactEmail}.`,
      'This policy applies to the Bookadink mobile apps, website, and related services.',
    ],
  },
  {
    title: '2. Account and profile information',
    body: [
      'Bookadink may collect account and profile information, such as your name, email, phone number, avatar or profile photo, date of birth or age eligibility information where collected, skill level, DUPR rating, emergency contact information where collected, notification preferences, push notification tokens, club membership status, and club roles or admin permissions.',
      'Emergency contact information is not intended to be public and should only be used for safety, support, or operational purposes related to the relevant club or booking.',
    ],
  },
  {
    title: '3. Booking, club, and community information',
    body: [
      'We collect booking, waitlist, waitlist promotion, attendance, cancellation, credit, review, club membership, club admin, and payment metadata needed to operate games, clubs, memberships, credits, subscriptions, support, and audit records.',
      'We may collect content you create or upload, including club chat messages, posts, comments, replies, mentions, images, media, session results, reports, and moderation records.',
      'We may collect device, app, diagnostics, crash, network, IP address, fraud-prevention, and security information needed to keep Bookadink reliable and secure.',
    ],
  },
  {
    title: '4. Location and search behaviour',
    body: [
      'Bookadink may use your device location or a suburb search to show nearby clubs, venues, and games when you choose to use nearby discovery features.',
      'Bookadink does not save your suburb, postcode, or last-known location to disk or UserDefaults.',
      'If location is unavailable or not allowed, the app falls back to Search your area and lets you enter a suburb.',
      'Clubs and venues may store venue latitude, longitude, suburb, and address information in the database so players can find where games are held.',
    ],
  },
  {
    title: '5. Payments through Stripe and Stripe Connect',
    body: [
      'Stripe and Stripe Connect process card and payment method details for paid bookings, eligible club subscription payments, refunds, payouts, and related payment operations. Bookadink does not directly store full card numbers, CVCs, or raw payment credentials.',
      'Bookadink may store or receive Stripe-related metadata such as payment status, booking identifiers, customer identifiers, connected account identifiers, payment intent identifiers, subscription identifiers, refund identifiers, reconciliation identifiers, price, currency, timestamps, chargeback or dispute information, and payout or settlement status where applicable.',
      'We use payment metadata for booking confirmation, subscriptions, refunds, credits, reconciliation, disputes, accounting, fraud prevention, support, and club operations.',
    ],
  },
  {
    title: '6. Supabase backend and storage',
    body: [
      'Bookadink uses Supabase for backend services including authentication, database records, realtime updates, edge functions, security rules, and storage.',
      'Images and other user-uploaded media may be stored in Supabase Storage and may be visible to clubs, members, or users depending on the feature, club context, and access rules.',
    ],
  },
  {
    title: '7. Notifications',
    body: [
      'If you enable notifications, Bookadink may use push tokens and notification preferences to send game reminders, booking updates, club chat alerts, membership updates, cancellation notices, waitlist promotions, achievements, payment updates, and other app-related messages.',
      'You can manage notification preferences in the app and operating system settings. Some transactional, safety, or account-related messages may still appear in-app.',
    ],
  },
  {
    title: '8. Public and club-visible information',
    body: [
      'Depending on the feature and club or game context, your profile name, avatar, DUPR or skill level, booking status, waitlist status, attendance, reviews, achievements, chat posts, comments, replies, mentions, images, and session results may be visible to clubs, organisers, other players, or members of the relevant community.',
      'Club admins may see information needed to run their club, such as relevant profile, booking, attendance, membership, cancellation, credit, payment-status, contact, role, and admin information.',
    ],
  },
  {
    title: '9. How we use information',
    body: [
      'We use information to create and manage accounts, operate bookings and waitlists, process credits, support payments, show nearby games, manage clubs and memberships, display ratings, send notifications, support chat and media features, handle reports, prevent misuse, debug issues, maintain security, improve reliability, and improve Bookadink.',
      'We may use aggregated or de-identified information for product improvement, club insights, activity trends, reliability monitoring, business reporting, and operational analytics.',
    ],
  },
  {
    title: '10. Sharing with clubs, players, admins, and providers',
    body: [
      'Bookadink shares relevant information with clubs and authorised club admins where needed for bookings, attendance, memberships, admin operations, club chat, cancellations, credits, safety, support, payments, and club management.',
      'Other players may see profile or game information needed for bookings, attendance, fair play, chat, reviews, ratings, club participation, and community features.',
      'Bookadink internal admins may access information where needed for support, safety, fraud prevention, compliance, payment reconciliation, moderation, debugging, and platform operations.',
      'We use service providers such as Supabase, Stripe, Apple, Google, Firebase, notification providers, analytics or crash tools if configured, hosting, email, and other infrastructure providers where needed to run the app, process payments, send notifications, maintain security, or provide support.',
      'We may disclose information where required by law, safety, fraud prevention, disputes, payment issues, chargebacks, platform enforcement, or to protect users, clubs, venues, payments, or Bookadink.',
    ],
  },
  {
    title: '11. Sale, ads, and AI training',
    body: [
      'Bookadink does not sell personal information. Bookadink does not currently use third-party advertising networks or track users across other companies apps and websites for advertising.',
      'Bookadink does not use personal information to train public AI models. We may use de-identified or aggregated operational data for analytics, reliability, product improvement, and business reporting.',
      'If our advertising, tracking, or AI training practices materially change, we will update this policy and any required app store privacy disclosures.',
    ],
  },
  {
    title: '12. Security',
    body: [
      'Bookadink uses technical and organisational safeguards designed to protect personal information, including encrypted network connections, provider security controls, access controls, and monitoring for reliability and abuse prevention.',
      'No online service can guarantee perfect security. If we become aware of a security issue that affects your information, we will take reasonable steps to respond and notify users or authorities where required by law.',
    ],
  },
  {
    title: '13. Retention and deletion',
    body: [
      'We keep account and profile information while your account is active or as needed to provide Bookadink, meet legal or accounting obligations, resolve disputes, prevent abuse, and maintain reliable booking, payment, membership, safety, and audit records.',
      'Booking, payment, audit, fraud-prevention, safety, tax, dispute, chargeback, and club administration records may be retained after account deletion where required or reasonably needed for those purposes.',
      'Uploaded content may be removed, anonymised, or retained depending on the feature context and operational, safety, legal, payment, dispute, or club administration requirements. Backups may retain deleted data for a limited period before backup expiry.',
      `You can request access, correction, or deletion of your account information by contacting ${contactEmail} or visiting ${accountDeletionPath}.`,
    ],
  },
  {
    title: '14. Children',
    body: [
      'Bookadink is not directed to children under 16. If you believe a child has provided personal information without appropriate permission, contact us so we can review and take appropriate action.',
    ],
  },
  {
    title: '15. International processing',
    body: [
      'Bookadink and its service providers may process information in Australia and other countries where our infrastructure, support, payment, notification, analytics, crash reporting, email, or storage providers operate.',
    ],
  },
  {
    title: '16. Australian privacy context',
    body: [
      'Bookadink is operated for Australian users and clubs. We aim to handle personal information consistently with applicable Australian privacy principles and consumer protection obligations.',
      'If you are outside Australia, your information may still be processed using the providers and infrastructure needed to operate Bookadink.',
    ],
  },
  {
    title: '17. Contact',
    body: [`Questions or privacy requests can be sent to ${contactEmail}.`],
  },
];

export const accountDeletionSections: LegalSection[] = [
  {
    title: 'Request account deletion',
    body: [
      'If you have a Bookadink account, you can request deletion of your account and associated personal information from inside the app where account deletion is available, or through this public web page without logging in.',
      `To request deletion by email, send a message to ${contactEmail} from the email address on your Bookadink account where possible, with the subject "Account deletion request". We may need to verify your identity before completing the request.`,
    ],
  },
  {
    title: 'What Bookadink will do',
    body: [
      'When an account is deleted, Bookadink will delete or de-identify personal information associated with the account where reasonably possible.',
      'Uploaded content, chat messages, posts, comments, images, booking history, and club records may be removed, anonymised, or retained depending on the feature context and operational, legal, payment, safety, dispute, or club administration requirements.',
    ],
  },
  {
    title: 'What may be retained',
    body: [
      'Some records may need to be retained for legitimate reasons such as payment reconciliation, fraud prevention, security, legal compliance, dispute handling, accounting, club administration, tax, chargebacks, audit logs, or backup integrity.',
      'Retained records will be limited to what is needed for those purposes. Backups may retain deleted data for a limited period before backup expiry.',
    ],
  },
  {
    title: 'Questions',
    body: [`Questions about account deletion can be sent to ${contactEmail}.`],
  },
];
