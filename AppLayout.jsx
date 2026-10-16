import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  CalendarRange,
  Check,
  ChevronRight,
  Clock3,
  Crown,
  Gem,
  Landmark,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from './context/useAuth'
import {
  FoodCartPage,
  FoodCheckoutPage,
  FoodDetailPage,
  FoodDirectoryPage,
  FoodHomePage,
  FoodOrdersPage,
  FoodRestaurantDetailPage,
  FoodRestaurantsPage,
} from './components/FoodMarketplace'
import { useFoodOrder } from './context/useFoodOrder'
import { isSupabaseConfigured } from './lib/supabase'
import {
  createBooking,
  createInquiry,
  getAdminOverview,
  getCustomerBookings,
  getOwnerBookings,
  setBookingStatus,
} from './lib/marketplace'
import {
  useEventPackage,
  useMarketplaceCollection,
  useRestaurant,
} from './hooks/useMarketplace'
import {
  addFavorite,
  removeFavorite,
  getUserCollection,
} from './lib/portal'
import { matchesServiceArea, serviceArea } from './lib/service-area'
import {
  AdminReportsPage,
  AdminResourcePage,
  AdminSettingsPage,
  CustomerBookingDetailsPage,
  CustomerBookingsPage,
  CustomerFavoritesPage,
  CustomerInquiriesPage,
  CustomerMessagesPage,
  CustomerNotificationsPage,
  CustomerProfilePage,
  OwnerEarningsPage,
  OwnerInquiriesPage,
  OwnerMessagesPage,
  OwnerFoodOrdersPage,
  OwnerMenuPage,
  OwnerPackagesPage,
  OwnerPayoutsPage,
  OwnerRestaurantPage,
  WorkspaceNav,
} from './pages/PortalPages'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Order Food', to: '/food' },
  { label: 'Restaurants', to: '/restaurants' },
  { label: 'Catering', to: '/packages' },
  { label: 'Events', to: '/booking' },
  { label: 'My Orders', to: '/my-orders' },
  { label: 'How It Works', to: '/how-it-works' },
]

const businessEmail = import.meta.env.VITE_BUSINESS_EMAIL || 'aimenabbas357@gmail.com'
const businessPhone = import.meta.env.VITE_BUSINESS_PHONE || '03487346074'
const businessWhatsApp = (import.meta.env.VITE_BUSINESS_WHATSAPP || '923487346074').replace(/\D/g, '')
const businessPhoneHref = businessPhone.startsWith('0') ? `+92${businessPhone.slice(1)}` : businessPhone
const brandName = import.meta.env.VITE_BRAND_NAME || 'Foodora'

const dashboardRoutes = {
  customer: '/dashboard',
  owner: '/owner',
  admin: '/admin',
}

function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button className={`btn btn-${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}

function Input({ label, type = 'text', ...props }) {
  return (
    <label className="field-group">
      {label ? <span>{label}</span> : null}
      <input type={type} {...props} />
    </label>
  )
}

function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="loading-shell">
      <div className="spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  )
}

function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const normalized = String(status || 'pending').toLowerCase()
  return <span className={`status-badge status-${normalized}`}>{status}</span>
}

function ProtectedRoute({ children, allowedRoles = ['customer', 'owner', 'admin'] }) {
  const { user, isReady, authError } = useAuth()

  if (!isReady) {
    return <LoadingState message="Checking access..." />
  }

  if (!user) {
    return (
      <div className="auth-gate">
        <h2>Login required</h2>
        <p>{authError || `Please log in to access this area of ${brandName}.`}</p>
        <Link to="/login" className="text-link">
          Go to login <ChevronRight size={16} />
        </Link>
      </div>
    )
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="auth-gate">
        <h2>Access denied</h2>
        <p>This dashboard is not available for your current account role.</p>
        <Link to={dashboardRoutes[user.role] || '/'} className="text-link">
          Return to your dashboard <ChevronRight size={16} />
        </Link>
      </div>
    )
  }

  return children
}

function ConfigurationNotice() {
  if (isSupabaseConfigured) {
    return null
  }

  return (
    <div className="configuration-notice" role="status">
      <div className="container configuration-notice-inner">
        <ShieldCheck size={17} aria-hidden="true" />
        <p>
          <strong>Preview mode</strong>
          <span>Sample listings and browser-only demo orders. Account and event-booking features require Supabase setup.</span>
        </p>
      </div>
    </div>
  )
}

function Navbar() {
  const [open, setOpen] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const { user, logout } = useAuth()
  const { items } = useFoodOrder()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const result = await logout()
    if (result.success) {
      setLogoutError('')
      navigate('/')
      setOpen(false)
    } else {
      setLogoutError(result.message || 'We could not sign you out. Please try again.')
    }
  }

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Link to="/" className="brand" aria-label={`${brandName} home`}>
          <span className="brand-mark">F</span>
          <span>{brandName.toUpperCase()}</span>
        </Link>

        <nav className={`main-nav ${open ? 'open' : ''}`} aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {item.label}
            </NavLink>
          ))}
          {!user ? (
            <>
              <NavLink to="/login" onClick={() => setOpen(false)} className="nav-link mobile-account-link">Login</NavLink>
              <NavLink to="/register" onClick={() => setOpen(false)} className="nav-link mobile-account-link">Create Account</NavLink>
            </>
          ) : (
            <>
              <NavLink to={dashboardRoutes[user.role] || '/dashboard'} onClick={() => setOpen(false)} className="nav-link mobile-account-link">Dashboard</NavLink>
              <button type="button" onClick={handleLogout} className="nav-link mobile-account-link mobile-logout">Logout</button>
            </>
          )}
        </nav>

        <div className="nav-actions">
          <Link to="/cart" className="nav-cart" aria-label={`Shopping cart, ${items.length} items`}>
            <ShoppingBag size={19} />
            <span>Cart</span>
            {items.length ? <b>{items.reduce((sum, item) => sum + item.quantity, 0)}</b> : null}
          </Link>
          {user ? (
            <>
              <NavLink to={dashboardRoutes[user.role] || '/dashboard'} className="btn btn-ghost">
                {user.fullName || 'Dashboard'}
              </NavLink>
              <Button variant="secondary" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/register" className="btn btn-primary">Create Account</Link>
            </>
          )}

          <button className="menu-toggle" type="button" onClick={() => setOpen(!open)} aria-label="Toggle navigation menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {logoutError ? <p className="nav-error" role="alert">{logoutError}</p> : null}
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="brand brand-footer">
            <span className="brand-mark">F</span>
            <span>{brandName.toUpperCase()}</span>
          </div>
          <p className="footer-copy">GOOD FOOD. GATHER TOGETHER.</p>
        </div>

        <div>
          <h4>Explore</h4>
          <ul>
            <li><Link to="/restaurants">Restaurants</Link></li>
            <li><Link to="/food">All food</Link></li>
            <li><Link to="/my-orders">My orders</Link></li>
            <li><Link to="/venues">Event venues</Link></li>
            <li><Link to="/packages">Catering packages</Link></li>
          </ul>
        </div>

        <div>
          <h4>Company</h4>
          <ul>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/how-it-works">How it works</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4>Contact</h4>
          <ul>
            <li>{serviceArea}</li>
            <li><a href={`mailto:${businessEmail}`}>{businessEmail}</a></li>
            <li><a href={`tel:${businessPhoneHref}`}>{businessPhone}</a></li>
            <li><a href={`https://wa.me/${businessWhatsApp}`} target="_blank" rel="noreferrer">WhatsApp Foodora</a></li>
            <li>Restaurant, ordering and event support</li>
          </ul>
        </div>
      </div>
    </footer>
  )
}

