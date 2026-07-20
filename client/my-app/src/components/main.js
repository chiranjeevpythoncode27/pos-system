import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './main.css';

const Main = () => {
  // State for active category, search term, and cart
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // New states for API data
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState(['All']);
  
  // Customer info for order - only name as requested
  const [customerName, setCustomerName] = useState('');
  
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  // State for selected weight for each item
  const [selectedWeights, setSelectedWeights] = useState({});

  // Categories that get weight options
  const weightEnabledCategories = [
    'Rice', 'Pulses', 'Dal', 'Grains', 'Flour', 'Atta', 'Spices', 
    'Masala', 'Sugar', 'Salt', 'Dry Fruits', 'Cereals', 'Grocery'
  ];

  // Weight options with labels and multipliers
  const weightOptionsList = [
    { value: '100', label: '100g', multiplier: 0.1 },
    { value: '250', label: '250g', multiplier: 0.25 },
    { value: '500', label: '500g', multiplier: 0.5 },
    { value: '1000', label: '1kg', multiplier: 1 },
    { value: '2000', label: '2kg', multiplier: 2 },
    { value: '3000', label: '3kg', multiplier: 3 },
    { value: '5000', label: '5kg', multiplier: 5 },
    { value: '10000', label: '10kg', multiplier: 10 },
    { value: '25000', label: '25kg', multiplier: 25 }
  ];

  // Fetch items from API
  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Backend base URL
  const API_URL = 'https://suyalgeneralstore.onrender.com/api';

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/items`);

      let items = [];
      if (Array.isArray(response.data)) {
        items = response.data;
      } else if (response.data?.items && Array.isArray(response.data.items)) {
        items = response.data.items;
      } else if (response.data && typeof response.data === 'object') {
        items = Object.values(response.data);
      }

      setMenuItems(items);

      // Extract unique categories
      const uniqueCategories = [
        'All',
        ...new Set(items.map(item => item.category).filter(Boolean)),
      ];
      setCategories(uniqueCategories);

      // Initialize selected weights
      const initialWeights = {};
      items.forEach(item => {
        if (weightEnabledCategories.includes(item.category)) {
          initialWeights[item._id] = '1000'; // Default to 1kg
        }
      });
      setSelectedWeights(initialWeights);
      setError(null);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to load menu items. Please try again later.');
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return price ? price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : '0';
  };

  const showAddNotification = (itemName) => {
    setNotificationMessage(`${itemName} added to cart!`);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  };

  // Category free search
  const getFilteredItems = () => {
    if (!Array.isArray(menuItems)) return [];
    
    return menuItems.filter(item => {
      if (!item) return false;
      const matchesSearch = item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // If there's a search term, ignore category filter completely
      if (searchTerm) {
        return matchesSearch;
      }
      
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      return matchesCategory;
    });
  };

  const searchedItems = Array.isArray(menuItems) ? menuItems.filter(item => {
    return item && item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase());
  }) : [];

  const displayedItems = getFilteredItems();

  const hasWeightOptions = (item) => {
    return item && weightEnabledCategories.includes(item.category);
  };

  const getWeightOptions = (item) => {
    if (!item) return [];
    const basePrice = item.price || 0;
    return weightOptionsList.map(option => ({
      weight: parseInt(option.value),
      price: Math.round(basePrice * option.multiplier),
      label: option.label,
      value: option.value
    }));
  };

  const selectWeight = (itemId, weight) => {
    setSelectedWeights(prev => ({
      ...prev,
      [itemId]: weight.toString()
    }));
  };

  const getDisplayPrice = (item) => {
    if (!item) return 0;
    if (hasWeightOptions(item)) {
      const selectedWeight = selectedWeights[item._id] || '1000';
      const weightOptions = getWeightOptions(item);
      const option = weightOptions.find(opt => opt.weight.toString() === selectedWeight.toString());
      return option ? option.price : item.price;
    }
    return item.price || 0;
  };

  const addToCart = (item) => {
    if (!item) return;
    
    if (hasWeightOptions(item)) {
      const selectedWeight = selectedWeights[item._id] || '1000';
      const weightOptions = getWeightOptions(item);
      const option = weightOptions.find(opt => opt.weight.toString() === selectedWeight.toString());
      const itemPrice = option ? option.price : item.price;
      const weightText = ` (${option.label})`;
      
      setCart(prevCart => {
        const cartItemId = `${item._id}-${selectedWeight}`;
        const existingItem = prevCart.find(cartItem => cartItem.id === cartItemId);
        
        if (existingItem) {
          if (item.stock && existingItem.quantity >= item.stock) {
            alert(`Only ${item.stock} items available in stock`);
            return prevCart;
          }
          return prevCart.map(cartItem =>
            cartItem.id === cartItemId
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          );
        } else {
          showAddNotification(item.name + weightText);
          return [...prevCart, { 
            id: cartItemId,
            originalId: item._id,
            name: `${item.name} ${weightText}`, 
            price: itemPrice, 
            quantity: 1,
            image: item.image,
            stock: item.stock || 99,
            weight: selectedWeight,
            weightLabel: option.label,
            baseName: item.name
          }];
        }
      });
    } else {
      setCart(prevCart => {
        const existingItem = prevCart.find(cartItem => cartItem.id === item._id);
        if (existingItem) {
          if (item.stock && existingItem.quantity >= item.stock) {
            alert(`Only ${item.stock} items available in stock`);
            return prevCart;
          }
          return prevCart.map(cartItem =>
            cartItem.id === item._id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          );
        } else {
          showAddNotification(item.name);
          return [...prevCart, { 
            id: item._id, 
            name: item.name, 
            price: item.price, 
            quantity: 1,
            image: item.image,
            stock: item.stock || 99
          }];
        }
      });
    }
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    
    const cartItem = cart.find(item => item.id === itemId);
    if (cartItem && cartItem.stock && newQuantity > cartItem.stock) {
      alert(`Only ${cartItem.stock} items available in stock`);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getItemTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalPrice = () => {
    if (cart.length === 0) return 0;
    return getItemTotal();
  };

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const closeCart = () => {
    setIsCartOpen(false);
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    // If clicking a category, clear search so it filters correctly
    if (searchTerm) setSearchTerm('');
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleCustomerNameChange = (e) => {
    setCustomerName(e.target.value);
  };

  const generateInvoiceMessage = () => {
    const date = new Date();
    const orderId = "ORD" + Date.now().toString().slice(-6);
    
    let message = `🧾 *NEW ORDER - Suyal General Store* 🧾\n\n`;
    message += `👤 *Name:* ${customerName}\n`;
    message += `🆔 *Order ID:* ${orderId}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    cart.forEach((item) => {
      const total = item.price * item.quantity;
      message += `${item.name} x ${item.quantity}  -  ₹${formatPrice(total)}\n`;
    });
    
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `💰 *To Pay:* ₹${formatPrice(getTotalPrice())}\n`;
    return message;
  };

  const placeOrder = async () => {
    if (!customerName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (cart.length === 0) return;

    setPlacingOrder(true);
    try {
      const invoiceMessage = generateInvoiceMessage();
      const storePhone = "917060988418";
      const whatsappLink = `https://wa.me/${storePhone}?text=${encodeURIComponent(invoiceMessage)}`;
      window.open(whatsappLink, '_blank');
      
      setCart([]);
      setCustomerName('');
      closeCart();
    } catch (err) {
      alert('Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Helper to get emoji for categories
  const getCategoryEmoji = (category) => {
    const lower = category.toLowerCase();
    if (lower === 'all') return '🔠';
    if (lower.includes('rice') || lower.includes('grain')) return '🍚';
    if (lower.includes('dal') || lower.includes('pulse')) return '🥣';
    if (lower.includes('flour') || lower.includes('atta')) return '🌾';
    if (lower.includes('spice') || lower.includes('masala')) return '🌶️';
    if (lower.includes('sugar') || lower.includes('salt')) return '🧂';
    if (lower.includes('dry fruit')) return '🥜';
    if (lower.includes('oil')) return '🛢️';
    if (lower.includes('snack')) return '🥨';
    if (lower.includes('beverage') || lower.includes('drink')) return '🥤';
    if (lower.includes('dairy') || lower.includes('milk')) return '🥛';
    if (lower.includes('veg')) return '🥬';
    if (lower.includes('fruit')) return '🍎';
    if (lower.includes('breakfast')) return '🍞';
    if (lower.includes('chinese')) return '🍜';
    if (lower.includes('tandoori')) return '🍢';
    return '🛒'; // default grocery
  };

  if (loading) {
    return (
      <div className="menu-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-page">
      {showNotification && (
        <div className="notification">
          <span className="notification-icon">✓</span>
          <span className="notification-message">{notificationMessage}</span>
        </div>
      )}

      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-content">
            <div className="nav-brand">
              <h1 className="store-name">Suyal General Store</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Menu Section */}
      <div className={`menu-container ${isCartOpen ? 'hidden' : ''}`}>
        
        {/* Banner Section */}
        <a href="#offers" className="banner-link">
          <div className="banner-container">
            <div className="banner-content">
              <h2>Fresh Groceries,<br/><span>Everyday!</span></h2>
              <p>Quality ingredients. Best prices.</p>
              <button className="banner-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                Shop Now
              </button>
            </div>
            <div className="banner-dots">
              <span className="dot active"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        </a>

        {/* Search Bar & Filter */}
        <div className="search-filter-container">
          <div className="search-bar">
            <div className="search-icon">
              <svg className="search-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search for items, groceries..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={handleClearSearch}>
                <svg className="clear-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button className="filter-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line>
              <line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line>
              <line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
          </button>
        </div>

        {/* Circular Category Filters - compact layout */}
        <div className="category-filters-wrapper">
          <div className="category-filters">
            {categories.map(category => (
              <div 
                key={category}
                className={`category-item ${activeCategory === category ? 'active' : ''}`}
                onClick={() => handleCategoryClick(category)}
              >
                <div className="category-icon-circle">
                  <span className="category-emoji">{getCategoryEmoji(category)}</span>
                </div>
                <span className="category-label">{category}</span>
                {activeCategory === category && <div className="active-indicator"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Section Header */}
        <div className="section-header">
          <h3>{searchTerm ? 'Search Results' : 'Popular Items'}</h3>
          {!searchTerm && <button className="view-all-btn">View All <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>}
        </div>

        {/* Menu Items Grid */}
        <div className="menu-grid">
          {displayedItems.map(item => (
            <div key={item._id} className="menu-card">
              <div className="card-image-container">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80'}
                  alt={item.name}
                  className="card-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80';
                  }}
                />
                <div className={`diet-badge ${item.category?.toLowerCase().includes('non veg') ? 'non-veg' : 'veg'}`}>
                   {item.category?.toLowerCase().includes('non veg') ? '🔴' : '🌿'}
                </div>
              </div>

              <div className="card-content">
                <h3 className="item-name">{item.name}</h3>
                
                {hasWeightOptions(item) && (
                  <div className="weight-selector-container">
                    <div className="weight-selector-scroll">
                      {getWeightOptions(item).map((option, index) => (
                        <button
                          key={index}
                          className={`weight-chip ${selectedWeights[item._id] === option.weight.toString() ? 'active' : ''}`}
                          onClick={() => selectWeight(item._id, option.weight)}
                        >
                          <span className="weight-chip-label">{option.label}</span>
                          <span className="weight-chip-price">₹{formatPrice(option.price)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="card-footer">
                  <div className="price-section">
                    <span className="item-price">₹{formatPrice(getDisplayPrice(item))}</span>
                  </div>
                  
                  <button 
                    className="add-to-cart-outline-btn"
                    onClick={() => addToCart(item)}
                    disabled={item.stock === 0}
                  >
                    {item.stock === 0 ? 'Out' : '+ Add'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {displayedItems.length === 0 && (
          <div className="no-items-message">
            <div className="no-items-icon">🔍</div>
            <p>No items found.</p>
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      {getTotalItems() > 0 && !isCartOpen && (
        <div className="bottom-cart-bar" onClick={toggleCart}>
          <div className="bottom-cart-left">
             <div className="bottom-cart-icon-wrapper">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
               </svg>
               <span className="bottom-cart-count">{getTotalItems()}</span>
             </div>
             <span className="bottom-cart-text">View Cart</span>
          </div>
          <div className="bottom-cart-right">
             <span className="bottom-cart-total">₹{formatPrice(getTotalPrice())}</span>
             <svg className="chevron-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>
      )}

      {/* Full Page Cart Redesign */}
      {isCartOpen && (
        <div className="cart-page">
          <div className="cart-page-header">
            <button className="back-btn" onClick={closeCart}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </button>
            <div className="nav-brand">
              <h1 className="store-name">Suyal General Store</h1>
            </div>
            <button className="clear-cart-text-btn" onClick={clearCart}>
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
               Clear Cart
            </button>
          </div>

          <div className="cart-page-content">
            {/* Cart Summary Banner */}
            <div className="cart-summary-banner">
              <div className="cart-summary-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="cart-summary-text">
                <h2>Your Cart</h2>
                <p>{getTotalItems()} Items • All items selected</p>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="cart-items-list">
              {cart.map(item => (
                <div key={item.id} className="cart-item-row">
                  <div className="cart-item-check">
                     <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  </div>
                  <div className="cart-item-image">
                    <img src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&q=80'} alt={item.name} />
                  </div>
                  <div className="cart-item-details">
                    <div className="cart-item-title-row">
                      <h4>{item.name}</h4>
                      <button className="item-remove-btn" onClick={() => removeFromCart(item.id)}>✕</button>
                    </div>
                    <div className="cart-item-customizable">
                       <span className="dot-green"></span> Customizable
                    </div>
                    <div className="cart-item-price-row">
                       <span className="cart-item-price">₹{formatPrice(item.price)}</span>
                       <div className="cart-item-quantity">
                         <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                         <span>{item.quantity}</span>
                         <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>



            {/* Bill Summary */}
            <div className="bill-summary">
              <h3>Bill Summary</h3>
              <div className="bill-row">
                <span>Item Total ({getTotalItems()} items)</span>
                <span>₹{formatPrice(getItemTotal())}</span>
              </div>
              <div className="bill-divider"></div>
              <div className="bill-row total-pay">
                <span>To Pay</span>
                <span>₹{formatPrice(getTotalPrice())}</span>
              </div>
            </div>
            
            {/* Customer Details (Name only) */}
            <div className="bill-summary customer-form">
               <input
                  type="text"
                  placeholder="Your Name *"
                  value={customerName}
                  onChange={handleCustomerNameChange}
                  className="cart-customer-input"
                />
            </div>
            
            {/* Extra padding for fixed bottom bar */}
            <div style={{height: '100px'}}></div>
          </div>

          {/* Checkout Bottom Bar */}
          <div className="checkout-bottom-bar">
            <div className="secure-checkout">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
              <div>
                <strong>Secure Checkout</strong>
                <p>100% safe & secure payments</p>
              </div>
            </div>
            <button 
              className="place-order-btn"
              onClick={placeOrder}
              disabled={placingOrder || !customerName.trim()}
            >
              <div>
                <strong>Place Order</strong>
                <p>Total ₹{formatPrice(getTotalPrice())}</p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Main;