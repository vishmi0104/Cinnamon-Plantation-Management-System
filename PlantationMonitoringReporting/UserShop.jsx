import React, { useEffect, useState, useCallback } from "react";
import http from "../../api/http";
import { useNavigate } from "react-router-dom";

const UserShop = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [currentView, setCurrentView] = useState("home"); // "home" or "shop"
  const navigate = useNavigate();

  // Fetch inventory items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await http.get("/inventory");
      // Filter to show only available items (not out of stock)
      const availableItems = response.data.filter(item => item.status !== "Out of Stock");
      setItems(availableItems);
    } catch (err) {
      setError("Failed to load shop items");
      console.error("Error fetching inventory:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  // Cart functions
  const addToCart = (item, quantity = 1) => {
    // Check if requested quantity is available
    if (quantity > item.quantity) {
      alert(`Only ${item.quantity} ${item.unit} available in stock`);
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.itemId === item.itemId);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > item.quantity) {
          alert(`Cannot add more items. Only ${item.quantity} ${item.unit} available in stock`);
          return prevCart;
        }
        return prevCart.map(cartItem =>
          cartItem.itemId === item.itemId
            ? { ...cartItem, quantity: newQuantity }
            : cartItem
        );
      } else {
        return [...prevCart, {
          itemId: item.itemId,
          name: item.name,
          category: item.category,
          unit: item.unit,
          price: item.price || 10, // Use actual price from inventory, fallback to 10
          quantity,
          maxAvailable: item.quantity, // Track max available for validation
        }];
      }
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.itemId !== itemId));
  };

  const updateCartQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.itemId === itemId ? { ...item, quantity } : item
        )
      );
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const clearCart = () => {
    setCart([]);
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;

    try {
      const orderData = {
        items: cart,
        totalAmount: getCartTotal(),
      };

      // Place the order
      await http.post("/orders", orderData);

      // Update inventory quantities for each cart item
      for (const cartItem of cart) {
        try {
          const inventoryItem = items.find(item => item.itemId === cartItem.itemId);
          if (inventoryItem) {
            const newQuantity = inventoryItem.quantity - cartItem.quantity;

            // Update inventory via API
            await http.put(`/inventory/${inventoryItem._id}`, {
              quantity: newQuantity,
              previousQuantity: inventoryItem.quantity
            });
          }
        } catch (inventoryError) {
          console.error(`Failed to update inventory for ${cartItem.name}:`, inventoryError);
          // Continue with other items even if one fails
        }
      }

      // Refresh inventory data
      await fetchItems();

      clearCart();
      alert("Order placed successfully! Inventory has been updated.");
    } catch (err) {
      alert("Failed to place order. Please try again.");
      console.error("Error placing order:", err);
    }
  };

  // Check for orders requiring payment
  const checkPaymentRequiredOrders = useCallback(async () => {
    try {
      const response = await http.get('/orders/my-orders');
      const paymentRequiredOrder = response.data.find(order => order.status === 'payment_required');
      if (paymentRequiredOrder) {
        // Redirect to payment page
        navigate(`/user/payment?orderId=${paymentRequiredOrder._id}`);
      }
    } catch (err) {
      console.error('Error checking payment required orders:', err);
    }
  }, [navigate]);

  useEffect(() => {
    fetchItems();
    checkPaymentRequiredOrders();
  }, [checkPaymentRequiredOrders]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading shop...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Clean Navigation */}
      <nav className="bg-white shadow-sm border-b border-amber-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center cursor-pointer" onClick={() => setCurrentView("home")}>
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-md flex items-center justify-center mr-3">
                <span className="text-white text-lg font-bold">C</span>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Cinnex
                </span>
                <div className="text-xs text-amber-800/70 -mt-1">Premium Quality</div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => setCurrentView("home")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentView === "home"
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                    : "text-amber-800 hover:bg-amber-50"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Home
              </button>
              <button
                onClick={() => setCurrentView("shop")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentView === "shop"
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                    : "text-amber-800 hover:bg-amber-50"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
                Shop
              </button>
              <button
                onClick={() => navigate("/user/orders")}
                className="px-4 py-2 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-50 transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                  <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Orders
              </button>
              <button
                onClick={() => navigate("/user/payments")}
                className="px-4 py-2 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-50 transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
                Payments
              </button>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Cart Button */}
              <button
                onClick={() => setShowCart(true)}
                className="relative p-2 text-amber-700 hover:bg-amber-50 rounded-full transition-all duration-200"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                  </svg>
                </div>
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cart.length}
                  </span>
                )}
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center px-4 py-2 border border-amber-200 text-amber-800 rounded-md text-sm font-medium hover:bg-amber-50 transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 3a1 1 0 10-2 0v6.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 12.586V6z" clipRule="evenodd" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Home Page */}
      {currentView === "home" && (
        <div className="relative overflow-hidden min-h-screen bg-white">
          {/* Simple, Elegant Background */}
          <div className="absolute inset-0 -z-10">
            {/* Minimal background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-50 rounded-full opacity-50 -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-50 rounded-full opacity-60 -ml-20 -mb-20"></div>
            
            {/* Subtle pattern overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('/spice-cinnamon.jpg')`,
                opacity: 0.05
              }}
              onError={(e) => {
                e.target.style.opacity = '0';
              }}
            ></div>
            
            {/* Light diagonal accents */}
            <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-amber-200/0 via-amber-200/40 to-amber-200/0 rotate-6"></div>
            <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-orange-200/0 via-orange-200/30 to-orange-200/0 -rotate-3"></div>
          </div>

          {/* Hero Section - Clean and Professional */}
          <section className="relative py-20 px-4">
            <div className="max-w-5xl mx-auto text-center">
              <div className="inline-flex items-center px-4 py-1.5 bg-amber-50 rounded-md text-amber-800 text-sm font-medium mb-8">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></div>
                Premium Cinnamon Products
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-8 text-amber-900">
                Elevate Your
                <span className="block text-orange-600 mt-1">
                  Culinary Experience
                </span>
              </h1>

              <p className="text-lg text-amber-800/80 mb-10 max-w-2xl mx-auto leading-relaxed">
                Discover the finest selection of premium cinnamon products, sourced directly from our sustainable plantations.
                Quality, authenticity, and exceptional flavor in every product.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => setCurrentView("shop")}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-md font-medium text-base shadow hover:shadow-md transition-all duration-300"
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    Start Shopping
                  </span>
                </button>
                <button
                  onClick={() => navigate("/user/orders")}
                  className="px-6 py-3 bg-white border border-amber-200 text-amber-800 rounded-md font-medium text-base hover:bg-amber-50 transition-all duration-300"
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                      <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    View Orders
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* Features Section - Clean and Professional */}
          <section className="py-16 px-4 bg-white">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-bold text-amber-900 mb-3">
                  Why Choose Cinnex?
                </h2>
                <div className="w-16 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto mb-4 rounded-full"></div>
                <p className="text-base text-amber-700/80 max-w-2xl mx-auto">
                  We're committed to delivering exceptional quality and sustainable practices
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-amber-100 hover:shadow transition-all duration-300">
                  <div className="w-12 h-12 bg-green-100 rounded-md flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-amber-900 mb-2">Sustainable Farming</h3>
                  <p className="text-amber-700/80 text-sm">Environmentally responsible cultivation practices that preserve our planet</p>
                </div>

                <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-amber-100 hover:shadow transition-all duration-300">
                  <div className="w-12 h-12 bg-amber-100 rounded-md flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-amber-900 mb-2">Premium Quality</h3>
                  <p className="text-amber-700/80 text-sm">Rigorous quality control ensures only the finest products reach you</p>
                </div>

                <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-amber-100 hover:shadow transition-all duration-300">
                  <div className="w-12 h-12 bg-orange-100 rounded-md flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-amber-900 mb-2">Fast Delivery</h3>
                  <p className="text-amber-700/80 text-sm">Quick and reliable shipping to get your products when you need them</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section - Clean and Professional */}
          <section className="py-16 px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="bg-white rounded-lg p-8 shadow-sm border border-amber-100">
                <h2 className="text-2xl md:text-3xl font-bold mb-3 text-amber-900">
                  Ready to Experience Excellence?
                </h2>
                <p className="text-base mb-6 text-amber-700/80">
                  Join thousands of satisfied customers who trust Cinnex for their premium cinnamon needs
                </p>
                <button
                  onClick={() => setCurrentView("shop")}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-md font-medium transition-all duration-300"
                >
                  <span className="flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    Explore Our Collection
                  </span>
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Shop Page */}
      {currentView === "shop" && (
        <div className="py-8 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            {/* Shop Header */}
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-amber-900 mb-3">
                Premium Collection
              </h1>
              <div className="w-16 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto mb-4 rounded-full"></div>
              <p className="text-base text-amber-700/80 max-w-xl mx-auto">
                Discover our carefully curated selection of high-quality cinnamon products
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-500 border-t-transparent absolute top-0"></div>
                </div>
                <p className="text-gray-600 mt-6 text-lg">Loading premium products...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-3xl p-12 text-center max-w-md mx-auto shadow-lg">
                <div className="text-red-500 text-6xl mb-6">⚠️</div>
                <h3 className="text-xl font-bold text-red-800 mb-3">Unable to Load Products</h3>
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && items.length === 0 && (
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-200/50 p-16 text-center max-w-md mx-auto">
                <div className="text-7xl mb-6">📦</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Products Available</h3>
                <p className="text-gray-600 text-lg">Check back soon for new arrivals</p>
              </div>
            )}

            {/* Products Grid */}
            {!loading && !error && items.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-lg shadow-sm border border-amber-100 overflow-hidden hover:shadow transition-all duration-300"
                  >
                    {/* Product Header */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-amber-900 mb-1">
                            {item.name}
                          </h3>
                          <div className="flex items-center">
                            {item.category === "harvest" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            {item.category === "resource" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )}
                            {item.category === "final product" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                            )}
                            <p className="text-xs text-amber-700/70 uppercase tracking-wide font-medium">
                              {item.category.replace('-', ' ')}
                            </p>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-md text-xs font-medium ${
                          (() => {
                            const cartQty = cart.find(cartItem => cartItem.itemId === item.itemId)?.quantity || 0;
                            const availableQty = item.quantity - cartQty;
                            if (availableQty <= 0) return "bg-red-100 text-red-700";
                            if (availableQty <= item.reorderLevel) return "bg-amber-100 text-amber-700";
                            return "bg-green-100 text-green-700";
                          })()
                        }`}>
                          {(() => {
                            const cartQty = cart.find(cartItem => cartItem.itemId === item.itemId)?.quantity || 0;
                            const availableQty = item.quantity - cartQty;
                            if (availableQty <= 0) return "Out of Stock";
                            if (availableQty <= item.reorderLevel) return "Low Stock";
                            return "Available";
                          })()}
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-amber-50 rounded-md">
                          <span className="text-xs font-medium text-amber-800">Price per {item.unit}</span>
                          <span className="font-bold text-base text-orange-600">
                            ${item.price?.toFixed(2) || '10.00'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-amber-50 rounded-md">
                          <span className="text-xs font-medium text-amber-800">Available</span>
                          <span className="font-medium text-amber-900">
                            {(() => {
                              const cartQty = cart.find(cartItem => cartItem.itemId === item.itemId)?.quantity || 0;
                              const availableQty = item.quantity - cartQty;
                              return `${availableQty} ${item.unit}`;
                            })()}
                          </span>
                        </div>
                        {item.manufactureDate && (
                          <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
                            <span className="text-xs font-medium text-blue-800">Manufactured</span>
                            <span className="font-medium text-blue-900">
                              {new Date(item.manufactureDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {item.expireDate && (
                          <div className="flex items-center justify-between p-2 bg-red-50 rounded-md">
                            <span className="text-xs font-medium text-red-800">Expires</span>
                            <span className={`font-medium ${new Date(item.expireDate) < new Date() ? 'text-red-600' : 'text-red-900'}`}>
                              {new Date(item.expireDate).toLocaleDateString()}
                              {new Date(item.expireDate) < new Date() && (
                                <span className="ml-1 text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-md font-medium">
                                  EXPIRED
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between p-2 bg-amber-50 rounded-md">
                          <span className="text-xs font-medium text-amber-800">Item ID</span>
                          <span className="font-mono text-xs text-amber-900 bg-white px-2 py-1 rounded-md border border-amber-200">
                            {item.itemId}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Purchase Section */}
                    <div className="px-4 pb-4">
                      {/* Quantity Controls */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-amber-800">
                            Quantity ({item.unit})
                          </label>
                          <span className="text-xs text-amber-700/70">
                            Max: {(() => {
                              const cartQty = cart.find(cartItem => cartItem.itemId === item.itemId)?.quantity || 0;
                              return item.quantity - cartQty;
                            })()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              const currentQty = cart.find(cartItem => cartItem.itemId === item.itemId)?.quantity || 0;
                              if (currentQty > 0) {
                                updateCartQuantity(item.itemId, currentQty - 1);
                              }
                            }}
                            className="w-8 h-8 bg-amber-50 hover:bg-amber-100 rounded-md flex items-center justify-center text-amber-800 transition-all duration-200"
                            disabled={item.status === "Out of Stock"}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <div className="flex-1 text-center">
                            <span className="text-base font-bold text-amber-900">
                              {cart.find(cartItem => cartItem.itemId === item.itemId)?.quantity || 0}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              const currentQty = cart.find(cartItem => cartItem.itemId === item.itemId)?.quantity || 0;
                              const maxAvailable = item.quantity - currentQty;
                              if (currentQty < maxAvailable) {
                                addToCart(item, 1);
                              }
                            }}
                            className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200 ${
                              (() => {
                                const currentQty = cart.find(cartItem => cartItem.itemId === item.itemId)?.quantity || 0;
                                const maxAvailable = item.quantity - currentQty;
                                return currentQty >= maxAvailable ? "bg-amber-50 text-amber-300 cursor-not-allowed" : "bg-amber-50 hover:bg-amber-100 text-amber-800";
                              })()
                            }`}
                            disabled={(() => {
                              const currentQty = cart.find(cartItem => cartItem.itemId === item.itemId)?.quantity || 0;
                              const maxAvailable = item.quantity - currentQty;
                              return currentQty >= maxAvailable;
                            })()}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => {
                          const currentQty = cart.find(cartItem => cartItem.itemId === item.itemId)?.quantity || 0;
                          if (currentQty === 0) {
                            addToCart(item, 1);
                          }
                        }}
                        className={`w-full py-2 px-3 rounded-md font-medium text-sm transition-all duration-300 ${
                          (() => {
                            const cartQty = cart.find(cartItem => cartItem.itemId === item.itemId)?.quantity || 0;
                            const availableQty = item.quantity - cartQty;
                            return availableQty <= 0
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : cart.find(cartItem => cartItem.itemId === item.itemId)?.quantity > 0
                              ? "bg-green-500 text-white hover:bg-green-600"
                              : "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700";
                          })()
                        }`}
                        disabled={(() => {
                          const cartQty = cart.find(cartItem => cartItem.itemId === item.itemId)?.quantity || 0;
                          const availableQty = item.quantity - cartQty;
                          return availableQty <= 0;
                        })()}
                      >
                        {(() => {
                          const cartQty = cart.find(cartItem => cartItem.itemId === item.itemId)?.quantity || 0;
                          const availableQty = item.quantity - cartQty;
                          return availableQty <= 0 ? (
                            <span className="flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                              Out of Stock
                            </span>
                          ) : cart.find(cartItem => cartItem.itemId === item.itemId)?.quantity > 0 ? (
                            <span className="flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              In Cart ({cart.find(cartItem => cartItem.itemId === item.itemId)?.quantity})
                            </span>
                          ) : (
                            <span className="flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Add to Cart
                            </span>
                          );
                        })()}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modern Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-md max-w-lg w-full max-h-[85vh] overflow-hidden border border-amber-100">
            {/* Cart Header */}
            <div className="p-4 border-b border-amber-100 bg-amber-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-amber-500 rounded-md flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-amber-900">Shopping Cart</h2>
                    <p className="text-xs text-amber-700/70">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-1 hover:bg-amber-100 rounded-md transition-colors duration-200 text-amber-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Cart Items */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-10">
                  <div className="inline-block p-4 bg-amber-50 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-amber-900 font-medium">Your cart is empty</p>
                  <p className="text-amber-700/70 text-sm mt-1">Add some premium products!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => {
                    const inventoryItem = items.find(inv => inv.itemId === item.itemId);
                    const maxAvailable = inventoryItem ? inventoryItem.quantity : item.maxAvailable;

                    return (
                      <div key={item.itemId} className="flex items-center justify-between p-3 bg-amber-50 rounded-md">
                        <div className="flex-1 pr-4">
                          <h3 className="font-bold text-amber-900 text-sm mb-1">{item.name}</h3>
                          <p className="text-xs text-amber-700/80 mb-1">${item.price} each • {item.unit}</p>
                          <p className="text-xs text-amber-700/70">Available: {maxAvailable} {item.unit}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1 bg-white rounded-md p-0.5 border border-amber-200">
                            <button
                              onClick={() => updateCartQuantity(item.itemId, item.quantity - 1)}
                              className="w-6 h-6 hover:bg-amber-50 rounded-sm flex items-center justify-center text-amber-800"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-6 text-center font-medium text-amber-900 text-sm">{item.quantity}</span>
                            <button
                              onClick={() => {
                                if (item.quantity < maxAvailable) {
                                  updateCartQuantity(item.itemId, item.quantity + 1);
                                } else {
                                  alert(`Cannot add more. Only ${maxAvailable} ${item.unit} available`);
                                }
                              }}
                              className="w-6 h-6 hover:bg-amber-50 rounded-sm flex items-center justify-center text-amber-800"
                              disabled={item.quantity >= maxAvailable}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.itemId)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-sm transition-colors duration-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-amber-100 bg-amber-50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-amber-900">Total: ${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={clearCart}
                    className="flex-1 py-2 px-4 border border-amber-200 text-amber-800 rounded-md hover:bg-amber-100 transition-all duration-200 font-medium text-sm"
                  >
                    <span className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear Cart
                    </span>
                  </button>
                  <button
                    onClick={placeOrder}
                    className="flex-1 py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-md hover:from-amber-600 hover:to-orange-700 transition-all duration-200 font-medium text-sm"
                  >
                    <span className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Place Order
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserShop;