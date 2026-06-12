import { useState, useMemo, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductSection from './components/ProductSection';
import CartSidebar from './components/CartSidebar';
import AuthModal from './components/AuthModal';
import CheckoutModal from './components/CheckoutModal';
import ReceiptModal from './components/ReceiptModal';
import LetterModal from './components/LetterModal';
import { Product, CartItem, Order, ActiveModal } from './types';
import { categories, products } from './data/products';
import { Search, ArrowUp } from 'lucide-react';

const WHATSAPP_NUMBER = '918888478621';

function buildWhatsAppMessage(order: Order): string {
  const date = order.createdAt.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const itemLines = order.items
    .map(i => `  • ${i.name} (${i.weight}) × ${i.quantity} — ₹${i.price * i.quantity}`)
    .join('\n');

  return [
    `🛒 *QUALITY MART — Order Receipt*`,
    ``,
    `Order ID: *${order.id}*`,
    `Date: ${date}`,
    ``,
    `*Items Ordered:*`,
    itemLines,
    ``,
    `*Bill Summary:*`,
    `  Subtotal : ₹${order.subtotal}`,
    `  Delivery : ${order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}`,
    `  *Total    : ₹${order.total}*`,
    ``,
    `Payment: ${order.paymentMethod === 'upi' ? 'UPI / GPay' : 'Cash on Delivery'}`,
    order.deliveryAddress ? `Address: ${order.deliveryAddress}` : '',
    ``,
    `✅ Your order will be delivered within *12 hours*.`,
    `📞 For queries contact: 8888478621`,
    ``,
    `Thank you for shopping with Quality Mart! 🌿`,
  ].join('\n');
}

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // When true, successful auth should proceed straight to checkout
  const [pendingCheckout, setPendingCheckout] = useState(false);

  useEffect(() => {
    const handler = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Cart actions
  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => {
      const item = prev.find(i => i.id === productId);
      if (!item) return prev;
      if (item.quantity === 1) return prev.filter(i => i.id !== productId);
      return prev.map(i => i.id === productId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const deleteFromCart = (productId: string) => setCartItems(prev => prev.filter(i => i.id !== productId));
  const clearCart = () => setCartItems([]);

  // Auth gate: if not logged in, show auth first then go to checkout
  const handleCheckoutRequest = () => {
    if (isLoggedIn) {
      setActiveModal('checkout');
    } else {
      setPendingCheckout(true);
      setActiveModal('auth');
    }
  };

  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
    if (pendingCheckout) {
      setPendingCheckout(false);
      // Small delay so success screen is briefly visible
      setTimeout(() => setActiveModal('checkout'), 1000);
    }
  };

  const handleAuthClose = () => {
    setPendingCheckout(false);
    setActiveModal(null);
  };

  const handlePlaceOrder = (order: Order) => {
    setCurrentOrder(order);
    clearCart();
    setActiveModal('receipt');
    setTimeout(() => setShowLetterModal(true), 900);
    const msg = buildWhatsAppMessage(order);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  const handleCloseAll = () => {
    setActiveModal(null);
    setShowLetterModal(false);
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories
      .map(cat => ({
        ...cat,
        products: cat.products.filter(
          p => p.name.toLowerCase().includes(q) ||
               p.category.toLowerCase().includes(q) ||
               p.weight.toLowerCase().includes(q)
        ),
      }))
      .filter(cat => cat.products.length > 0);
  }, [searchQuery]);

  const totalProductsFound = filteredCategories.reduce((s, c) => s + c.products.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar
        cartItems={cartItems}
        onCartOpen={() => setActiveModal('cart')}
        onAuthOpen={() => setActiveModal('auth')}
        onSearch={setSearchQuery}
        isLoggedIn={isLoggedIn}
      />

      {!searchQuery && (
        <Hero onShopNow={() => document.getElementById('dairy')?.scrollIntoView({ behavior: 'smooth' })} />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">
        {searchQuery && (
          <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
            <Search size={18} className="text-green-600" />
            <div>
              <h2 className="font-poppins font-bold text-lg text-gray-800">Results for "{searchQuery}"</h2>
              <p className="text-sm text-gray-400">{totalProductsFound} products found</p>
            </div>
          </div>
        )}

        {searchQuery && filteredCategories.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="text-6xl">🔍</div>
            <h3 className="font-poppins font-bold text-xl text-gray-700">No products found</h3>
            <p className="text-gray-400">Try a different search term</p>
            <button onClick={() => setSearchQuery('')} className="mt-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all">
              Clear Search
            </button>
          </div>
        ) : (
          (searchQuery ? filteredCategories : categories).map(cat => (
            <ProductSection
              key={cat.id}
              id={cat.id}
              title={cat.label}
              icon={cat.icon}
              products={cat.products}
              cartItems={cartItems}
              onAdd={addToCart}
              onRemove={removeFromCart}
            />
          ))
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-green-900 to-green-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Q</span>
                </div>
                <span className="font-poppins font-bold text-xl">Quality<span className="text-yellow-400">Mart</span></span>
              </div>
              <p className="text-green-200/70 text-sm leading-relaxed">Your trusted partner for fresh groceries delivered within 12 hours.</p>
              <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 px-3 py-1.5 rounded-full text-xs font-medium w-fit">
                ⚡ 12-Hour Delivery
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide">Shop by Category</h4>
              <ul className="space-y-2">
                {categories.map(c => (
                  <li key={c.id}>
                    <a href={`#${c.id}`} className="text-green-200/70 hover:text-white text-sm transition-colors">
                      {c.icon} {c.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide">Our Promise</h4>
              <ul className="space-y-2.5">
                {[
                  '✅ Quality checked products',
                  '🚚 12-hour delivery guarantee',
                  '🛡️ Secure UPI & COD payments',
                  '🔄 Hassle-free returns',
                  '📞 24/7 customer support',
                ].map(item => <li key={item} className="text-green-200/70 text-sm">{item}</li>)}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide">Contact Us</h4>
              <div className="space-y-2.5 text-sm text-green-200/70">
                <p>📞 8888478621</p>
                <p>🕐 Mon–Sun: 6 AM – 10 PM</p>
                <p>📍 Your neighbourhood store</p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-green-700/50 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-green-300/60 text-xs">© 2026 Quality Mart. All rights reserved.</p>
            <p className="text-green-300/60 text-xs">
              {products.length} products available · more products coming soon
            </p>
          </div>
        </div>
      </footer>

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-30 w-10 h-10 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center animate-fade-in-up"
          aria-label="Scroll to top"
        >
          <ArrowUp size={18} />
        </button>
      )}

      <CartSidebar
        isOpen={activeModal === 'cart'}
        cartItems={cartItems}
        onClose={() => setActiveModal(null)}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onDelete={deleteFromCart}
        onCheckout={handleCheckoutRequest}
      />

      {activeModal === 'auth' && (
        <AuthModal
          onClose={handleAuthClose}
          onSuccess={handleAuthSuccess}
          checkoutMode={pendingCheckout}
        />
      )}

      {activeModal === 'checkout' && (
        <CheckoutModal
          cartItems={cartItems}
          onClose={() => setActiveModal('cart')}
          onPlaceOrder={handlePlaceOrder}
        />
      )}

      {activeModal === 'receipt' && currentOrder && (
        <ReceiptModal order={currentOrder} onClose={handleCloseAll} />
      )}

      {showLetterModal && currentOrder && (
        <LetterModal order={currentOrder} onClose={() => setShowLetterModal(false)} />
      )}
    </div>
  );
}
