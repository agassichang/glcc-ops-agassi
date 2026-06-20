'use client'

// Mobile-only top bar with a hamburger that opens the sidebar as a slide-in
// drawer. Desktop hides this entirely (.topbar/.nav-overlay are display:none
// above the mobile breakpoint), so the desktop layout is unaffected.
// State is a single `nav-open` class on <body>, so Nav can close the drawer
// (on link tap / route change) without any shared context.
export default function MobileTopBar() {
  const toggle = () => document.body.classList.toggle('nav-open')
  const close = () => document.body.classList.remove('nav-open')
  return (
    <>
      <div className="topbar">
        <button className="hamburger" aria-label="Open menu" onClick={toggle}>
          <span /><span /><span />
        </button>
        <span className="topbrand"><span className="logo" aria-hidden="true" /> Your AI HQ</span>
      </div>
      <div className="nav-overlay" onClick={close} aria-hidden="true" />
    </>
  )
}
