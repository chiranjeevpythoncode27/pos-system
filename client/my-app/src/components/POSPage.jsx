// AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { itemAPI } from '../services/api';
import './POSPage.css';

const AdminPage = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedWeight, setSelectedWeight] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [imageUrl, setImageUrl] = useState('');
  const [availableWeights, setAvailableWeights] = useState(['All']);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    weight: ''
  });

  // Predefined weight options
  const weightOptions = [
    { value: '250gm', label: '250 gm' },
    { value: '500gm', label: '500 gm' },
    { value: '1kg', label: '1 kg' },
    { value: '2kg', label: '2 kg' },
    { value: '5kg', label: '5 kg' },
    { value: '10kg', label: '10 kg' },
    { value: '25kg', label: '25 kg' },
    { value: 'piece', label: 'Per Piece' },
    { value: 'dozen', label: 'Per Dozen' },
    { value: 'box', label: 'Per Box' }
  ];

  // Categories that typically have weights
  const weightBasedCategories = ['Pulses', 'Masala', 'Dal', 'Rice', 'Flour', 'Grains', 'Spices', 'Sugar', 'Salt'];

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, selectedCategory, selectedWeight, searchTerm]);

  useEffect(() => {
    if (selectedCategory !== 'All' && weightBasedCategories.includes(selectedCategory)) {
      const weightsInCategory = items
        .filter(item => item && item.category === selectedCategory && item.weight)
        .map(item => item.weight);
      
      const uniqueWeights = ['All', ...new Set(weightsInCategory)];
      setAvailableWeights(uniqueWeights);
    } else {
      setAvailableWeights(['All']);
    }
    setSelectedWeight('All');
  }, [selectedCategory, items]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await itemAPI.getAll();
      console.log('Fetched items response:', response);
      
      let itemsData = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          itemsData = response.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          itemsData = response.data.items;
        } else {
          itemsData = [];
        }
      }
      
      if (itemsData.length > 0 || Array.isArray(itemsData)) {
        const processedItems = itemsData.map(item => {
          if (!item) return null;
          
          let weight = item.weight;
          if (!weight) {
            const extractedWeight = extractWeightFromName(item.name);
            if (extractedWeight) {
              weight = extractedWeight;
            }
          }
          
          return {
            ...item,
            weight: weight
          };
        }).filter(item => item !== null);
        
        setItems(processedItems);
        const uniqueCategories = ['All', ...new Set(processedItems.map(item => item.category).filter(Boolean))];
        setCategories(uniqueCategories);
        
        if (processedItems.length > 0) {
          console.log(`Loaded ${processedItems.length} items`);
        }
      } else {
        setItems([]);
        setCategories(['All']);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      setItems([]);
      setCategories(['All']);
    } finally {
      setLoading(false);
    }
  };

  const extractWeightFromName = (name) => {
    if (!name) return null;
    
    const weightPatterns = [
      { pattern: /(\d+)\s*kg/i, unit: 'kg' },
      { pattern: /(\d+)\s*gm/i, unit: 'gm' },
      { pattern: /(\d+)\s*g/i, unit: 'gm' },
      { pattern: /(\d+)\s*kilogram/i, unit: 'kg' },
      { pattern: /250\s*gm/i, value: '250gm' },
      { pattern: /500\s*gm/i, value: '500gm' },
      { pattern: /1\s*kg/i, value: '1kg' },
      { pattern: /2\s*kg/i, value: '2kg' },
      { pattern: /5\s*kg/i, value: '5kg' },
      { pattern: /10\s*kg/i, value: '10kg' },
      { pattern: /25\s*kg/i, value: '25kg' }
    ];

    for (const patternObj of weightPatterns) {
      const match = name.match(patternObj.pattern);
      if (match) {
        if (patternObj.value) {
          return patternObj.value;
        }
        if (patternObj.unit) {
          return `${match[1]}${patternObj.unit}`;
        }
      }
    }
    
    return null;
  };

  const filterItems = () => {
    if (!Array.isArray(items)) {
      setFilteredItems([]);
      return;
    }
    
    let filtered = [...items];
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item && item.category === selectedCategory);
    }
    
    if (selectedWeight !== 'All' && weightBasedCategories.includes(selectedCategory)) {
      filtered = filtered.filter(item => item && item.weight === selectedWeight);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item && (
          (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.weight && item.weight.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    }
    
    setFilteredItems(filtered);
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
  };

  const openAddItemModal = () => {
    setFormData({
      name: '',
      price: '',
      category: '',
      weight: ''
    });
    setImageUrl('');
    setEditingItem(null);
    setShowItemModal(true);
  };

  const openEditItemModal = (item) => {
    setFormData({
      name: item.name || '',
      price: item.price || '',
      category: item.category || '',
      weight: item.weight || ''
    });
    setImageUrl(item.image || '');
    setEditingItem(item);
    setShowItemModal(true);
  };

  const openDeleteModal = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitItem = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category) {
      showAlert('Please fill in all required fields', 'warning');
      return;
    }

    setSubmitting(true);

    try {
      // Prepare item data
      const itemData = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        image: imageUrl || '' // Send image URL
      };
      
      // Add weight if selected
      if (formData.weight) {
        itemData.weight = formData.weight;
      }
      
      console.log('📤 Submitting item data:', itemData);
      
      let response;
      
      if (editingItem) {
        const itemId = editingItem._id || editingItem.id;
        console.log('🔄 Updating item with ID:', itemId);
        response = await itemAPI.update(itemId, itemData);
        showAlert('Item updated successfully', 'success');
      } else {
        console.log('➕ Creating new item');
        response = await itemAPI.create(itemData);
        showAlert('Item added successfully', 'success');
      }
      
      console.log('✅ Response:', response.data || response);
      
      setShowItemModal(false);
      await fetchItems();
      
    } catch (error) {
      console.error('❌ Error saving item:', error);
      
      let errorMessage = 'Error saving item. ';
      if (error.response) {
        console.error('Error response data:', error.response.data);
        errorMessage = `Server error (${error.response.status})`;
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Check if backend is running.';
      } else {
        errorMessage = error.message;
      }
      
      showAlert(errorMessage, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    
    try {
      const response = await itemAPI.delete(itemToDelete._id);
      console.log('Delete response:', response);
      showAlert('Item deleted successfully', 'success');
      setShowDeleteModal(false);
      await fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      
      let errorMessage = 'Error deleting item. ';
      if (error.response) {
        errorMessage += error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage += 'No response from server.';
      } else {
        errorMessage += error.message;
      }
      
      showAlert(errorMessage, 'danger');
    }
  };

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedWeight('All');
    setSearchTerm('');
  };

  const getCategoryCount = (category) => {
    if (!Array.isArray(items)) return 0;
    if (category === 'All') return items.length;
    return items.filter(item => item && item.category === category).length;
  };

  const getWeightLabel = (weightValue) => {
    const option = weightOptions.find(opt => opt.value === weightValue);
    return option ? option.label : weightValue;
  };

  const isWeightBasedCategory = (category) => {
    return weightBasedCategories.includes(category);
  };

  if (loading) {
    return (
      <Container fluid className="admin-container">
        <div className="loading-screen">
          <div className="loader"></div>
          <p className="loading-text">Loading inventory...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="admin-container">
      {alert.show && (
        <Alert variant={alert.type} className="alert-toast" dismissible onClose={() => setAlert({ ...alert, show: false })}>
          {alert.message}
        </Alert>
      )}

      <div className="admin-header">
        <div className="header-content">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Manage your inventory items</p>
        </div>
        
        <div className="header-actions">
          <button className="action-btn refresh-btn" onClick={fetchItems}>
            🔄 Refresh
          </button>
          <button className="action-btn add-btn" onClick={openAddItemModal}>
            ➕ Add New Item
          </button>
        </div>
      </div>

      <Row className="stats-row">
        <Col xs={12} sm={6} md={3}>
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <h3 className="stat-value">{Array.isArray(items) ? items.length : 0}</h3>
              <p className="stat-label">Total Items</p>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <div className="stat-card">
            <div className="stat-icon">🏷️</div>
            <div className="stat-content">
              <h3 className="stat-value">{categories.length - 1}</h3>
              <p className="stat-label">Categories</p>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3 className="stat-value">
                ₹{Array.isArray(items) ? items.reduce((sum, item) => sum + (Number(item?.price) || 0), 0).toFixed(2) : '0.00'}
              </h3>
              <p className="stat-label">Total Value</p>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <div className="stat-card">
            <div className="stat-icon">⚖️</div>
            <div className="stat-content">
              <h3 className="stat-value">
                {Array.isArray(items) ? items.filter(item => item?.weight).length : 0}
              </h3>
              <p className="stat-label">Weighted Items</p>
            </div>
          </div>
        </Col>
      </Row>

      <div className="filters-section">
        <Row>
          <Col md={3}>
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="clear-search" onClick={() => setSearchTerm('')}>
                  ✕
                </button>
              )}
            </div>
          </Col>
          
          <Col md={3}>
            <div className="category-filters">
              <select 
                className="filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category} ({getCategoryCount(category)})
                  </option>
                ))}
              </select>
            </div>
          </Col>
          
          <Col md={3}>
            {isWeightBasedCategory(selectedCategory) && (
              <div className="weight-filters">
                <select 
                  className="filter-select"
                  value={selectedWeight}
                  onChange={(e) => setSelectedWeight(e.target.value)}
                >
                  {availableWeights.map(weight => (
                    <option key={weight} value={weight}>
                      {weight === 'All' ? 'All Weights' : getWeightLabel(weight)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </Col>
          
          <Col md={3} className="text-end">
            {(selectedCategory !== 'All' || selectedWeight !== 'All' || searchTerm) && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                Clear All Filters
              </button>
            )}
          </Col>
        </Row>
      </div>

      <div className="table-container">
        {!Array.isArray(filteredItems) || filteredItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h4>No items found</h4>
            <p>
              {!Array.isArray(items) || items.length === 0 
                ? "Your inventory is empty. Click 'Add New Item' to get started."
                : "No items match your current filters. Try adjusting your search criteria."}
            </p>
            {(!Array.isArray(items) || items.length === 0) && (
              <button className="add-first-btn" onClick={openAddItemModal}>
                Add Your First Item
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Weight</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item._id || item.id}>
                    <td className="image-cell">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="item-thumbnail"
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/50?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="no-image" style={{
                          width: '50px',
                          height: '50px',
                          background: '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '8px'
                        }}>
                          📷
                        </div>
                      )}
                    </td>
                    <td className="name-cell">
                      <div className="item-name">{item.name}</div>
                    </td>
                    <td>
                      <Badge bg="info" className="category-badge">
                        {item.category}
                      </Badge>
                    </td>
                    <td>
                      {item.weight ? (
                        <Badge bg="secondary" className="weight-badge">
                          {getWeightLabel(item.weight)}
                        </Badge>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="price-cell">₹{Number(item.price).toFixed(2)}</td>
                    <td className="actions-cell">
                      <button 
                        className="action-icon edit-icon"
                        onClick={() => openEditItemModal(item)}
                        title="Edit Item"
                      >
                        ✏️
                      </button>
                      <button 
                        className="action-icon delete-icon"
                        onClick={() => openDeleteModal(item)}
                        title="Delete Item"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Item Modal */}
      <Modal show={showItemModal} onHide={() => setShowItemModal(false)} centered className="item-modal" size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitItem}>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Item Name <span className="required-star">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter item name (e.g., Basmati Rice)"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Category <span className="required-star">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    placeholder="e.g., Rice, Pulses, Spices"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Price (₹) <span className="required-star">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    placeholder="0.00"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Weight/Quantity (Optional)</Form.Label>
                  <Form.Select
                    name="weight"
                    value={formData.weight}
                    onChange={handleFormChange}
                  >
                    <option value="">Select weight/quantity</option>
                    {weightOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Select weight for items like Rice, Pulses, Grains. Leave empty for other items.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Image URL (Optional)</Form.Label>
                  <Form.Control
                    type="url"
                    name="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  <Form.Text className="text-muted">
                    Enter a direct URL to the item image (e.g., from Google Drive, Imgur, or any image hosting service)
                  </Form.Text>
                  {imageUrl && (
                    <div className="mt-2">
                      <small className="text-success">Preview:</small>
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100px', 
                          objectFit: 'contain',
                          display: 'block',
                          marginTop: '5px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          padding: '5px'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          document.getElementById('image-error').style.display = 'block';
                        }}
                      />
                      <div id="image-error" style={{ display: 'none', color: 'red', fontSize: '12px', marginTop: '5px' }}>
                        ⚠️ Invalid image URL. Please check the link.
                      </div>
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <div className="form-footer">
              <Button variant="secondary" onClick={() => setShowItemModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                className="save-btn"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered className="delete-modal">
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="delete-confirmation">
            <div className="delete-icon">⚠️</div>
            <h5>Are you sure you want to delete this item?</h5>
            {itemToDelete && (
              <div className="item-details">
                <p><strong>Name:</strong> {itemToDelete.name}</p>
                <p><strong>Category:</strong> {itemToDelete.category}</p>
                {itemToDelete.weight && (
                  <p><strong>Weight:</strong> {getWeightLabel(itemToDelete.weight)}</p>
                )}
                <p><strong>Price:</strong> ₹{Number(itemToDelete.price).toFixed(2)}</p>
              </div>
            )}
            <p className="delete-warning">
              This action cannot be undone. The item will be permanently removed from your inventory.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteItem}>
            Delete Item
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminPage;