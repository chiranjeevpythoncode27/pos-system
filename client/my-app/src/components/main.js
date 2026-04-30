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
  
  // Customer info for order
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  // State for selected weight for each item
  const [selectedWeights, setSelectedWeights] = useState({});

  // Categories that get weight options
  const weightEnabledCategories = [
    'Rice', 
    'Pulses', 
    'Dal', 
    'Grains', 
    'Flour', 
    'Atta', 
    'Spices', 
    'Masala', 
    'Sugar', 
    'Salt', 
    'Dry Fruits', 
    'Cereals',
    'Grocery'
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
      console.log('API Response:', response.data);

      let items = [];
      if (Array.isArray(response.data)) {
        items = response.data;
      } else if (response.data?.items && Array.isArray(response.data.items)) {
        items = response.data.items;
      } else if (response.data && typeof response.data === 'object') {
        items = Object.values(response.data);
      } else {
        console.error('Unexpected data format:', response.data);
        items = [];
      }

      console.log('Processed items:', items);
      setMenuItems(items);

      // Extract unique categories
      const uniqueCategories = [
        'All',
        ...new Set(items.map(item => item.category).filter(Boolean)),
      ];
      setCategories(uniqueCategories);

      // Initialize selected weights - default to 1kg (1000) for weight-based items
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

  // Helper function to format prices
  const formatPrice = (price) => {
    return price ? price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : '0';
  };

  // Show notification
  const showAddNotification = (itemName) => {
    setNotificationMessage(`${itemName} added to cart!`);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  };

  // Filter menu items based on category and search
  const getFilteredItems = () => {
    if (!Array.isArray(menuItems)) return [];
    
    return menuItems.filter(item => {
      if (!item) return false;
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch = item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  };

  // Get items for search count
  const searchedItems = Array.isArray(menuItems) ? menuItems.filter(item => {
    return item && item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase());
  }) : [];

  const displayedItems = getFilteredItems();

  // Check if item should have weight options
  const hasWeightOptions = (item) => {
    return item && weightEnabledCategories.includes(item.category);
  };

  // Get available weight options with prices
  const getWeightOptions = (item) => {
    if (!item) return [];
    const basePrice = item.price || 0;
    
    // Calculate price based on weight option
    return weightOptionsList.map(option => ({
      weight: parseInt(option.value),
      price: Math.round(basePrice * option.multiplier),
      label: option.label,
      value: option.value
    }));
  };

  // Handle weight selection
  const selectWeight = (itemId, weight) => {
    setSelectedWeights(prev => ({
      ...prev,
      [itemId]: weight.toString()
    }));
  };

  // Get display price based on selected weight
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

  // Get selected weight label
  const getSelectedWeightLabel = (item) => {
    if (!item) return '';
    if (hasWeightOptions(item)) {
      const selectedWeight = selectedWeights[item._id] || '1000';
      const weightOptions = getWeightOptions(item);
      const option = weightOptions.find(opt => opt.weight.toString() === selectedWeight.toString());
      return option ? option.label : '1kg';
    }
    return '';
  };

  // Cart functions
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
      // Regular item without weight options
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

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const closeCart = () => {
    setIsCartOpen(false);
  };

  // Handle category click
  const handleCategoryClick = (category) => {
    setActiveCategory(category);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Handle customer info changes
  const handleCustomerNameChange = (e) => {
    setCustomerName(e.target.value);
  };

  const handleCustomerAddressChange = (e) => {
    setCustomerAddress(e.target.value);
  };

  const handleCustomerPhoneChange = (e) => {
    setCustomerPhone(e.target.value);
  };

  // Generate invoice message for WhatsApp with address
  const generateInvoiceMessage = () => {
    const date = new Date();
    const orderId = "ORD" + Date.now().toString().slice(-6);
    const formattedDate = date.toLocaleDateString("en-IN");
    const formattedTime = date.toLocaleTimeString("en-IN");

    let message = `🧾 *QUICKO - NEW ORDER* 🧾\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `👤 *Customer Name:* ${customerName}\n`;
    message += `📞 *Phone:* ${customerPhone}\n`;
    message += `📍 *Delivery Address:* ${customerAddress}\n`;
    message += `🆔 *Order ID:* ${orderId}\n`;
    message += `📅 *Date:* ${formattedDate}\n`;
    message += `⏰ *Time:* ${formattedTime}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `*ORDER DETAILS:*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `Item                          Qty    Price\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    cart.forEach((item) => {
      const total = item.price * item.quantity;
      const itemName = item.name.length > 25 ? item.name.substring(0, 22) + '...' : item.name;
      message += `${itemName.padEnd(25)} ${item.quantity.toString().padStart(3)}   ₹${formatPrice(total).padStart(10)}\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📦 *Total Items:* ${getTotalItems()}\n`;
    message += `💰 *Total Amount:* ₹${formatPrice(getTotalPrice())}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `*DELIVERY INFORMATION:*\n`;
    message += `🚚 Delivery to: ${customerAddress}\n`;
    message += `👤 Contact Person: ${customerName}\n`;
    message += `📞 Contact Number: ${customerPhone}\n\n`;
    message += `🙏 *Thank you for shopping with Quicko!*\n`;
    message += `⭐ Please share your feedback\n\n`;
    message += `📍 *Quicko - Your Trusted Store*\n`;
    message += `📞 Contact: +91 7060988418\n`;
    message += `🕐 Delivery Time: 30-45 minutes`;

    return message;
  };

  // Place order via WhatsApp
  const placeOrder = async () => {
    if (!customerName.trim()) {
      alert('Please enter your name');
      return;
    }

    if (!customerAddress.trim()) {
      alert('Please enter your delivery address');
      return;
    }

    if (!customerPhone.trim()) {
      alert('Please enter your phone number');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setPlacingOrder(true);

    try {
      const invoiceMessage = generateInvoiceMessage();
      const storePhone = "917060988418";
      const whatsappLink = `https://wa.me/${storePhone}?text=${encodeURIComponent(invoiceMessage)}`;
      window.open(whatsappLink, '_blank');
      
      // Reset form and cart
      setCart([]);
      setCustomerName('');
      setCustomerAddress('');
      setCustomerPhone('');
      closeCart();
      alert('Order placed successfully! Redirecting to WhatsApp...');
    } catch (err) {
      console.error('Error placing order:', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="menu-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading our delicious menu...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="menu-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchMenuItems}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-page">
      {/* Notification */}
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
              <h1 className="store-name">Quicko</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Menu Section */}
      <div className={`menu-container ${isCartOpen ? 'blur-background' : ''}`}>
        {/* Search Bar */}
        <div className="search-container">
          <div className="search-bar">
            <div className="search-icon">
              <svg className="search-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
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
        </div>

        {/* Category Filters */}
        <div className="category-filters-wrapper">
          <div className="category-filters">
            {categories.map(category => (
              <button
                key={category}
                className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Info */}
        {searchTerm && (
          <div className="search-results-info">
            <p>
              Found <strong>{searchedItems.length}</strong> {searchedItems.length === 1 ? 'item' : 'items'} matching "<strong>{searchTerm}</strong>"
              {activeCategory !== 'All' && ` • Showing from ${activeCategory} category`}
            </p>
          </div>
        )}

        {/* Menu Items Grid */}
        <div className="menu-grid">
          {displayedItems.map(item => (
            <div key={item._id} className="menu-card">
              {/* Image Container */}
              <div className="card-image-container">
                <img
                  src={item.image || 'https://via.placeholder.com/300x200?text=No+Image'}
                  alt={item.name}
                  className="card-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                  }}
                />
                {item.stock !== undefined && (
                  <div className={`stock-badge ${item.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                    {item.stock > 0 ? `In Stock: ${item.stock}` : 'Out of Stock'}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="card-content">
                <div className="card-header">
                  <h3 className="item-name">{item.name}</h3>
                </div>
                
                {/* Horizontal Scrollable Weight Selector */}
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
                    {!hasWeightOptions(item) && item.unit && (
                      <span className="item-unit">/{item.unit}</span>
                    )}
                  </div>
                  
                  {/* Add to Cart Button */}
                  <button 
                    className="add-to-cart-btn"
                    onClick={() => addToCart(item)}
                    disabled={item.stock === 0}
                  >
                    {item.stock === 0 ? (
                      'Out of Stock'
                    ) : (
                      <svg className="plus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No items message */}
        {displayedItems.length === 0 && (
          <div className="no-items-message">
            <div className="no-items-icon">🔍</div>
            <p>
              {searchTerm 
                ? `No items found for "${searchTerm}"${activeCategory !== 'All' ? ` in ${activeCategory}` : ''}`
                : `No items available in ${activeCategory} category.`
              }
            </p>
            {searchTerm && (
              <button className="clear-search-message-btn" onClick={handleClearSearch}>
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      <div className="floating-cart" onClick={toggleCart}>
        <svg className="floating-cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {getTotalItems() > 0 && (
          <span className="floating-cart-badge">{getTotalItems()}</span>
        )}
        {getTotalItems() > 0 && (
          <span className="floating-cart-total">₹{formatPrice(getTotalPrice().toFixed(2))}</span>
        )}
      </div>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <>
          <div className="cart-overlay" onClick={closeCart}></div>
          <div className="cart-sidebar">
            <div className="cart-header">
              <h3>Your Cart ({getTotalItems()})</h3>
              <button className="close-cart-btn" onClick={closeCart}>
                <svg className="close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <div className="empty-cart-icon">🛒</div>
                  <p>Your cart is empty</p>
                  <p className="empty-cart-text">Add some items to get started!</p>
                </div>
              ) : (
                <>
                  {cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-info">
                        <span className="cart-item-name">{item.name}</span>
                        <span className="cart-item-price">₹{formatPrice((item.price * item.quantity).toFixed(2))}</span>
                      </div>
                      <div className="cart-item-controls">
                        <button 
                          className="quantity-btn minus"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button 
                          className="quantity-btn plus"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                        >
                          +
                        </button>
                        <button 
                          className="remove-btn"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <svg className="remove-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Customer Information Form */}
                  <div className="customer-info-form">
                    <h4>Delivery Details</h4>
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={customerName}
                      onChange={handleCustomerNameChange}
                      className="customer-input"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      value={customerPhone}
                      onChange={handleCustomerPhoneChange}
                      className="customer-input"
                    />
                    <textarea
                      placeholder="Complete Delivery Address *"
                      value={customerAddress}
                      onChange={handleCustomerAddressChange}
                      className="customer-textarea"
                      rows="3"
                    />
                  </div>
                </>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <span>Total:</span>
                  <span className="total-amount">₹{formatPrice(getTotalPrice().toFixed(2))}</span>
                </div>
                <button 
                  className="checkout-btn" 
                  onClick={placeOrder}
                  disabled={placingOrder || !customerName.trim() || !customerAddress.trim() || !customerPhone.trim()}
                >
                  {placingOrder ? 'Placing Order...' : 'Order via WhatsApp'}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-section">
              <h3 className="footer-title">Quicko</h3>
              <p className="footer-text">Your one-stop shop for all grocery needs.</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Quicko. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Main;