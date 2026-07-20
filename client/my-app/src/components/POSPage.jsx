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
  
  // Image handling
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null); // Keep track of file if needed
  
  const [availableWeights, setAvailableWeights] = useState(['All']);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    weight: ''
  });

  // Predefined weight options
  const weightOptions = [
    { value: '100gm', label: '100 gm' },
    { value: '250gm', label: '250 gm' },
    { value: '500gm', label: '500 gm' },
    { value: '1000', label: '1 kg' },
    { value: '2000', label: '2 kg' },
    { value: '5000', label: '5 kg' },
    { value: 'piece', label: 'Per Piece' },
    { value: 'dozen', label: 'Per Dozen' }
  ];

  // Categories that typically have weights
  const weightBasedCategories = ['Pulses', 'Masala', 'Dal', 'Rice', 'Flour', 'Grains', 'Spices', 'Sugar', 'Salt', 'Dry Fruits', 'Grocery'];

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
      
      let itemsData = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          itemsData = response.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          itemsData = response.data.items;
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
      { pattern: /250\s*gm/i, value: '250gm' },
      { pattern: /500\s*gm/i, value: '500gm' },
      { pattern: /1\s*kg/i, value: '1kg' },
    ];
    for (const patternObj of weightPatterns) {
      const match = name.match(patternObj.pattern);
      if (match) {
        if (patternObj.value) return patternObj.value;
        if (patternObj.unit) return `${match[1]}${patternObj.unit}`;
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
          (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
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
    setFormData({ name: '', price: '', category: '', weight: '' });
    setImageUrl('');
    setImageFile(null);
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
    setImageFile(null);
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

  // Handle Image Upload from File Input
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showAlert('Image is too large. Please select an image under 10MB.', 'warning');
        e.target.value = ''; // Reset input
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result); // Base64 string
        setImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
          showAlert('CSV file is empty or missing data rows.', 'warning');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('item'));
        const priceIdx = headers.findIndex(h => h.includes('price'));
        const catIdx = headers.findIndex(h => h.includes('category'));
        const weightIdx = headers.findIndex(h => h.includes('weight') || h.includes('qty'));

        if (nameIdx === -1 || priceIdx === -1 || catIdx === -1) {
          showAlert('CSV must contain Name, Price, and Category columns.', 'danger');
          return;
        }

        setImporting(true);
        setImportProgress({ current: 0, total: lines.length - 1 });
        
        let successCount = 0;
        
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',').map(col => col.trim());
          if (row.length < 3 || !row[nameIdx] || !row[priceIdx]) continue;
          
          const itemData = {
            name: row[nameIdx],
            price: parseFloat(row[priceIdx]) || 0,
            category: row[catIdx] || 'Uncategorized',
            image: '' 
          };
          if (weightIdx !== -1 && row[weightIdx]) {
            itemData.weight = row[weightIdx];
          }

          try {
            await itemAPI.create(itemData);
            successCount++;
          } catch (err) {
            console.error('Failed to import row', i, err);
          }
          setImportProgress({ current: i, total: lines.length - 1 });
        }
        
        showAlert(`Successfully imported ${successCount} items from CSV!`, 'success');
        await fetchItems();
      } catch (err) {
        showAlert('Error parsing CSV file.', 'danger');
      } finally {
        setImporting(false);
        e.target.value = null; // Reset input
      }
    };
    reader.readAsText(file);
  };

  const handleSubmitItem = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) {
      showAlert('Please fill in all required fields', 'warning');
      return;
    }
    setSubmitting(true);

    try {
      const itemData = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        image: imageUrl || '' // This will now be a Base64 string or an existing URL
      };
      
      if (formData.weight) {
        itemData.weight = formData.weight;
      }
      
      let response;
      if (editingItem) {
        const itemId = editingItem._id || editingItem.id;
        response = await itemAPI.update(itemId, itemData);
        showAlert('Item updated successfully', 'success');
      } else {
        response = await itemAPI.create(itemData);
        showAlert('Item added successfully', 'success');
      }
      
      setShowItemModal(false);
      await fetchItems();
    } catch (error) {
      console.error('Error saving item:', error);
      let errorMessage = 'Error saving item. ';
      if (error.response && error.response.status === 413) {
        errorMessage = 'Image is too large to save. Please choose a smaller photo.';
      } else if (error.response) {
        errorMessage = error.response.data?.message || `Server error (${error.response.status})`;
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
      await itemAPI.delete(itemToDelete._id);
      showAlert('Item deleted successfully', 'success');
      setShowDeleteModal(false);
      await fetchItems();
    } catch (error) {
      showAlert('Error deleting item', 'danger');
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

  if (loading) {
    return (
      <Container fluid className="admin-container">
        <div className="loading-screen">
          <div className="loader"></div>
          <p className="loading-text">Loading Dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="admin-container">
      {/* Toast Alert */}
      {alert.show && (
        <Alert variant={alert.type} className="alert-toast" dismissible onClose={() => setAlert({ ...alert, show: false })}>
          <div className="alert-content">
            {alert.type === 'success' ? '✅' : '⚠️'} {alert.message}
          </div>
        </Alert>
      )}

      {/* Header */}
      <div className="admin-header">
        <div className="header-content">
          <h1 className="page-title">Store Dashboard</h1>
          <p className="page-subtitle">Manage your inventory efficiently</p>
        </div>
        
        <div className="header-actions">
          <button className="action-btn refresh-btn" onClick={fetchItems}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.26l5.08 5.08"/></svg>
            Refresh
          </button>
          <input type="file" id="csv-upload" accept=".csv" style={{ display: 'none' }} onChange={handleCSVUpload} />
          <button className="action-btn" onClick={() => document.getElementById('csv-upload').click()} disabled={importing} style={{ background: '#f59e0b', color: 'white', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            {importing ? `Importing ${importProgress.current}/${importProgress.total}...` : 'Import CSV'}
          </button>
          <button className="action-btn add-btn" onClick={openAddItemModal}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add New Item
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="stats-row">
        <Col xs={12} sm={6} md={3}>
          <div className="stat-card">
            <div className="stat-icon-wrapper items">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Items</p>
              <h3 className="stat-value">{Array.isArray(items) ? items.length : 0}</h3>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <div className="stat-card">
            <div className="stat-icon-wrapper categories">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Categories</p>
              <h3 className="stat-value">{categories.length - 1}</h3>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <div className="stat-card">
            <div className="stat-icon-wrapper value">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Value</p>
              <h3 className="stat-value">
                ₹{Array.isArray(items) ? items.reduce((sum, item) => sum + (Number(item?.price) || 0), 0).toFixed(2) : '0.00'}
              </h3>
            </div>
          </div>
        </Col>
      </Row>

      {/* Filters */}
      <div className="filters-section">
        <Row className="g-3">
          <Col md={4}>
            <div className="search-box">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </Col>
          
          <Col md={3}>
            <select className="modern-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category} ({getCategoryCount(category)})
                </option>
              ))}
            </select>
          </Col>
          
          <Col md={3}>
            {weightBasedCategories.includes(selectedCategory) && (
              <select className="modern-select" value={selectedWeight} onChange={(e) => setSelectedWeight(e.target.value)}>
                {availableWeights.map(weight => (
                  <option key={weight} value={weight}>
                    {weight === 'All' ? 'All Weights' : getWeightLabel(weight)}
                  </option>
                ))}
              </select>
            )}
          </Col>
          
          <Col md={2} className="d-flex justify-content-end align-items-center">
            {(selectedCategory !== 'All' || selectedWeight !== 'All' || searchTerm) && (
              <button className="clear-filters-text" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </Col>
        </Row>
      </div>

      {/* Data Table */}
      <div className="table-card">
        {!Array.isArray(filteredItems) || filteredItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            </div>
            <h4>No items found</h4>
            <p>Your inventory is empty or no items match your search.</p>
            {(!Array.isArray(items) || items.length === 0) && (
              <button className="add-first-btn" onClick={openAddItemModal}>
                Add First Item
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{width: '70px'}}>Image</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Weight/Qty</th>
                  <th>Price</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item._id || item.id}>
                    <td>
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="item-thumbnail"
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&q=80'; }}
                        />
                      ) : (
                        <div className="no-image-thumb">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        </div>
                      )}
                    </td>
                    <td className="fw-semibold text-dark">{item.name}</td>
                    <td><span className="badge category-badge">{item.category}</span></td>
                    <td>
                      {item.weight ? (
                        <span className="badge weight-badge">{getWeightLabel(item.weight)}</span>
                      ) : <span className="text-muted">-</span>}
                    </td>
                    <td className="fw-bold text-success">₹{Number(item.price).toFixed(2)}</td>
                    <td className="text-end">
                      <button className="btn-action edit" onClick={() => openEditItemModal(item)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button className="btn-action delete" onClick={() => openDeleteModal(item)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Item Modal (Redesigned) */}
      <Modal show={showItemModal} onHide={() => setShowItemModal(false)} centered size="lg" className="premium-modal">
        <Modal.Header closeButton>
          <Modal.Title>{editingItem ? 'Edit Item Details' : 'Add New Item'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitItem}>
            <Row>
              <Col md={8}>
                {/* Text Inputs */}
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Item Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="e.g. Basmati Rice" required className="modern-input" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Category <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="text" name="category" value={formData.category} onChange={handleFormChange} placeholder="e.g. Grocery" required className="modern-input" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Price (₹) <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="number" step="0.01" min="0" name="price" value={formData.price} onChange={handleFormChange} placeholder="0.00" required className="modern-input" />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Weight/Quantity Variant (Optional)</Form.Label>
                      <Form.Select name="weight" value={formData.weight} onChange={handleFormChange} className="modern-input">
                        <option value="">No Variant / Default</option>
                        {weightOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Col>

              <Col md={4}>
                {/* Image Upload Area */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Item Photo</Form.Label>
                  <div className="image-upload-wrapper">
                    {imageUrl ? (
                      <div className="uploaded-image-preview">
                        <img src={imageUrl} alt="Preview" />
                        <button type="button" className="remove-image-btn" onClick={() => { setImageUrl(''); setImageFile(null); }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                    ) : (
                      <div className="image-upload-placeholder" onClick={() => document.getElementById('file-upload').click()}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        <span>Click to choose from gallery</span>
                        <small>Max size: 10MB</small>
                      </div>
                    )}
                    <input 
                      type="file" 
                      id="file-upload" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={handleImageUpload} 
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button variant="light" className="px-4 fw-semibold" onClick={() => setShowItemModal(false)}>Cancel</Button>
              <Button variant="success" type="submit" className="px-4 fw-semibold" disabled={submitting}>
                {submitting ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Modal (Redesigned) */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered className="premium-modal modal-sm">
        <Modal.Body className="text-center p-4">
          <div className="delete-icon-large text-danger mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <h4 className="fw-bold mb-2">Delete Item?</h4>
          <p className="text-muted mb-4">You are about to delete <strong>{itemToDelete?.name}</strong>. This action cannot be undone.</p>
          <div className="d-flex gap-2">
            <Button variant="light" className="flex-fill fw-semibold" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" className="flex-fill fw-semibold" onClick={handleDeleteItem}>Delete</Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AdminPage;