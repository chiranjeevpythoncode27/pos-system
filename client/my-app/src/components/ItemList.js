import React from 'react';
import { Card, Button, Table, Badge } from 'react-bootstrap';

const ItemList = ({ items, onEdit, onDelete, onRefresh }) => {
  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0">Inventory Items</h5>
          <small className="text-muted">Manage your store inventory</small>
        </div>
        <div>
          <Button variant="outline-primary" size="sm" onClick={onRefresh} className="me-2">
            <i className="fas fa-sync-alt me-1"></i> Refresh
          </Button>
          <span className="text-muted">{items.length} items</span>
        </div>
      </Card.Header>
      <Card.Body>
        {items.length === 0 ? (
          <div className="text-center py-5">
            <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
            <p className="text-muted">No items found. Add some items to get started.</p>
          </div>
        ) : (
          <Table responsive striped hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td className="fw-semibold">{item.name}</td>
                  <td>${item.price?.toFixed(2)}</td>
                  <td>
                    <Badge bg="secondary">{item.category}</Badge>
                  </td>
                  <td>
                    <Badge bg={item.stock > 10 ? 'success' : item.stock > 0 ? 'warning' : 'danger'}>
                      {item.stock} in stock
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => onEdit(item)}
                    >
                      <i className="fas fa-edit me-1"></i> Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => onDelete(item._id)}
                    >
                      <i className="fas fa-trash me-1"></i> Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

export default ItemList;