import { render, screen, fireEvent } from '@testing-library/react';
import DetalleAlerta from './DetalleAlerta';
import { ToastProvider } from '../../context/ToastContext';

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id_oficial: 1, rol: 'operador' } }),
}));

jest.mock('../../services/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: {}, error: null }),
        }),
      }),
    }),
  },
}));

const alertaMock = { id_alerta: 1, codigo_alerta: 'AL-001' };

const renderConContexto = (onEnviarDespacho) => {
  render(
    <ToastProvider>
      <DetalleAlerta
        alerta={alertaMock}
        onBack={() => {}}
        onEnviarDespacho={onEnviarDespacho}
        onDesestimar={() => {}}
      />
    </ToastProvider>
  );
};

test('bloquea el envio a despacho si no se selecciona clasificacion', async () => {
  const onEnviarDespacho = jest.fn();
  renderConContexto(onEnviarDespacho);

  const botonEnviar = await screen.findByText(/Enviar a Despacho/i);
  fireEvent.click(botonEnviar);

  expect(onEnviarDespacho).not.toHaveBeenCalled();
});

test('bloquea el envio a despacho si falta la prioridad', async () => {
  const onEnviarDespacho = jest.fn();
  renderConContexto(onEnviarDespacho);

  const selectDelito = await screen.findByDisplayValue(/Seleccionar Delito/i);
  fireEvent.change(selectDelito, { target: { value: selectDelito.options[1]?.value || '' } });

  const botonEnviar = screen.getByText(/Enviar a Despacho/i);
  fireEvent.click(botonEnviar);

  expect(onEnviarDespacho).not.toHaveBeenCalled();
});
