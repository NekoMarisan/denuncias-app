import { render, screen } from '@testing-library/react';
import App from './App';

test('renders el formulario de ingreso al sistema', () => {
  render(<App />);
  const tituloElement = screen.getByText(/Ingreso al Sistema/i);
  expect(tituloElement).toBeInTheDocument();
});

test('renders el campo de número de escalafón', () => {
  render(<App />);
  const labelElement = screen.getByText(/Número de Escalafón/i);
  expect(labelElement).toBeInTheDocument();
});

test('renders el botón de ingresar', () => {
  render(<App />);
  const botonElement = screen.getByText(/INGRESAR/i);
  expect(botonElement).toBeInTheDocument();
});