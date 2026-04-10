export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3 text-center">
        <a href="/">
          <span className="text-xl font-bold" style={{ color: '#00c6ff' }}>TIME</span>
          <span className="text-xl font-bold" style={{ color: '#46d633' }}>ZONE</span>
          <span className="text-xl font-bold" style={{ color: '#00c6ff' }}>MATE</span>
        </a>
      </div>
    </nav>
  )
}
