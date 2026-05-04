'use client';

export default function Avatar({ username, profilePic, size = 36, radius = '50%', fontSize = 14 }) {
  if (profilePic) {
    return (
      <img src={profilePic} alt={username} style={{
        width: size, height: size, borderRadius: radius,
        objectFit: 'cover', flexShrink: 0,
      }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: '#1a1a1a', display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: '#fff', fontWeight: 700,
      fontSize, flexShrink: 0,
    }}>{username?.[0]?.toUpperCase() || '?'}</div>
  );
}
