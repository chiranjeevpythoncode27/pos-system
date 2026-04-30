import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Button, Container } from 'react-bootstrap';

const Navbar = ({ onAddClick }) => {
  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg">
      <Container fluid>
        <BootstrapNavbar.Brand href="#">
          <i className="fas fa-cash-register me-2"></i>
          POS System
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="navbarNav" />
        <BootstrapNavbar.Collapse id="navbarNav">
          <Nav className="me-auto">
            <Nav.Link href="#">Dashboard</Nav.Link>
            <Nav.Link href="#">Inventory</Nav.Link>
            <Nav.Link href="#">Sales</Nav.Link>
            <Nav.Link href="#">Reports</Nav.Link>
          </Nav>
          <Button variant="outline-light" onClick={onAddClick}>
            <i className="fas fa-plus me-1"></i> Add Item
          </Button>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

// Make sure this is a default export
export default Navbar;