import Link from 'next/link';

export default function WelcomePage() {
  return (
    <main className="welcome">
      <div className="welcomeCard">
        <h1>Welcome to Raven Chat</h1>
        <p>Raven is a WhatsApp-style real-time messaging app built with Next.js, Express, Socket.IO, and MongoDB.</p>
        <ul>
          <li>Real-time messaging with sent/delivered/read states</li>
          <li>Search users and access recent conversations</li>
          <li>Secure JWT-based authentication with 7-day session</li>
        </ul>
        <div className="welcomeActions">
          <Link href="/login">Login</Link>
          <Link href="/signup">Create account</Link>
        </div>
      </div>
    </main>
  );
}
