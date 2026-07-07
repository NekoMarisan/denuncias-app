import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';

const mockLogin = jest.fn();

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, user: null }),
}));

jest.mock('../context/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

const renderLogin = () => {
  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

beforeEach(() => {
  mockLogin.mockReset();
  localStorage.clear();
});

test('bloquea el envio si los campos estan vacios', async () => {
  renderLogin();

  const botonIngresar = screen.getByRole('button', { name: /ingresar/i });
  fireEvent.click(botonIngresar);

  const mensajeError = await screen.findByText(/complete ambos campos/i);
  expect(mensajeError).toBeInTheDocument();
  expect(mockLogin).not.toHaveBeenCalled();
});

test('muestra error cuando las credenciales son incorrectas', async () => {
  mockLogin.mockResolvedValue({ success: false, error: 'Credenciales incorrectas' });
  renderLogin();

  const inputUsuario = screen.getByRole('textbox');
  const inputPassword = document.querySelector('input[type="password"]');

  fireEvent.change(inputUsuario, { target: { value: '12345' } });
  fireEvent.change(inputPassword, { target: { value: 'claveIncorrecta' } });

  const botonIngresar = screen.getByRole('button', { name: /ingresar/i });
  fireEvent.click(botonIngresar);

  await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('12345', 'claveIncorrecta'));

  const mensajeError = await screen.findByText(/credenciales incorrectas/i);
  expect(mensajeError).toBeInTheDocument();
});