function RestaurantCard({ restaurant }) {
  return (
    <article className="card restaurant-card">
      <div className="card-image-wrap">
        <img src={restaurant.image} alt={restaurant.name} />
      </div>
      <div className="card-body">
        <div className="meta-row">
          <span className="location-pill"><MapPin size={14} /> {restaurant.location}</span>
          {restaurant.status === 'approved' ? <span className="chip tertiary">Approved listing</span> : <span className="chip tertiary">Demo listing · unverified</span>}
        </div>
        <h3>{restaurant.name}</h3>
        <p>{restaurant.description}</p>
        <div className="chip-row">
          {restaurant.eventTypes.slice(0, 2).map((type) => (
            <span key={type} className="chip">{type}</span>
          ))}
        </div>
        <div className="price-row">
          <strong>PKR {restaurant.price.toLocaleString()}</strong>
          <span>starting price</span>
        </div>
        <Link to={`/restaurant/${restaurant.slug}`} className="inline-link">View details</Link>
      </div>
    </article>
  )
}

function PackageCard({ item }) {
  return (
    <article className="card package-card">
      <img src={item.image} alt={item.name} className="package-image" />
      <div className="card-body">
        <div className="meta-row">
          <span className="chip tertiary">{isSupabaseConfigured ? item.eventType : `Sample · ${item.eventType}`}</span>
          <span className="rating-pill"><Users size={14} /> {item.guestCapacity}</span>
        </div>
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <div className="price-row">
          <strong>PKR {item.price.toLocaleString()}</strong>
          <span>{item.duration}</span>
        </div>
        <Link to={`/package/${item.slug}`} className="inline-link">Explore package</Link>
      </div>
    </article>
  )
}

function SearchPanel() {
  const navigate = useNavigate()
  const [location, setLocation] = useState(serviceArea)
  const [eventType, setEventType] = useState('')
  const [date, setDate] = useState('')
  const [guests, setGuests] = useState('')

  const handleSearch = (event) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (location) params.set('location', location)
    if (eventType) params.set('type', eventType)
    if (date) params.set('date', date)
    if (guests) params.set('guests', guests)
    navigate(`/explore${params.size ? `?${params.toString()}` : ''}`)
  }

  return (
    <form className="search-panel" onSubmit={handleSearch}>
      <div className="search-grid">
        <label>
          <span>Location</span>
          <select value={location} onChange={(event) => setLocation(event.target.value)}>
            <option value={serviceArea}>{serviceArea}</option>
          </select>
        </label>
        <label>
          <span>Event Type</span>
          <select value={eventType} onChange={(event) => setEventType(event.target.value)}>
            <option value="">Any event</option>
            <option value="Wedding">Wedding</option>
            <option value="Corporate">Corporate</option>
            <option value="Birthday">Birthday</option>
            <option value="Private Dining">Private Dining</option>
          </select>
        </label>
        <label>
          <span>Date</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label>
          <span>Guests</span>
          <input type="number" value={guests} onChange={(event) => setGuests(event.target.value)} min="1" />
        </label>
      </div>
      <Button className="search-button" type="submit">
        <Search size={16} /> Search
      </Button>
    </form>
  )
}

function SectionHeader({ title, text }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  )
}

function CollectionMessage({ loading, error, empty, emptyText = 'No listings match this view yet.' }) {
  if (loading) {
    return <LoadingState message={`Loading ${brandName} listings...`} />
  }
  if (error) {
    return <EmptyState title="Listings unavailable" text={error} />
  }
  if (empty) {
    return <EmptyState title="Nothing to show yet" text={emptyText} />
  }
  return null
}

