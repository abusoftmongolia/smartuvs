import Image from "next/image"

const quickLinks = [
  { label: "Бидний тухай", href: "#about" },
  { label: "Эрхэм зорилго", href: "#mission" },
  { label: "Үйлчилгээ", href: "#services" },
  { label: "Яагаад бид гэж", href: "#why-us" },
  { label: "Холбоо барих", href: "#contact" },
]

export function Footer() {
  return (
    <footer className="bg-[#0b2a4a] text-[#8eb4d0]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Image
              src="/images/logo.png"
              alt="Smart Uvs Logo"
              width={160}
              height={48}
              className="h-10 w-auto brightness-200"
            />
            <p className="mt-4 max-w-md text-sm leading-relaxed">
              Ухаалаг Увс төсөл нь орон нутгийн засаг захиргаа, хувийн хэвшлийн байгууллагуудад ухаалаг системийг нэвтрүүлж, үйлчилгээний үйл явцыг автоматжуулж, иргэдийн цаг, зардлыг хэмнэсэн дижитал шийдлүүдийг хүргэж байна.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#eef5fa]">
              Холбоос
            </h3>
            <ul className="flex flex-col gap-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm transition-colors hover:text-[#4db8e8]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#eef5fa]">
              Холбоо барих
            </h3>
            <ul className="flex flex-col gap-3 text-sm">
              <li>Увс аймаг, Улаангом хот</li>
              <li>
                <a href="mailto:info@smartuvs.mn" className="transition-colors hover:text-[#4db8e8]">
                  info@smartuvs.mn
                </a>
              </li>
              <li>
                <a href="https://smartuvs.mn" className="transition-colors hover:text-[#4db8e8]">
                  smartuvs.mn
                </a>
              </li>
            </ul>

            {/* Social Links */}
            <div className="mt-6 flex items-center gap-4">
              <a
                href="#"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a4a6e] text-[#8eb4d0] transition-colors hover:bg-[#4db8e8] hover:text-[#0b2a4a]"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a4a6e] text-[#8eb4d0] transition-colors hover:bg-[#4db8e8] hover:text-[#0b2a4a]"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a4a6e] text-[#8eb4d0] transition-colors hover:bg-[#4db8e8] hover:text-[#0b2a4a]"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#1a4a6e]">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <p className="text-center text-xs text-[#4a6b8a]">
            &copy; {new Date().getFullYear()} Smart Uvs. Бүх эрх хуулиар хамгаалагдсан.
          </p>
        </div>
      </div>
    </footer>
  )
}
