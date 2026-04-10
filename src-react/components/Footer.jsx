export default function Footer() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between text-sm text-gray-400">
          <a href="about.html" className="hover:text-gray-600">about</a>
          <a href="mailto:timezonemate@gmail.com" className="hover:text-gray-600">feedback</a>
          <span>&copy;2015</span>
        </div>
      </div>
    </nav>
  )
}