function HomePage() {
  const restaurantState = useMarketplaceCollection('restaurants')
  const packageState = useMarketplaceCollection('packages')
  const restaurants = restaurantState.data.filter((restaurant) => matchesServiceArea(restaurant))
  const localRestaurantIds = new Set(restaurants.map((restaurant) => restaurant.id))
  const eventPackages = packageState.data.filter((item) => localRestaurantIds.has(item.restaurantId))

  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">PLAN. ORGANIZE. CELEBRATE.</span>
            <h1>Discover trusted restaurants, premium venues, and unforgettable event packages.</h1>
            <p>
              Discover trusted restaurants, premium venues, and event packages for moments worth celebrating.
            </p>
            <div className="cta-row">
              <Link to="/explore" className="btn btn-primary">Explore Venues</Link>
              <Link to="/register" className="btn btn-ghost">Find Your Perfect Venue</Link>
            </div>
          </div>

          <div className="hero-visual">
            <img
              src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80"
              alt="Luxury event venue"
            />
          </div>
        </div>
      </section>

      <section className="section-block search-section">
        <div className="container">
          <SearchPanel />
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <SectionHeader title={`Featured venues in ${serviceArea}`} text="Explore local spaces and restaurants for intimate celebrations and grand gatherings." />
          <CollectionMessage loading={restaurantState.loading} error={restaurantState.error} empty={!restaurants.length} />
          {!restaurantState.loading && !restaurantState.error && restaurants.length > 0 ? (
            <div className="card-grid three-up">
              {restaurants.slice(0, 3).map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="section-block muted">
        <div className="container">
          <SectionHeader title={`Popular venues in ${serviceArea}`} text="Discover event spaces serving Samundri." />
          {!restaurantState.loading && !restaurantState.error && restaurants.length > 0 ? (
            <div className="card-grid two-up">
              {restaurants.slice(3, 5).length > 0
                ? restaurants.slice(3, 5).map((venue) => <RestaurantCard key={venue.id} restaurant={venue} />)
                : restaurants.slice(0, 2).map((venue) => <RestaurantCard key={venue.id} restaurant={venue} />)}
            </div>
          ) : <CollectionMessage loading={restaurantState.loading} error={restaurantState.error} empty={!restaurants.length} />}
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <SectionHeader title={`Catering & event packages in ${serviceArea}`} text="Explore available packages for gatherings and celebrations." />
          <CollectionMessage loading={packageState.loading} error={packageState.error} empty={!eventPackages.length} />
          {!packageState.loading && !packageState.error && eventPackages.length > 0 ? (
            <div className="card-grid three-up">
              {eventPackages.slice(0, 3).map((item) => (
                <PackageCard key={item.id} item={item} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="section-block muted">
        <div className="container">
          <SectionHeader title={`How ${brandName} Works`} text="A clear booking journey from inspiration to celebration." />
          <div className="steps-grid">
            {[
              ['01', 'Search & Shortlist', 'Filter by city, event type and budget to discover premium venues.'],
              ['02', 'Request a Booking', 'Connect with venue hosts, review packages and submit a professional request.'],
              ['03', 'Plan & Celebrate', 'Track progress, confirm details and host your event with confidence.'],
            ].map(([step, title, text]) => (
              <div className="step-card" key={step}>
                <span>{step}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <SectionHeader title={`Why Choose ${brandName}`} text="Built to combine luxury presentation with serious booking functionality." />
          <div className="feature-grid">
            {[
              ['Verified listings', 'Trusted restaurant owners and premium venue partners.'],
              ['Professional booking flow', 'Request, review and track every booking request.'],
              ['Built for growth', 'Designed for commissions, payouts and owner management.'],
            ].map(([title, text]) => (
              <div className="feature-card" key={title}>
                <div className="feature-icon"><ShieldCheck size={18} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block muted">
        <div className="container">
          <SectionHeader title="Designed for the moments that matter" text="A considered booking journey for customers and independent venue partners." />
          <div className="feature-grid">
            {[
              ['Clear choices', 'Compare spaces, packages and event details in one place.'],
              ['Requests, not assumptions', 'A booking stays pending until the venue makes a decision.'],
              ['Transparent records', 'Booking, commission and payout records remain distinct.'],
            ].map(([title, text]) => (
              <div className="feature-card" key={title}>
                <div className="feature-icon"><ShieldCheck size={18} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-panel">
        <div className="container cta-box">
          <div>
            <span className="eyebrow">Own a restaurant or event venue?</span>
            <h2>List your venue on {brandName} and connect with customers looking for their next celebration.</h2>
          </div>
          <Link to="/register" className="btn btn-primary">List Your Restaurant</Link>
        </div>
      </section>
    </>
  )
}

function ExplorePage() {
  const { data: restaurants, loading, error } = useMarketplaceCollection('restaurants')
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || serviceArea,
    eventType: searchParams.get('type') || '',
    maxPrice: '',
    minCapacity: searchParams.get('guests') || '',
    rating: '',
  })
  const filteredRestaurants = restaurants.filter((restaurant) => (
    matchesServiceArea(restaurant, filters.location)
    && (!filters.eventType || restaurant.eventTypes?.includes(filters.eventType))
    && (!filters.maxPrice || restaurant.price <= Number(filters.maxPrice))
    && (!filters.minCapacity || restaurant.capacity >= Number(filters.minCapacity))
    && (!filters.rating || restaurant.rating >= Number(filters.rating))
  ))
  const cities = [...new Set(restaurants.filter((restaurant) => matchesServiceArea(restaurant)).map((restaurant) => restaurant.city || restaurant.location))]

  return (
    <div className="page-content container">
      <SectionHeader title="Explore venues" text="Browse premium venues, restaurants and celebration spaces across Pakistan." />
      <div className="filter-bar">
        <label className="filter-field">
          <span>Location</span>
          <select value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })}>
            <option value="">All locations</option>
            {cities.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </label>
        <label className="filter-field">
          <span>Event type</span>
          <select value={filters.eventType} onChange={(event) => setFilters({ ...filters, eventType: event.target.value })}>
            <option value="">Any event</option>
            {['Wedding', 'Corporate', 'Birthday', 'Private Dining', 'Engagement', 'Anniversary'].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          <span>Maximum starting price</span>
          <select value={filters.maxPrice} onChange={(event) => setFilters({ ...filters, maxPrice: event.target.value })}>
            <option value="">Any budget</option>
            <option value="30000">PKR 30,000</option>
            <option value="60000">PKR 60,000</option>
            <option value="100000">PKR 100,000</option>
          </select>
        </label>
        <label className="filter-field">
          <span>Minimum capacity</span>
          <select value={filters.minCapacity} onChange={(event) => setFilters({ ...filters, minCapacity: event.target.value })}>
            <option value="">Any capacity</option>
            <option value="100">100+ guests</option>
            <option value="200">200+ guests</option>
            <option value="300">300+ guests</option>
          </select>
        </label>
        <label className="filter-field">
          <span>Minimum rating</span>
          <select value={filters.rating} onChange={(event) => setFilters({ ...filters, rating: event.target.value })}>
            <option value="">Any rating</option>
            <option value="4">4.0+</option>
            <option value="4.5">4.5+</option>
            <option value="4.8">4.8+</option>
          </select>
        </label>
      </div>
      {searchParams.get('date') ? (
        <p className="availability-note">
          Date selected: {searchParams.get('date')}. The venue confirms availability when it reviews your request.
        </p>
      ) : null}
      <CollectionMessage loading={loading} error={error} empty={!filteredRestaurants.length} />
      {!loading && !error && filteredRestaurants.length ? (
        <div className="card-grid three-up">
          {filteredRestaurants.map((item) => (
            <RestaurantCard key={item.id} restaurant={item} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function VenuesPage() {
  const { data: restaurants, loading, error } = useMarketplaceCollection('restaurants')
  const data = useMemo(() => restaurants.filter((venue) => matchesServiceArea(venue)), [restaurants])
  return (
    <div className="page-content container">
      <SectionHeader title={`Event venues in ${serviceArea}`} text="Explore local spaces for gatherings and celebrations in Samundri." />
      <CollectionMessage loading={loading} error={error} empty={!data.length} />
      {!loading && !error && data.length ? (
        <div className="card-grid three-up">
          {data.map((venue) => <RestaurantCard key={venue.id} restaurant={venue} />)}
        </div>
      ) : null}
    </div>
  )
}

function PackagesPage() {
  const { data: packages, loading, error } = useMarketplaceCollection('packages')
  const { data: restaurants } = useMarketplaceCollection('restaurants')
  const localRestaurantIds = useMemo(() => new Set(restaurants.filter((restaurant) => matchesServiceArea(restaurant)).map((restaurant) => restaurant.id)), [restaurants])
  const data = useMemo(() => packages.filter((item) => localRestaurantIds.has(item.restaurantId)), [packages, localRestaurantIds])
  return (
    <div className="page-content container">
      <SectionHeader title={`Catering & event packages in ${serviceArea}`} text="Explore local packages for your celebration, guest count and catering needs." />
      <CollectionMessage loading={loading} error={error} empty={!data.length} />
      {!loading && !error && data.length ? (
        <div className="card-grid three-up">
          {data.map((item) => <PackageCard key={item.id} item={item} />)}
        </div>
      ) : null}
    </div>
  )
}

function HowItWorksPage() {
  return (
    <div className="page-content container narrow">
      <SectionHeader title="How it works" text="A simple path from discovery to booking." />
      <div className="timeline-list">
        <div className="timeline-item">
          <strong>1</strong>
          <div>
            <h3>Explore venues</h3>
            <p>Find restaurants and spaces by city, event type and guest capacity.</p>
          </div>
        </div>
        <div className="timeline-item">
          <strong>2</strong>
          <div>
            <h3>Review packages</h3>
            <p>Compare inclusive packages, amenities and cost before submitting your request.</p>
          </div>
        </div>
        <div className="timeline-item">
          <strong>3</strong>
          <div>
            <h3>Confirm your booking</h3>
            <p>Track conversations, status updates, and next steps as the venue responds.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function AboutPage() {
  return (
    <div className="page-content container narrow">
      <SectionHeader title={`About ${brandName}`} text={`Serving Samundri, Punjab, Pakistan with local food discovery and event catering.`} />
      <div className="text-panel">
        <p>
          {brandName} brings together restaurants, event venues, and tailored packages under one professional booking platform.
          Our mission is to make premium event planning simple, secure and beautifully organized.
        </p>
      </div>
    </div>
  )
}

function ContactPage() {
  const phoneHref = businessPhone.startsWith('0') ? `+92${businessPhone.slice(1)}` : businessPhone
  return (
    <div className="page-content container narrow">
      <SectionHeader title="Contact us" text={`Reach our team in ${serviceArea} for food orders, event catering, venue enquiries and platform support.`} />
      <div className="contact-grid">
        <div className="text-panel">
          <p><strong>Service area:</strong> {serviceArea}</p>
          <p><strong>Email:</strong> <a href={`mailto:${businessEmail}`}>{businessEmail}</a></p>
          <p><strong>Phone:</strong> <a href={`tel:${phoneHref}`}>{businessPhone}</a></p>
          <div className="contact-actions">
            <a className="btn btn-primary" href={`mailto:${businessEmail}`}>Email {brandName}</a>
            <a className="btn btn-secondary" href={`tel:${phoneHref}`}>Call {brandName}</a>
            <a className="btn btn-secondary" href={`https://wa.me/${businessWhatsApp}`} target="_blank" rel="noreferrer">WhatsApp {brandName}</a>
          </div>
        </div>
        <div className="text-panel">
          <h3>Venue enquiries</h3>
          <p>Explore local restaurants, order food, or request event catering in {serviceArea}. To contact a listed venue, open its details page and send a private inquiry through your {brandName} account.</p>
        </div>
      </div>
    </div>
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, login, authError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (user) {
    return (
      <div className="page-content container narrow auth-shell">
        <h2>Already signed in</h2>
        <p>You are already logged in and can continue to your dashboard.</p>
        <Link to={dashboardRoutes[user.role] || '/dashboard'} className="btn btn-primary">Open dashboard</Link>
      </div>
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const result = await login({ email, password })
    setLoading(false)

    if (!result.success) {
      setError(result.message)
      return
    }

    const redirectTarget = location.state?.from || dashboardRoutes[result.user?.role] || '/dashboard'
    navigate(redirectTarget)
  }

  return (
    <div className="page-content container narrow auth-shell">
      <div className="auth-card">
        <h2>Welcome back</h2>
        <p>Login to manage your bookings, inquiries and venue requests.</p>
        <form onSubmit={handleSubmit} className="stack-form">
          <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <div className="password-wrap">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button type="button" className="inline-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="row-between">
            <span className="muted-copy">Your session is handled securely by Supabase Auth.</span>
            <Link to="/forgot-password" className="text-link">Forgot password?</Link>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          {authError && !error ? <p className="form-error" role="alert">{authError}</p> : null}
          {!isSupabaseConfigured ? <p className="form-error">Sign-in is unavailable until Supabase is configured.</p> : null}
          <Button type="submit" disabled={loading || !isSupabaseConfigured}>{loading ? 'Signing in...' : 'Login'}</Button>
        </form>

        <p className="helper-row">
          New to {brandName}? <Link to="/register" className="text-link">Create an account</Link>
        </p>
      </div>
    </div>
  )
}

function RegisterPage() {
  const { register, user } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
    terms: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (user) {
    return (
      <div className="page-content container narrow auth-shell">
        <h2>Account ready</h2>
        <p>Your profile is already active. Continue to the dashboard.</p>
        <Link to={dashboardRoutes[user.role] || '/dashboard'} className="btn btn-primary">Go to dashboard</Link>
      </div>
    )
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.terms) {
      setError('Please accept the terms and conditions to continue.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const result = await register({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: formData.role,
    })
    setLoading(false)

    if (!result.success) {
      setError(result.message)
      return
    }

    setSuccess(result.message)
    if (result.user) {
      setTimeout(() => navigate(dashboardRoutes[result.user.role] || '/dashboard'), 800)
    }
  }

  return (
    <div className="page-content container narrow auth-shell">
      <div className="auth-card">
        <h2>Create your account</h2>
        <p>Join {brandName} as a customer or restaurant owner.</p>
        <form onSubmit={handleSubmit} className="stack-form">
          <Input label="Full Name" name="fullName" autoComplete="name" required value={formData.fullName} onChange={handleChange} />
          <Input label="Email" type="email" name="email" autoComplete="email" required value={formData.email} onChange={handleChange} />
          <Input label="Phone" name="phone" autoComplete="tel" required value={formData.phone} onChange={handleChange} />
          <label className="field-group">
            <span>Account Type</span>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="customer">Customer</option>
              <option value="owner">Restaurant Owner</option>
            </select>
          </label>
          <Input label="Password" type="password" name="password" autoComplete="new-password" minLength={8} required value={formData.password} onChange={handleChange} />
          <Input label="Confirm Password" type="password" name="confirmPassword" autoComplete="new-password" minLength={8} required value={formData.confirmPassword} onChange={handleChange} />
          <label className="checkbox-row">
            <input type="checkbox" name="terms" checked={formData.terms} onChange={handleChange} />
            <span>I agree to the terms and conditions</span>
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          {success ? <p className="form-success">{success}</p> : null}
          {!isSupabaseConfigured ? <p className="form-error">Account creation is unavailable until Supabase is configured.</p> : null}
          <Button type="submit" disabled={loading || !isSupabaseConfigured}>{loading ? 'Creating account...' : 'Create Account'}</Button>
        </form>
      </div>
    </div>
  )
}

function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    const result = await sendPasswordReset(email)
    setLoading(false)
    if (result.success) setMessage(result.message)
    else setError(result.message)
  }

  return (
    <div className="page-content container narrow auth-shell">
      <div className="auth-card">
        <h2>Reset your password</h2>
        <p>Enter your account email and we will send a secure password reset link.</p>
        <form className="stack-form" onSubmit={handleSubmit}>
          <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          {error ? <p className="form-error">{error}</p> : null}
          {message ? <p className="form-success">{message}</p> : null}
          <Button type="submit" disabled={loading || !isSupabaseConfigured}>{loading ? 'Sending...' : 'Send reset link'}</Button>
        </form>
      </div>
    </div>
  )
}

function ResetPasswordPage() {
  const { user, isReady, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const result = await updatePassword(password)
    setLoading(false)
    if (result.success) {
      setMessage(result.message)
      setTimeout(() => navigate(dashboardRoutes[user.role] || '/dashboard'), 1200)
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="page-content container narrow auth-shell">
      <div className="auth-card">
        <h2>Set a new password</h2>
        {!isReady ? (
          <LoadingState message="Checking your password reset link..." />
        ) : !user ? (
          <p>This reset session is invalid or expired. Request a fresh password reset link.</p>
        ) : (
          <>
            <p>Choose a new password for your account.</p>
            <form className="stack-form" onSubmit={handleSubmit}>
              <Input label="New password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
              <Input label="Confirm new password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              {error ? <p className="form-error">{error}</p> : null}
              {message ? <p className="form-success">{message}</p> : null}
              <Button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update password'}</Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function RestaurantDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: restaurant, loading, error } = useRestaurant(slug)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteMessage, setFavoriteMessage] = useState('')
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured || user?.role !== 'customer' || !restaurant?.id) {
      setIsFavorite(false)
      return undefined
    }
    let active = true
    getUserCollection('favorites', user.id)
      .then((favorites) => {
        if (active) setIsFavorite(favorites.some((favorite) => favorite.restaurant_id === restaurant.id))
      })
      .catch(() => {
        if (active) setFavoriteMessage('Favorites are temporarily unavailable.')
      })
    return () => { active = false }
  }, [restaurant?.id, user?.id, user?.role])

  if (loading) return <LoadingState message="Loading venue details..." />
  if (error) return <EmptyState title="Venue unavailable" text={error} />
  if (!restaurant) {
    return <EmptyState title="Venue not found" text="The requested restaurant or venue is no longer available." />
  }

  const requestBooking = (packageSlug = '') => {
    const requestPath = `/booking?venue=${encodeURIComponent(restaurant.slug)}${packageSlug ? `&package=${encodeURIComponent(packageSlug)}` : ''}`
    if (!user) {
      navigate('/login', { state: { from: requestPath } })
      return
    }
    navigate(requestPath)
  }

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/restaurant/${restaurant.slug}` } })
      return
    }
    setFavoriteLoading(true)
    setFavoriteMessage('')
    try {
      if (isFavorite) {
        await removeFavorite(user.id, restaurant.id)
        setIsFavorite(false)
      } else {
        await addFavorite(user.id, restaurant.id)
        setIsFavorite(true)
      }
    } catch {
      setFavoriteMessage('We could not update your favorites. Please try again.')
    } finally {
      setFavoriteLoading(false)
    }
  }

  return (
    <div className="page-content container detail-page">
      <div className="detail-gallery">
        {[restaurant.image, restaurant.image, restaurant.image].map((image, index) => (
          <img key={`${restaurant.id}-${index}`} src={image} alt={restaurant.name} className="detail-image" />
        ))}
      </div>

      <div className="detail-header">
        <div>
          <span className="eyebrow">Premium venue</span>
          <h1>{restaurant.name}</h1>
          <div className="meta-row detail-meta">
            <span className="location-pill"><MapPin size={14} /> {restaurant.location}</span>
            {restaurant.status === 'approved' ? <span className="chip tertiary">Approved listing</span> : <span className="chip tertiary">Demo listing · not verified</span>}
          </div>
        </div>
        <div className="price-box">
          <span>Starting from</span>
          <strong>PKR {restaurant.price.toLocaleString()}</strong>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-copy">
          <p>{restaurant.description}</p>
          <div className="detail-list-row">
            <div>
              <h3>Facilities</h3>
              <ul className="plain-list">
                {restaurant.facilities.map((facility) => (
                  <li key={facility}><Check size={15} /> {facility}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Event Types</h3>
              <ul className="plain-list">
                {(restaurant.eventTypes || []).map((type) => (
                  <li key={type}><Check size={15} /> {type}</li>
                ))}
              </ul>
            </div>
          </div>
          {restaurant.packages?.length ? (
            <div className="venue-packages">
              <h3>Available packages</h3>
              <div className="venue-package-list">
                {restaurant.packages.map((item) => (
                  <article className="venue-package" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>PKR {item.price.toLocaleString()} · up to {item.guestCapacity} guests</span>
                    </div>
                    <Button type="button" onClick={() => requestBooking(item.slug)}>Choose package</Button>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <aside className="detail-aside">
          <div className="info-card">
            <p><strong>Capacity</strong><br />{restaurant.capacity} guests</p>
            <p><strong>Availability</strong><br />Open for the next 6 weeks</p>
            <div className="button-stack">
              <Button type="button" onClick={() => requestBooking()}>Request Booking</Button>
              <Link to={`/inquiry?venue=${encodeURIComponent(restaurant.slug)}`} className="btn btn-secondary">Send Inquiry</Link>
              {isSupabaseConfigured && (!user || user.role === 'customer') ? (
                <Button type="button" variant="secondary" disabled={favoriteLoading} onClick={toggleFavorite}>
                  {favoriteLoading ? 'Saving...' : isFavorite ? 'Remove from Favorites' : 'Save to Favorites'}
                </Button>
              ) : null}
              {favoriteMessage ? <p className="form-error" role="alert">{favoriteMessage}</p> : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function PackageDetailPage() {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: item, loading, error } = useEventPackage(slug)

  if (loading) return <LoadingState message="Loading package details..." />
  if (error) return <EmptyState title="Package unavailable" text={error} />
  if (!item) {
    return <EmptyState title="Package not found" text="This package is not available right now." />
  }

  const requestPath = `/booking?venue=${encodeURIComponent(item.restaurantSlug)}&package=${encodeURIComponent(item.slug)}`

  return (
    <div className="page-content container detail-page">
      <div className="detail-gallery single-gallery">
        <img src={item.image} alt={item.name} className="detail-image" />
      </div>
      <div className="detail-header">
        <div>
          <span className="eyebrow">Curated package</span>
          <h1>{item.name}</h1>
          <div className="meta-row detail-meta">
            <span className="chip tertiary">{item.eventType}</span>
            <span className="location-pill"><Users size={14} /> Up to {item.guestCapacity}</span>
          </div>
        </div>
        <div className="price-box">
          <span>Package value</span>
          <strong>PKR {item.price.toLocaleString()}</strong>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-copy">
          <p>{item.description}</p>
          <h3>Included services</h3>
          <ul className="plain-list">
            {item.includedServices.map((service) => (
              <li key={service}><Check size={15} /> {service}</li>
            ))}
          </ul>
        </div>
        <aside className="detail-aside">
          <div className="info-card">
            <p><strong>Duration</strong><br />{item.duration}</p>
            <p><strong>Event type</strong><br />{item.eventType}</p>
            <Button
              type="button"
              className="full-width"
              onClick={() => user
                ? navigate(requestPath)
                : navigate('/login', { state: { from: requestPath } })}
            >
              Request Booking
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}

function BookingPage() {
  const { user, isReady } = useAuth()
  const [searchParams] = useSearchParams()
  const { data: restaurants, loading: restaurantsLoading, error: restaurantError } = useMarketplaceCollection('restaurants')
  const { data: packages, loading: packagesLoading, error: packageError } = useMarketplaceCollection('packages')
  const requestedVenue = searchParams.get('venue') || ''
  const requestedPackage = searchParams.get('package') || ''
  const [restaurantId, setRestaurantId] = useState('')
  const [packageId, setPackageId] = useState('')
  const [eventType, setEventType] = useState('Wedding')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [guests, setGuests] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [estimatedBudget, setEstimatedBudget] = useState('')
  const [cateringPreferences, setCateringPreferences] = useState('')
  const [specialRequirements, setSpecialRequirements] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [today] = useState(() => {
    const localDate = new Date()
    localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset())
    return localDate.toISOString().slice(0, 10)
  })

  useEffect(() => {
    const venue = restaurants.find((item) => matchesServiceArea(item) && item.slug === requestedVenue)
    setRestaurantId(venue?.id || '')
  }, [restaurants, requestedVenue])

  const localRestaurants = useMemo(() => restaurants.filter((restaurant) => matchesServiceArea(restaurant)), [restaurants])
  const localRestaurantIds = useMemo(() => new Set(localRestaurants.map((restaurant) => restaurant.id)), [localRestaurants])
  const localPackages = useMemo(() => packages.filter((item) => localRestaurantIds.has(item.restaurantId)), [packages, localRestaurantIds])
  const availablePackages = useMemo(
    () => localPackages.filter((item) => item.restaurantId === restaurantId),
    [localPackages, restaurantId],
  )

  useEffect(() => {
    const selectedPackage = availablePackages.find((item) => item.slug === requestedPackage)
    setPackageId(selectedPackage?.id || '')
    if (selectedPackage?.eventType) setEventType(selectedPackage.eventType)
  }, [availablePackages, requestedPackage])

  if (!user) {
    return (
      <div className="page-content container narrow auth-shell">
        <div className="auth-card">
          <h2>Request a booking</h2>
          <p>Please log in to submit a booking request.</p>
          <Link to="/login" className="btn btn-primary">Login to continue</Link>
        </div>
      </div>
    )
  }

  if (!isReady) return <LoadingState message="Checking your account..." />
  if (user.role !== 'customer') {
    return <EmptyState title="Customer account required" text="Only customer accounts can submit booking requests." />
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="page-content container narrow">
        <SectionHeader title="Booking request" text={`Booking requests are saved securely to your ${brandName} account.`} />
        <EmptyState title="Bookings are not enabled yet" text="Connect Supabase to enable customer accounts and save booking requests. No demo bookings will be created." />
      </div>
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await createBooking({
        customerId: user.id,
        restaurantId,
        packageId: packageId || null,
        eventType,
        date,
        time,
        guests: Number(guests),
        eventLocation,
        estimatedBudget: estimatedBudget ? Number(estimatedBudget) : null,
        cateringPreferences,
        specialRequirements,
      })
      setBookingId(result.id)
      setSubmitted(true)
    } catch {
      setError('We could not submit this request. Check the venue and package availability, then try again.')
    } finally {
      setLoading(false)
    }
  }

  if (restaurantsLoading || packagesLoading) {
    return <LoadingState message="Loading available venues and packages..." />
  }
  if (restaurantError || packageError) {
    return <EmptyState title="Booking form unavailable" text="We could not load venue options right now. Please try again shortly." />
  }

  return (
    <div className="page-content container narrow">
      <SectionHeader title="Booking request" text="Share your event details and venue requirements to begin the conversation." />
      {!submitted ? (
        localRestaurants.length ? (
          <form className="stack-form booking-form" onSubmit={handleSubmit}>
            <label className="field-group">
              <span>Restaurant / Venue</span>
              <select required value={restaurantId} onChange={(event) => {
                setRestaurantId(event.target.value)
                setPackageId('')
              }}>
                <option value="">Select a venue</option>
                {localRestaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>{restaurant.name} — {restaurant.location}</option>
                ))}
              </select>
            </label>
            <label className="field-group">
              <span>Package (optional)</span>
              <select value={packageId} onChange={(event) => {
                const selectedPackage = availablePackages.find((item) => item.id === event.target.value)
                setPackageId(event.target.value)
                if (selectedPackage?.eventType) setEventType(selectedPackage.eventType)
              }}>
                <option value="">Request without a package</option>
                {availablePackages.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} — PKR {item.price.toLocaleString()}</option>
                ))}
              </select>
            </label>
            <label className="field-group">
              <span>Event Type</span>
              <select required value={eventType} onChange={(event) => setEventType(event.target.value)}>
                {['Wedding', 'Mehndi', 'Engagement', 'Birthday', 'Anniversary', 'Family Gathering', 'Corporate', 'University / School', 'Private Dining', 'Other'].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
            <Input label="Date" type="date" min={today} required value={date} onChange={(event) => setDate(event.target.value)} />
            <Input label="Time" type="time" required value={time} onChange={(event) => setTime(event.target.value)} />
            <Input label="Guests" type="number" min="1" required value={guests} onChange={(event) => setGuests(event.target.value)} />
            <Input label="Event location" required autoComplete="street-address" value={eventLocation} onChange={(event) => setEventLocation(event.target.value)} placeholder="Area or event address" />
            <Input label="Estimated budget (PKR, optional)" type="number" min="0" step="500" value={estimatedBudget} onChange={(event) => setEstimatedBudget(event.target.value)} placeholder="Your approximate budget" />
            <label className="field-group">
              <span>Catering preference</span>
              <select value={cateringPreferences} onChange={(event) => setCateringPreferences(event.target.value)}>
                <option value="">Not decided yet</option>
                <option value="full-service">Full-service catering</option>
                <option value="buffet">Buffet service</option>
                <option value="drop-off">Food delivery / drop-off</option>
                <option value="custom-menu">Discuss a custom menu</option>
              </select>
            </label>
            <label className="field-group">
              <span>Special requirements (optional)</span>
              <textarea rows="4" value={specialRequirements} onChange={(event) => setSpecialRequirements(event.target.value)} placeholder="Music, décor theme, seating, dietary preferences" />
            </label>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <Button type="submit" disabled={loading || !restaurantId}>{loading ? 'Submitting request...' : 'Submit Booking Request'}</Button>
          </form>
        ) : (
          <EmptyState title={`No approved venues in ${serviceArea} yet`} text={`Please check back later or contact ${brandName} for assistance.`} />
        )
      ) : (
        <div className="success-panel">
          <Check size={30} />
          <h3>Booking request received</h3>
          <p>Your request is pending venue review. It is not confirmed until the venue accepts it.</p>
          {bookingId ? <small>Request reference: {bookingId}</small> : null}
          <Link to="/dashboard" className="btn btn-primary">View my bookings</Link>
        </div>
      )}
    </div>
  )
}

function InquiryPage() {
  const { user, isReady } = useAuth()
  const [searchParams] = useSearchParams()
  const venueSlug = searchParams.get('venue') || ''
  const { data: restaurants, loading, error: listingError } = useMarketplaceCollection('restaurants')
  const localRestaurants = useMemo(() => restaurants.filter((restaurant) => matchesServiceArea(restaurant)), [restaurants])
  const [restaurantId, setRestaurantId] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    setRestaurantId(localRestaurants.find((item) => item.slug === venueSlug)?.id || '')
  }, [localRestaurants, venueSlug])

  if (!user) {
    return (
      <div className="page-content container narrow auth-shell">
        <div className="auth-card">
          <h2>Contact a venue</h2>
          <p>Please sign in with a customer account to send an inquiry.</p>
          <Link to="/login" state={{ from: `/inquiry?venue=${encodeURIComponent(venueSlug)}` }} className="btn btn-primary">Login to continue</Link>
        </div>
      </div>
    )
  }

  if (!isReady) return <LoadingState message="Checking your account..." />
  if (user.role !== 'customer') {
    return <EmptyState title="Customer account required" text="Only customer accounts can send a venue inquiry." />
  }
  if (!isSupabaseConfigured) {
    return <EmptyState title="Inquiries are not enabled yet" text="Connect Supabase to send and securely store venue inquiries." />
  }
  if (loading) return <LoadingState message="Loading venues..." />
  if (listingError) return <EmptyState title="Inquiry unavailable" text="We could not load venue options right now. Please try again shortly." />

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    setLoadingSubmit(true)
    try {
      await createInquiry({
        customerId: user.id,
        restaurantId,
        subject,
        message,
      })
      setSubmitted(true)
    } catch {
      setSubmitError('We could not send your inquiry. Please check the venue and try again.')
    } finally {
      setLoadingSubmit(false)
    }
  }

  return (
    <div className="page-content container narrow">
      <SectionHeader title="Send a venue inquiry" text="Ask the venue a question before deciding whether to request a booking." />
      {submitted ? (
        <div className="success-panel">
          <Check size={30} />
          <h3>Inquiry sent</h3>
          <p>Your message has been delivered to the venue. You can expect a response through {brandName}.</p>
          <Link to="/dashboard" className="btn btn-primary">View my account</Link>
        </div>
      ) : (
        <form className="stack-form booking-form" onSubmit={handleSubmit}>
          <label className="field-group">
            <span>Restaurant / Venue</span>
            <select required value={restaurantId} onChange={(event) => setRestaurantId(event.target.value)}>
              <option value="">Select a venue</option>
              {localRestaurants.map((restaurant) => <option key={restaurant.id} value={restaurant.id}>{restaurant.name} — {restaurant.location}</option>)}
            </select>
          </label>
          <Input label="Subject" required value={subject} onChange={(event) => setSubject(event.target.value)} />
          <label className="field-group">
            <span>Your message</span>
            <textarea rows="5" required value={message} onChange={(event) => setMessage(event.target.value)} />
          </label>
          {submitError ? <p className="form-error" role="alert">{submitError}</p> : null}
          <Button type="submit" disabled={loadingSubmit || !restaurantId}>{loadingSubmit ? 'Sending...' : 'Send Inquiry'}</Button>
        </form>
      )}
    </div>
  )
}

function StatCard({ label, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <div className="panel">
      <h3>{title}</h3>
      <div className="panel-list">{children}</div>
    </div>
  )
}

function ListItem({ title, meta, badge }) {
  return (
    <div className="list-item">
      <div>
        <strong>{title}</strong>
        <small>{meta}</small>
      </div>
      <StatusBadge status={badge} />
    </div>
  )
}

function BookingList({ rows, ownerView = false, onStatusChange, updatingId = '' }) {
  if (!rows.length) {
    return <EmptyState title="No bookings yet" text="Booking requests will appear here when customers submit them." />
  }

  return rows.map((booking) => {
    const venue = booking.restaurants?.name || 'Venue'
    const packageName = booking.packages?.name
    return (
      <div className="booking-list-row" key={booking.id}>
        <div>
          <strong>{venue}</strong>
          <small>
            {booking.booking_date} · {booking.guest_count} guests
            {packageName ? ` · ${packageName}` : ''}
          </small>
          {ownerView ? (
            <small>Request value: PKR {Number(booking.amount).toLocaleString()}</small>
          ) : null}
        </div>
        <div className="booking-row-actions">
          <StatusBadge status={booking.status} />
          {ownerView && booking.status === 'pending' ? (
            <>
              <Button
                type="button"
                disabled={updatingId === booking.id}
                onClick={() => onStatusChange(booking.id, 'confirmed')}
              >
                Confirm
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={updatingId === booking.id}
                onClick={() => onStatusChange(booking.id, 'rejected')}
              >
                Reject
              </Button>
            </>
          ) : null}
        </div>
      </div>
    )
  })
}

function DashboardPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id || user.role !== 'customer') {
      setLoading(false)
      return undefined
    }
    let active = true
    getCustomerBookings(user.id)
      .then((data) => {
        if (active) setRows(data)
      })
      .catch(() => {
        if (active) setError('We could not load your booking history. Please try again shortly.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user.id])

  const pending = rows.filter((booking) => booking.status === 'pending').length
  const confirmed = rows.filter((booking) => booking.status === 'confirmed').length
  const completed = rows.filter((booking) => booking.status === 'completed').length

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="page-content container dashboard-shell">
        <WorkspaceNav role="customer" />
        <SectionHeader title="Customer dashboard" text={`Track your real ${brandName} booking requests and venue decisions.`} />
        {loading ? <LoadingState message="Loading your bookings..." /> : null}
        {error ? <EmptyState title="Bookings unavailable" text={error} /> : null}
        {!loading && !error ? (
          <>
            <div className="stats-grid">
              <StatCard label="Total bookings" value={rows.length.toString()} icon={<CalendarRange size={18} />} />
              <StatCard label="Pending" value={pending.toString()} icon={<Clock3 size={18} />} />
              <StatCard label="Confirmed" value={confirmed.toString()} icon={<Check size={18} />} />
              <StatCard label="Completed" value={completed.toString()} icon={<TrendingUp size={18} />} />
            </div>
            <div className="panel booking-panel">
              <h3>My bookings</h3>
              <div className="panel-list">
                <BookingList rows={rows} />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </ProtectedRoute>
  )
}

function OwnerDashboardPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState('')

  const refresh = async () => {
    const data = await getOwnerBookings(user.id)
    setRows(data)
  }

  useEffect(() => {
    if (!user?.id || !['owner', 'admin'].includes(user.role)) {
      setLoading(false)
      return undefined
    }
    let active = true
    getOwnerBookings(user.id)
      .then((data) => {
        if (active) setRows(data)
      })
      .catch(() => {
        if (active) setError('We could not load your restaurant booking requests. Please try again shortly.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user.id])

  const updateStatus = async (bookingId, status) => {
    setUpdatingId(bookingId)
    setError('')
    try {
      await setBookingStatus(bookingId, status)
      await refresh()
    } catch {
      setError('We could not update this booking. It may have already been changed.')
    } finally {
      setUpdatingId('')
    }
  }

  const pending = rows.filter((booking) => booking.status === 'pending').length
  const confirmedRows = rows.filter((booking) => booking.status === 'confirmed')
  const commissionTotal = confirmedRows.reduce((sum, booking) => {
    const commission = booking.commissions
    const value = Array.isArray(commission) ? commission[0]?.commission_amount : commission?.commission_amount
    return sum + Number(value || 0)
  }, 0)
  const confirmedValue = confirmedRows.reduce((sum, booking) => sum + Number(booking.amount || 0), 0)

  return (
    <ProtectedRoute allowedRoles={['owner', 'admin']}>
      <div className="page-content container dashboard-shell">
        <WorkspaceNav role="owner" />
        <SectionHeader title="Owner dashboard" text="Manage restaurants, packages, bookings and payouts." />
        {loading ? <LoadingState message="Loading restaurant requests..." /> : null}
        {error ? <p className="form-error dashboard-error" role="alert">{error}</p> : null}
        {!loading && !error ? (
          <>
            <div className="stats-grid">
              <StatCard label="Confirmed booking value" value={`PKR ${confirmedValue.toLocaleString()}`} icon={<Gem size={18} />} />
              <StatCard label="Pending requests" value={pending.toString()} icon={<Clock3 size={18} />} />
              <StatCard label="Confirmed bookings" value={confirmedRows.length.toString()} icon={<Check size={18} />} />
              <StatCard label={`${brandName} commission`} value={`PKR ${commissionTotal.toLocaleString()}`} icon={<Crown size={18} />} />
              <StatCard label="Venue share" value={`PKR ${Math.max(confirmedValue - commissionTotal, 0).toLocaleString()}`} icon={<TrendingUp size={18} />} />
            </div>
            <div className="panel booking-panel">
              <h3>Booking requests</h3>
              <div className="panel-list">
                <BookingList rows={rows} ownerView onStatusChange={updateStatus} updatingId={updatingId} />
              </div>
            </div>
            <p className="dashboard-note">Booking values and commissions are records only. No payment or payout is represented as completed.</p>
          </>
        ) : null}
      </div>
    </ProtectedRoute>
  )
}

function AdminDashboardPage() {
  const { user } = useAuth()
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.role !== 'admin') {
      setLoading(false)
      return undefined
    }
    let active = true
    getAdminOverview()
      .then((data) => {
        if (active) setOverview(data)
      })
      .catch(() => {
        if (active) setError('We could not load platform reporting. Check administrator permissions and try again.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user?.role])

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="page-content container dashboard-shell">
        <WorkspaceNav role="admin" />
        <SectionHeader title="Admin dashboard" text="Monitor platform performance and manage approvals, records and settings." />
        {loading ? <LoadingState message="Loading platform reports..." /> : null}
        {error ? <EmptyState title="Reports unavailable" text={error} /> : null}
        {!loading && !error && overview ? (
          <>
            <div className="stats-grid">
              <StatCard label="Total Customers" value={overview.stats.totalCustomers.toLocaleString()} icon={<Users size={18} />} />
              <StatCard label="Total Restaurants" value={overview.stats.totalRestaurants.toLocaleString()} icon={<Building2 size={18} />} />
              <StatCard label="Booking Revenue" value={`PKR ${overview.stats.bookingRevenue.toLocaleString()}`} icon={<TrendingUp size={18} />} />
              <StatCard label={`${brandName} Commission`} value={`PKR ${overview.stats.commission.toLocaleString()}`} icon={<Crown size={18} />} />
              <StatCard label="Pending Approvals" value={overview.stats.pendingApprovals.toString()} icon={<Landmark size={18} />} />
            </div>
            <div className="listing-grid two-col">
              <Panel title={`${brandName} commissions`}>
                {overview.commissions.length
                  ? overview.commissions.map((commission) => (
                    <ListItem key={commission.id} title={commission.label} meta={`PKR ${commission.amount.toLocaleString()} · ${commission.rate}%`} badge={commission.status} />
                  ))
                  : <p className="muted-copy">No commission records yet.</p>}
              </Panel>
              <Panel title="Payout records">
                {overview.payouts.length
                  ? overview.payouts.map((payout) => (
                    <ListItem key={payout.id} title={`Owner ${payout.owner_id.slice(0, 8)}`} meta={`PKR ${Number(payout.amount).toLocaleString()}`} badge={payout.status} />
                  ))
                  : <p className="muted-copy">No payout records yet. No payment is implied.</p>}
              </Panel>
            </div>
            <p className="dashboard-note">Reported amounts are database records, not proof of payment settlement.</p>
          </>
        ) : null}
      </div>
    </ProtectedRoute>
  )
}

function AppLayout() {
  return (
    <div className="site-shell">
      <Navbar />
      <ConfigurationNotice />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<FoodHomePage />} />
          <Route path="/event-planning" element={<HomePage />} />
          <Route path="/food" element={<FoodDirectoryPage />} />
          <Route path="/dish/:slug" element={<FoodDetailPage />} />
          <Route path="/cart" element={<FoodCartPage />} />
          <Route path="/checkout" element={<FoodCheckoutPage />} />
          <Route path="/my-orders" element={<FoodOrdersPage />} />
          <Route path="/restaurants" element={<FoodRestaurantsPage />} />
          <Route path="/food-restaurants/:slug" element={<FoodRestaurantDetailPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/venues" element={<VenuesPage />} />
          <Route path="/packages" element={<PackagesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/restaurant/:slug" element={<RestaurantDetailPage />} />
          <Route path="/package/:slug" element={<PackageDetailPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/inquiry" element={<InquiryPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customer/profile" element={<ProtectedRoute allowedRoles={['customer']}><CustomerProfilePage /></ProtectedRoute>} />
          <Route path="/customer/bookings" element={<ProtectedRoute allowedRoles={['customer']}><CustomerBookingsPage /></ProtectedRoute>} />
          <Route path="/customer/bookings/:id" element={<ProtectedRoute allowedRoles={['customer']}><CustomerBookingDetailsPage /></ProtectedRoute>} />
          <Route path="/customer/inquiries" element={<ProtectedRoute allowedRoles={['customer']}><CustomerInquiriesPage /></ProtectedRoute>} />
          <Route path="/customer/messages" element={<ProtectedRoute allowedRoles={['customer']}><CustomerMessagesPage /></ProtectedRoute>} />
          <Route path="/customer/notifications" element={<ProtectedRoute allowedRoles={['customer']}><CustomerNotificationsPage /></ProtectedRoute>} />
          <Route path="/customer/favorites" element={<ProtectedRoute allowedRoles={['customer']}><CustomerFavoritesPage /></ProtectedRoute>} />
          <Route path="/owner" element={<OwnerDashboardPage />} />
          <Route path="/owner/profile" element={<ProtectedRoute allowedRoles={['owner']}><CustomerProfilePage role="owner" /></ProtectedRoute>} />
          <Route path="/owner/restaurant" element={<ProtectedRoute allowedRoles={['owner']}><OwnerRestaurantPage /></ProtectedRoute>} />
          <Route path="/owner/packages" element={<ProtectedRoute allowedRoles={['owner']}><OwnerPackagesPage /></ProtectedRoute>} />
          <Route path="/owner/menu" element={<ProtectedRoute allowedRoles={['owner']}><OwnerMenuPage /></ProtectedRoute>} />
          <Route path="/owner/bookings" element={<OwnerDashboardPage />} />
          <Route path="/owner/food-orders" element={<ProtectedRoute allowedRoles={['owner']}><OwnerFoodOrdersPage /></ProtectedRoute>} />
          <Route path="/owner/inquiries" element={<ProtectedRoute allowedRoles={['owner']}><OwnerInquiriesPage /></ProtectedRoute>} />
          <Route path="/owner/messages" element={<ProtectedRoute allowedRoles={['owner']}><OwnerMessagesPage /></ProtectedRoute>} />
          <Route path="/owner/earnings" element={<ProtectedRoute allowedRoles={['owner']}><OwnerEarningsPage /></ProtectedRoute>} />
          <Route path="/owner/payouts" element={<ProtectedRoute allowedRoles={['owner']}><OwnerPayoutsPage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminResourcePage resource="profiles" /></ProtectedRoute>} />
          <Route path="/admin/owners" element={<ProtectedRoute allowedRoles={['admin']}><AdminResourcePage resource="owners" /></ProtectedRoute>} />
          <Route path="/admin/restaurants" element={<ProtectedRoute allowedRoles={['admin']}><AdminResourcePage resource="restaurants" /></ProtectedRoute>} />
          <Route path="/admin/packages" element={<ProtectedRoute allowedRoles={['admin']}><AdminResourcePage resource="packages" /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={['admin']}><AdminResourcePage resource="bookings" /></ProtectedRoute>} />
          <Route path="/admin/food-orders" element={<ProtectedRoute allowedRoles={['admin']}><AdminResourcePage resource="food_orders" /></ProtectedRoute>} />
          <Route path="/admin/inquiries" element={<ProtectedRoute allowedRoles={['admin']}><AdminResourcePage resource="inquiries" /></ProtectedRoute>} />
          <Route path="/admin/messages" element={<ProtectedRoute allowedRoles={['admin']}><AdminResourcePage resource="messages" /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['admin']}><AdminResourcePage resource="categories" /></ProtectedRoute>} />
          <Route path="/admin/commissions" element={<ProtectedRoute allowedRoles={['admin']}><AdminResourcePage resource="commissions" /></ProtectedRoute>} />
          <Route path="/admin/payouts" element={<ProtectedRoute allowedRoles={['admin']}><AdminResourcePage resource="payouts" /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReportsPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettingsPage /></ProtectedRoute>} />
          <Route path="*" element={<EmptyState title="Page not found" text="The page you are looking for does not exist." />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default AppLayout
